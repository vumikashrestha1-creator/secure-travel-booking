from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from .managers import CustomUserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model.
    - Uses email as the login identifier (not username)
    - Has three roles: ADMIN, CUSTOMER, TRAVEL_AGENT
    - Stores basic profile info
    """

    class Role(models.TextChoices):
        ADMIN         = "ADMIN",        "Admin"
        CUSTOMER      = "CUSTOMER",     "Customer"
        TRAVEL_AGENT  = "TRAVEL_AGENT", "Travel Agent"

    # ── Core fields ───────────────────────────────────────────────
    email        = models.EmailField(unique=True)
    first_name   = models.CharField(max_length=100)
    last_name    = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/", blank=True, null=True
    )

    # ── Role ──────────────────────────────────────────────────────
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )

    # ── Account status ────────────────────────────────────────────
    is_active    = models.BooleanField(default=True)
    is_staff     = models.BooleanField(default=False)
    is_verified  = models.BooleanField(default=False)  # email verified flag

    # ── Security tracking ─────────────────────────────────────────
    failed_login_attempts = models.IntegerField(default=0)
    last_failed_login     = models.DateTimeField(null=True, blank=True)
    account_locked_until  = models.DateTimeField(null=True, blank=True)

    # ── Timestamps ────────────────────────────────────────────────
    date_joined = models.DateTimeField(default=timezone.now)
    updated_at  = models.DateTimeField(auto_now=True)

    # ── Manager + Auth settings ───────────────────────────────────
    objects        = CustomUserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        db_table  = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering  = ["-date_joined"]

    def __str__(self):
        return f"{self.email} ({self.role})"

    # ── Helper properties ─────────────────────────────────────────
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER

    @property
    def is_travel_agent(self):
        return self.role == self.Role.TRAVEL_AGENT

    def is_account_locked(self):
        """Check if account is currently locked due to failed login attempts."""
        if self.account_locked_until and self.account_locked_until > timezone.now():
            return True
        return False