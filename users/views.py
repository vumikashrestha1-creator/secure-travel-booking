# users/views.py

from apps.audit.models import AuditLog

from rest_framework              import generics, status, permissions
from rest_framework.response     import Response
from rest_framework.views        import APIView
from rest_framework_simplejwt.tokens  import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from django.contrib.auth         import get_user_model

from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user   = serializer.save()
            tokens = get_tokens_for_user(user)

            # ── Audit log: new registration ────────────────
            AuditLog.log(
                action      = AuditLog.Action.REGISTER,
                user        = user,
                request     = request,
                description = f"New account created for {user.email}",
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
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={"request": request}
        )
        if serializer.is_valid():
            user   = serializer.validated_data["user"]
            tokens = get_tokens_for_user(user)

            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])

            # ── Audit log: successful login ────────────────
            AuditLog.log(
                action      = AuditLog.Action.LOGIN,
                user        = user,
                request     = request,
                description = f"User {user.email} logged in successfully.",
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

        # ── Audit log: failed login ────────────────────────
        email = request.data.get("email", "unknown")
        AuditLog.log(
            action      = AuditLog.Action.LOGIN_FAILED,
            user        = None,
            request     = request,
            description = f"Failed login attempt for email: {email}",
            was_successful = False,
            extra_data  = {"attempted_email": email},
        )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

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

            # ── Audit log: logout ──────────────────────────
            AuditLog.log(
                action      = AuditLog.Action.LOGOUT,
                user        = request.user,
                request     = request,
                description = f"User {request.user.email} logged out.",
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


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/auth/profile/  → view profile
    PUT  /api/auth/profile/  → update profile
    Requires authentication.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UpdateProfileSerializer
        return UserProfileSerializer

    def get_object(self):
        return self.request.user   # Always return the logged-in user's profile


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Change password for logged-in user.
    Requires authentication.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user

        # Verify old password
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'Old password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response(
            {'message': 'Password changed successfully.'},
            status=status.HTTP_200_OK
        )
# Create your views here.
