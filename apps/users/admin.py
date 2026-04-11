from django.contrib        import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin panel for SafeNest Travel User model.
    """
    list_display  = [
        "email", "full_name", "role",
        "is_active", "mfa_enabled", "mfa_type", "date_joined"
    ]
    list_filter   = [
        "role", "is_active", "mfa_enabled", "mfa_type"
    ]
    search_fields = ["email", "first_name", "last_name"]
    ordering      = ["-date_joined"]

    fieldsets = (
        ("Login Info", {
            "fields": ("email", "password")
        }),
        ("Personal Info", {
            "fields": ("first_name", "last_name")
        }),
        ("Role and Status", {
            "fields": ("role", "is_active", "is_staff", "is_superuser")
        }),
        ("MFA Settings", {
            "fields": (
                "mfa_enabled", "mfa_type",
                "mfa_secret", "mfa_expiry",
                "totp_secret", "totp_confirmed"
            )
        }),
        ("Security", {
            "fields": ("failed_login_attempts", "locked_until")
        }),
        ("Permissions", {
            "fields": ("groups", "user_permissions")
        }),
        ("Important Dates", {
            "fields": ("date_joined", "last_login")
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "email", "first_name", "last_name",
                "role", "password1", "password2"
            ),
        }),
    )

    readonly_fields = ["date_joined", "last_login"]