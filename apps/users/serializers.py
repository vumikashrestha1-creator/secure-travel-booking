from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from datetime import timedelta
from .models import User


# ── Registration ──────────────────────────────────────────────────
class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model  = User
        fields = [
            "email", "first_name", "last_name",
            "phone_number", "password", "password2",
        ]
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name":  {"required": True},
        }

    def validate_email(self, value):
        """Ensure email is lowercase and not already in use."""
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(**validated_data)
        return user


# ── Login ─────────────────────────────────────────────────────────
class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        email    = attrs.get("email", "").lower().strip()
        password = attrs.get("password")

        # Check if user exists first
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"email": "No account found with this email address."}
            )

        # Check account lock
        if user.is_account_locked():
            locked_until = user.account_locked_until.strftime("%H:%M:%S")
            raise serializers.ValidationError(
                {
                    "account": (
                        f"Account is temporarily locked due to too many "
                        f"failed login attempts. Try again after {locked_until}."
                    )
                }
            )

        # Authenticate
        authenticated_user = authenticate(
            request=self.context.get("request"),
            username=email,
            password=password,
        )

        if not authenticated_user:
            # Increment failed attempts
            user.failed_login_attempts += 1
            user.last_failed_login = timezone.now()

            # Lock after 5 failed attempts for 30 minutes
            if user.failed_login_attempts >= 5:
                user.account_locked_until = timezone.now() + timedelta(minutes=30)

            user.save(
                update_fields=[
                    "failed_login_attempts",
                    "last_failed_login",
                    "account_locked_until",
                ]
            )
            raise serializers.ValidationError(
                {"password": "Incorrect password. Please try again."}
            )

        if not authenticated_user.is_active:
            raise serializers.ValidationError(
                {"account": "This account has been deactivated."}
            )

        # Reset failed attempts on successful login
        if user.failed_login_attempts > 0:
            user.failed_login_attempts = 0
            user.account_locked_until  = None
            user.save(update_fields=["failed_login_attempts", "account_locked_until"])

        attrs["user"] = authenticated_user
        return attrs


# ── Profile (Read) ────────────────────────────────────────────────
class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = [
            "id", "email", "first_name", "last_name", "full_name",
            "phone_number", "date_of_birth", "profile_picture",
            "role", "is_verified", "date_joined",
        ]
        read_only_fields = ["id", "email", "role", "is_verified", "date_joined"]


# ── Profile (Update) ──────────────────────────────────────────────
class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ["first_name", "last_name", "phone_number", "date_of_birth", "profile_picture"]

    def validate_phone_number(self, value):
        if value and not value.replace("+", "").replace("-", "").replace(" ", "").isdigit():
            raise serializers.ValidationError("Enter a valid phone number.")
        return value


# ── Change Password ───────────────────────────────────────────────
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True, write_only=True, validators=[validate_password]
    )
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError(
                {"new_password": "New passwords do not match."}
            )
        return attrs

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value


# ── Admin: User List ──────────────────────────────────────────────
class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = [
            "id", "email", "first_name", "last_name", "role",
            "is_active", "is_verified", "date_joined",
            "failed_login_attempts", "account_locked_until",
        ]
        read_only_fields = ["id", "date_joined"]