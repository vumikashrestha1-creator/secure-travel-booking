from rest_framework  import serializers
from django.utils    import timezone
from .models         import User


# ── Registration Serializer ───────────────────────────────────
class UserRegistrationSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"}
    )
    password2 = serializers.CharField(
        write_only=True,
        style={"input_type": "password"}
    )

    class Meta:
        model  = User
        fields = [
            "email", "first_name", "last_name",
            "password", "password2"
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return value.lower()

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password2": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        user     = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ── Login Serializer ──────────────────────────────────────────
class UserLoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"}
    )

    def validate(self, attrs):
        email    = attrs.get("email", "").lower().strip()
        password = attrs.get("password", "")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "No account found with this email address."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account has been deactivated."
            )

        if user.is_locked:
            raise serializers.ValidationError(
                "Account is temporarily locked. Please try again later."
            )

        if not user.check_password(password):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                from datetime import timedelta
                user.locked_until = (
                    timezone.now() + timedelta(minutes=30)
                )
            user.save(update_fields=[
                "failed_login_attempts", "locked_until"
            ])
            raise serializers.ValidationError(
                "Incorrect password. Please try again."
            )

        if user.failed_login_attempts > 0:
            user.failed_login_attempts = 0
            user.locked_until          = None
            user.save(update_fields=[
                "failed_login_attempts", "locked_until"
            ])

        attrs["user"] = user
        return attrs


# ── Profile Serializer ────────────────────────────────────────
class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "is_active",
            "mfa_enabled",
            "mfa_type",
            "totp_confirmed",
            "date_joined",
            "phone_number",
            "address",
            "city",
            "country",
        ]
        read_only_fields = [
            "id",
            "email",
            "role",
            "is_active",
            "mfa_enabled",
            "mfa_type",
            "totp_confirmed",
            "date_joined",
        ]


# ── Change Password Serializer ────────────────────────────────
class ChangePasswordSerializer(serializers.Serializer):
    old_password  = serializers.CharField(
        write_only=True,
        style={"input_type": "password"}
    )
    new_password  = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"}
    )
    new_password2 = serializers.CharField(
        write_only=True,
        style={"input_type": "password"}
    )

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                "Current password is incorrect."
            )
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError(
                {"new_password2": "New passwords do not match."}
            )
        if attrs["new_password"] == attrs["old_password"]:
            raise serializers.ValidationError(
                {
                    "new_password": (
                        "New password must be different "
                        "from your current password." # nosec B105 - This message is not revealing any sensitive information, just a generic password policy reminder.
                    )
                }
            )
        return attrs