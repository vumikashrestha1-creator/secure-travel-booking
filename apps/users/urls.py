from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [

    # ── Authentication ────────────────────────────────────────
    path("register/",       views.RegisterView.as_view(),      name="register"),
    path("login/",          views.LoginView.as_view(),         name="login"),
    path("logout/",         views.LogoutView.as_view(),        name="logout"),
    path("token/refresh/",  TokenRefreshView.as_view(),        name="token_refresh"),

    # ── Email OTP MFA ─────────────────────────────────────────
    path("verify-otp/",     views.VerifyOTPView.as_view(),     name="verify_otp"),
    path("resend-otp/",     views.ResendOTPView.as_view(),     name="resend_otp"),
    path("toggle-mfa/",     views.ToggleMFAView.as_view(),     name="toggle_mfa"),

    # ── TOTP Authenticator App MFA ────────────────────────────
    path("setup-totp/",     views.SetupTOTPView.as_view(),     name="setup_totp"),
    path("confirm-totp/",   views.ConfirmTOTPView.as_view(),   name="confirm_totp"),
    path("disable-totp/",   views.DisableTOTPView.as_view(),   name="disable_totp"),

    # ── Profile ───────────────────────────────────────────────
    path("profile/",        views.ProfileView.as_view(),       name="profile"),
    path("change-password/",views.ChangePasswordView.as_view(),name="change_password"),

    # ── Admin: User Management ────────────────────────────────
    path("admin/users/",
         views.AdminUserListView.as_view(),
         name="admin_users"),

    # NEW — admin can create a new user with any role
    path("admin/users/create/",
         views.AdminCreateUserView.as_view(),
         name="admin_create_user"),

    path("admin/users/<int:pk>/",
         views.AdminUserDeleteView.as_view(),
         name="admin_user_delete"),

    # NEW — admin can update any user's role
    path("admin/users/<int:pk>/role/",
         views.AdminUpdateUserRoleView.as_view(),
         name="admin_update_user_role"),
        
	path("admin/users/<int:pk>/reset-password/",
         views.AdminResetPasswordView.as_view(),
         name="admin_reset_password"),


    path("admin/users/<int:pk>/disable-mfa/",
         views.AdminDisableMFAView.as_view(),
         name="admin_disable_mfa"),
]