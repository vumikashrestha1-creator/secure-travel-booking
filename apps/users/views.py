from apps.audit.models import AuditLog
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework              import status, generics
from rest_framework.response     import Response
from rest_framework.views        import APIView
from rest_framework.permissions  import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens   import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from django.utils import timezone

from .models       import User
from .serializers  import (
    RegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
    AdminUserSerializer,
)
from .permissions import IsAdmin


# ── Helpers ───────────────────────────────────────────────────────
def get_tokens_for_user(user):
    """Generate JWT access + refresh tokens for a given user."""
    refresh = RefreshToken.for_user(user)
    refresh["email"] = user.email
    refresh["role"]  = user.role
    refresh["name"]  = user.full_name
    return {
        "refresh": str(refresh),
        "access":  str(refresh.access_token),
    }


# ── Register ──────────────────────────────────────────────────────
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user   = serializer.save()
            tokens = get_tokens_for_user(user)

            # ── Audit log: new registration ────────────────────
            AuditLog.log(
                action         = AuditLog.Action.REGISTER,
                user           = user,
                request        = request,
                description    = f"New account created for {user.email}.",
                was_successful = True,
            )

            return Response(
                {
                    "message": "Account created successfully.",
                    "user": {
                        "id":        user.id,
                        "email":     user.email,
                        "full_name": user.full_name,
                        "role":      user.role,
                    },
                    "tokens": tokens,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Login ─────────────────────────────────────────────────────────
@method_decorator(
    ratelimit(key="ip", rate="5/m", method="POST", block=True),
    name="dispatch"
)
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            user   = serializer.validated_data["user"]
            tokens = get_tokens_for_user(user)

            # Update last login timestamp
            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])

            # ── Audit log: successful login ────────────────────
            AuditLog.log(
                action         = AuditLog.Action.LOGIN,
                user           = user,
                request        = request,
                description    = f"User {user.email} logged in successfully.",
                was_successful = True,
            )

            return Response(
                {
                    "message": "Login successful.",
                    "user": {
                        "id":        user.id,
                        "email":     user.email,
                        "full_name": user.full_name,
                        "role":      user.role,
                    },
                    "tokens": tokens,
                },
                status=status.HTTP_200_OK,
            )

        # ── Audit log: failed login ────────────────────────────
        email = request.data.get("email", "unknown")
        AuditLog.log(
            action         = AuditLog.Action.LOGIN_FAILED,
            user           = None,
            request        = request,
            description    = f"Failed login attempt for email: {email}",
            was_successful = False,
            extra_data     = {"attempted_email": email},
        )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ── Logout ────────────────────────────────────────────────────────
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()

            # ── Audit log: logout ──────────────────────────────
            AuditLog.log(
                action         = AuditLog.Action.LOGOUT,
                user           = request.user,
                request        = request,
                description    = f"User {request.user.email} logged out.",
                was_successful = True,
            )

            return Response(
                {"message": "Logged out successfully."},
                status=status.HTTP_200_OK,
            )
        except TokenError:
            return Response(
                {"error": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ── Profile (GET + PUT) ───────────────────────────────────────────
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = UpdateProfileSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Profile updated successfully.",
                    "user":    serializer.data
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Change Password ───────────────────────────────────────────────
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            request.user.set_password(
                serializer.validated_data["new_password"]
            )
            request.user.save()

            # ── Audit log: password changed ────────────────────
            AuditLog.log(
                action         = AuditLog.Action.PASSWORD_CHANGE,
                user           = request.user,
                request        = request,
                description    = f"Password changed for {request.user.email}.",
                was_successful = True,
            )

            return Response(
                {
                    "message": (
                        "Password changed successfully. "
                        "Please log in again."
                    )
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Admin: List All Users ─────────────────────────────────────────
class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class   = AdminUserSerializer
    queryset           = User.objects.all().order_by("-date_joined")

    def get_queryset(self):
        queryset = super().get_queryset()
        role     = self.request.query_params.get("role")
        search   = self.request.query_params.get("search")
        if role:
            queryset = queryset.filter(role=role.upper())
        if search:
            queryset = queryset.filter(email__icontains=search)
        return queryset


# ── Admin: Manage Single User ─────────────────────────────────────
class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = AdminUserSerializer(user)
        return Response(serializer.data)

    def patch(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = AdminUserSerializer(
            user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()

            # ── Audit log: user updated by admin ───────────────
            AuditLog.log(
                action         = AuditLog.Action.USER_DEACTIVATED
                                 if not serializer.validated_data.get(
                                     "is_active", True
                                 ) else AuditLog.Action.BOOKING_UPDATED,
                user           = request.user,
                request        = request,
                description    = f"Admin updated user ID {pk}.",
                was_successful = True,
                extra_data     = {"updated_user_id": pk},
            )

            return Response(
                {"message": "User updated.", "user": serializer.data}
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        user.is_active = False
        user.save()

        # ── Audit log: user deactivated ────────────────────────
        AuditLog.log(
            action         = AuditLog.Action.USER_DEACTIVATED,
            user           = request.user,
            request        = request,
            description    = f"Admin deactivated user {user.email}.",
            was_successful = True,
            extra_data     = {"deactivated_user": user.email},
        )

        return Response(
            {"message": "User deactivated successfully."},
            status=status.HTTP_200_OK,
        )