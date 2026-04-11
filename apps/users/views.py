from rest_framework              import status, generics
from rest_framework.response     import Response
from rest_framework.views        import APIView
from rest_framework.permissions  import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from django.utils import timezone

from .models      import User
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
)
from .otp         import create_otp_for_user, verify_otp_for_user
from .totp_helper import (
    generate_totp_secret,
    get_totp_uri,
    generate_qr_code_base64,
    verify_totp_code,
)
from apps.audit.models      import AuditLog
from apps.users.permissions import IsAdmin


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access":  str(refresh.access_token),
    }


def log_action(user, action, request, description=""):
    """
    Helper to create audit log entries.
    Uses correct field names from AuditLog model.
    """
    try:
        AuditLog.objects.create(
            user         = user,
            user_email   = user.email,
            action       = action,
            description  = description,
            ip_address   = request.META.get("REMOTE_ADDR", ""),
            user_agent   = request.META.get("HTTP_USER_AGENT", ""),
            was_successful = True,
        )
    except Exception as e:
        print("AuditLog error:", str(e))


# ── Register ──────────────────────────────────────────────────
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user   = serializer.save()
            tokens = get_tokens_for_user(user)
            log_action(user, "REGISTER", request,
                       "New user registered: " + user.email)
            return Response(
                {
                    "message": "Registration successful.",
                    "user":    UserProfileSerializer(user).data,
                    "tokens":  tokens,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ── Login ─────────────────────────────────────────────────────
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.validated_data["user"]

        # ── MFA is enabled ────────────────────────────────────
        if user.mfa_enabled:
            if user.mfa_type == "EMAIL":
                create_otp_for_user(user)
                message = (
                    "A verification code has been sent to "
                    + user.email
                )
            else:
                message = "Enter the code from your authenticator app"

            log_action(user, "LOGIN", request,
                       "MFA required for: " + user.email)

            return Response(
                {
                    "mfa_required": True,
                    "mfa_type":     user.mfa_type,
                    "user_id":      user.id,
                    "email":        user.email,
                    "message":      message,
                },
                status=status.HTTP_200_OK,
            )

        # ── No MFA — issue tokens directly ───────────────────
        tokens = get_tokens_for_user(user)
        log_action(user, "LOGIN", request,
                   "Successful login: " + user.email)
        return Response(
            {
                "mfa_required": False,
                "user":         UserProfileSerializer(user).data,
                "tokens":       tokens,
            },
            status=status.HTTP_200_OK,
        )


# ── Verify OTP ────────────────────────────────────────────────
class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id  = request.data.get("user_id")
        otp_code = request.data.get("otp_code", "").strip()

        if not user_id or not otp_code:
            return Response(
                {"error": "user_id and otp_code are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # ── TOTP verification ─────────────────────────────────
        if user.mfa_type == "TOTP" and user.totp_confirmed:
            if verify_totp_code(user.totp_secret, otp_code):
                tokens = get_tokens_for_user(user)
                log_action(user, "LOGIN", request,
                           "TOTP verified: " + user.email)
                return Response(
                    {
                        "message": "Verified successfully.",
                        "user":    UserProfileSerializer(user).data,
                        "tokens":  tokens,
                    },
                    status=status.HTTP_200_OK,
                )
            return Response(
                {"error": "Invalid code. Check your authenticator app."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Email OTP verification ────────────────────────────
        success, message = verify_otp_for_user(user, otp_code)
        if success:
            tokens = get_tokens_for_user(user)
            log_action(user, "LOGIN", request,
                       "Email OTP verified: " + user.email)
            return Response(
                {
                    "message": message,
                    "user":    UserProfileSerializer(user).data,
                    "tokens":  tokens,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": message},
            status=status.HTTP_400_BAD_REQUEST
        )


# ── Resend OTP ────────────────────────────────────────────────
class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get("user_id")
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not user.mfa_enabled or user.mfa_type != "EMAIL":
            return Response(
                {"error": "Email OTP is not enabled for this account."},
                status=status.HTTP_400_BAD_REQUEST
            )

        create_otp_for_user(user)
        return Response(
            {"message": "New code sent to " + user.email},
            status=status.HTTP_200_OK,
        )


# ── Toggle Email OTP ──────────────────────────────────────────
class ToggleMFAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        target_user_id = request.data.get("user_id")

        if target_user_id and request.user.role == "ADMIN":
            try:
                user = User.objects.get(pk=target_user_id)
            except User.DoesNotExist:
                return Response(
                    {"error": "User not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            user = request.user

        user.mfa_enabled = not user.mfa_enabled
        if user.mfa_enabled:
            user.mfa_type = "EMAIL"
        else:
            user.mfa_type   = "EMAIL"
            user.mfa_secret = None
            user.mfa_expiry = None

        user.save(update_fields=[
            "mfa_enabled", "mfa_type",
            "mfa_secret", "mfa_expiry"
        ])

        status_text = "enabled" if user.mfa_enabled else "disabled"
        return Response(
            {
                "message":     "Email OTP " + status_text + " successfully.",
                "mfa_enabled": user.mfa_enabled,
                "mfa_type":    user.mfa_type,
                "email":       user.email,
            },
            status=status.HTTP_200_OK,
        )


# ── Setup TOTP ────────────────────────────────────────────────
class SetupTOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user   = request.user
        secret = generate_totp_secret()
        uri    = get_totp_uri(user, secret)
        qr     = generate_qr_code_base64(uri)

        user.totp_secret    = secret
        user.totp_confirmed = False
        user.save(update_fields=["totp_secret", "totp_confirmed"])

        return Response(
            {
                "message":    "Scan the QR code with Microsoft Authenticator",
                "qr_code":    qr,
                "secret_key": secret,
            },
            status=status.HTTP_200_OK,
        )


# ── Confirm TOTP ──────────────────────────────────────────────
class ConfirmTOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get("code", "").strip()

        if not user.totp_secret:
            return Response(
                {"error": "No TOTP setup in progress."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not code:
            return Response(
                {"error": "Please enter the 6-digit code from your app."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if verify_totp_code(user.totp_secret, code):
            user.totp_confirmed = True
            user.mfa_enabled    = True
            user.mfa_type       = "TOTP"
            user.save(update_fields=[
                "totp_confirmed", "mfa_enabled", "mfa_type"
            ])
            return Response(
                {
                    "message":     "Authenticator linked. MFA is now enabled.",
                    "mfa_enabled": True,
                    "mfa_type":    "TOTP",
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": "Invalid code. Make sure your phone clock is correct."},
            status=status.HTTP_400_BAD_REQUEST
        )


# ── Disable TOTP ──────────────────────────────────────────────
class DisableTOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get("code", "").strip()

        if not user.mfa_enabled or user.mfa_type != "TOTP":
            return Response(
                {"error": "TOTP is not currently enabled."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not code:
            return Response(
                {"error": "Please enter your current authenticator code."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if verify_totp_code(user.totp_secret, code):
            user.mfa_enabled    = False
            user.mfa_type       = "EMAIL"
            user.totp_secret    = None
            user.totp_confirmed = False
            user.save(update_fields=[
                "mfa_enabled", "mfa_type",
                "totp_secret", "totp_confirmed"
            ])
            return Response(
                {
                    "message":     "Authenticator removed. MFA disabled.",
                    "mfa_enabled": False,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": "Invalid code. Please try again."},
            status=status.HTTP_400_BAD_REQUEST
        )


# ── Admin Disable MFA ─────────────────────────────────────────
class AdminDisableMFAView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        user.mfa_enabled    = False
        user.mfa_type       = "EMAIL"
        user.totp_secret    = None
        user.totp_confirmed = False
        user.mfa_secret     = None
        user.mfa_expiry     = None
        user.save(update_fields=[
            "mfa_enabled", "mfa_type",
            "totp_secret", "totp_confirmed",
            "mfa_secret", "mfa_expiry"
        ])

        return Response(
            {
                "message": "MFA disabled for " + user.email,
                "email":   user.email,
            },
            status=status.HTTP_200_OK,
        )


# ── Logout ────────────────────────────────────────────────────
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token         = RefreshToken(refresh_token)
            token.blacklist()
            log_action(request.user, "LOGOUT", request,
                       "User logged out: " + request.user.email)
            return Response(
                {"message": "Logged out successfully."},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"error": "Invalid token."},
                status=status.HTTP_400_BAD_REQUEST
            )


# ── Profile ───────────────────────────────────────────────────
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Profile updated.",
                    "user":    serializer.data,
                }
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ── Change Password ───────────────────────────────────────────
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request}
        )
        if serializer.is_valid():
            request.user.set_password(
                serializer.validated_data["new_password"]
            )
            request.user.save()
            return Response(
                {"message": "Password changed successfully."}
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ── Admin: List Users ─────────────────────────────────────────
class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        users      = User.objects.all().order_by("-date_joined")
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data)


# ── Admin: Deactivate User ────────────────────────────────────
class AdminUserDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user == request.user:
                return Response(
                    {"error": "Cannot deactivate your own account."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.is_active = False
            user.save()
            return Response(
                {"message": "User deactivated successfully."}
            )
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )