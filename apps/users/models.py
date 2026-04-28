from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db                  import models
from django.utils               import timezone


# ── Custom User Manager ───────────────────────────────────────────
class UserManager(BaseUserManager):
    """
    Custom manager for the User model.
    Uses email instead of username for authentication.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email address is required.")
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff",     True)
        extra_fields.setdefault("is_superuser",  True)
        extra_fields.setdefault("role",          "ADMIN")
        extra_fields.setdefault("is_active",     True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


# ── Custom User Model ─────────────────────────────────────────────
class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for SafeNest Travel.
    Uses email as the primary identifier instead of username.
    Supports three roles: ADMIN, CUSTOMER, TRAVEL_AGENT.
    Includes MFA support for both Email OTP and TOTP (Authenticator App).
    """

    class Role(models.TextChoices):
        ADMIN        = "ADMIN",        "Administrator"
        CUSTOMER     = "CUSTOMER",     "Customer"
        TRAVEL_AGENT = "TRAVEL_AGENT", "Travel Agent"
        MANAGER      = "MANAGER",      "Manager" 

    # ── Basic Info ────────────────────────────────────────────────
    email      = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name  = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address      = models.CharField(max_length=255, blank=True, null=True)
    city         = models.CharField(max_length=100, blank=True, null=True)
    country      = models.CharField(max_length=100, blank=True, null=True)

    # ── Role ──────────────────────────────────────────────────────
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )

    # ── Account Status ────────────────────────────────────────────
    is_active    = models.BooleanField(default=True)
    is_staff     = models.BooleanField(default=False)
    date_joined  = models.DateTimeField(default=timezone.now)

    # ── Brute Force Protection ────────────────────────────────────
    failed_login_attempts = models.IntegerField(default=0)
    locked_until          = models.DateTimeField(null=True, blank=True)

    # ── MFA — General ─────────────────────────────────────────────
    mfa_enabled = models.BooleanField(
        default=False,
        help_text="If True user must verify OTP after password login"
    )
    mfa_type = models.CharField(
        max_length=20,
        choices=[
            ("EMAIL", "Email OTP"),
            ("TOTP",  "Authenticator App"),
        ],
        default="EMAIL",
        help_text="Which MFA method the user has enabled"
    )

    # ── MFA — Email OTP ───────────────────────────────────────────
    mfa_secret = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Current email OTP code (cleared after use)"
    )
    mfa_expiry = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the current email OTP expires"
    )

    # ── MFA — TOTP (Microsoft/Google Authenticator) ───────────────
    totp_secret = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        help_text="Secret key shared with the authenticator app"
    )
    totp_confirmed = models.BooleanField(
        default=False,
        help_text="True after user scans QR code and verifies first code"
    )

    # ── Django Required Fields ────────────────────────────────────
    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    class Meta:
        db_table         = "users"
        ordering         = ["-date_joined"]
        verbose_name     = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.email

    # ── Computed Properties ───────────────────────────────────────
    @property
    def full_name(self):
        """Return the user's full name."""
        return self.first_name + " " + self.last_name

    @property
    def is_locked(self):
        """
        Check if account is currently locked due to
        too many failed login attempts.
        """
        if self.locked_until and timezone.now() < self.locked_until:
            return True
        return False

    @property
    def is_admin(self):
        """Check if user has admin role."""
        return self.role == self.Role.ADMIN

    @property
    def is_customer(self):
        """Check if user has customer role."""
        return self.role == self.Role.CUSTOMER

    @property
    def is_travel_agent(self):
        """Check if user has travel agent role."""
        return self.role == self.Role.TRAVEL_AGENT

    @property
    def mfa_method_display(self):
        """Return human readable MFA method name."""
        if not self.mfa_enabled:
            return "Disabled"
        if self.mfa_type == "TOTP":
            return "Microsoft Authenticator"
        return "Email OTP"