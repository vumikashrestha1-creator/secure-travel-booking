# users/models.py

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    """
    Custom manager for our User model.
    Handles creating regular users and superusers.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)   # Hashes the password automatically
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model.
    Uses email instead of username for login.
    Has three roles: admin, customer, travel_agent.
    """

    # ── Role Choices ────────────────────────────────────────────
    ROLE_CHOICES = (
        ('admin',        'Admin'),
        ('customer',     'Customer'),
        ('travel_agent', 'Travel Agent'),
    )

    # ── Fields ──────────────────────────────────────────────────
    email        = models.EmailField(unique=True)
    first_name   = models.CharField(max_length=50)
    last_name    = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    role         = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

    # ── Account Status ───────────────────────────────────────────
    is_active    = models.BooleanField(default=True)
    is_staff     = models.BooleanField(default=False)
    is_verified  = models.BooleanField(default=False) 
    failed_login_attempts = models.IntegerField(default=0)
    last_failed_login     = models.DateTimeField(null=True, blank=True) # For email verification later

    # ── Timestamps ───────────────────────────────────────────────
    date_joined  = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    # ── Login Field ──────────────────────────────────────────────
    USERNAME_FIELD  = 'email'        # Login with email, not username
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f'{self.email} ({self.role})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'

    # ── Role Helper Properties ───────────────────────────────────
    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_customer(self):
        return self.role == 'customer'

    @property
    def is_travel_agent(self):
        return self.role == 'travel_agent'
# Create your models here.
