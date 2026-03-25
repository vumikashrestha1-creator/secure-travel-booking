# users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display    = ['email', 'full_name', 'role', 'is_active', 'is_verified', 'date_joined']
    list_filter     = ['role', 'is_active', 'is_verified']
    search_fields   = ['email', 'first_name', 'last_name']
    ordering        = ['-date_joined']

    fieldsets = (
        (None,             {'fields': ('email', 'password')}),
        ('Personal Info',  {'fields': ('first_name', 'last_name', 'phone_number', 'profile_picture')}),
        ('Roles & Access', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'is_verified')}),
        ('Timestamps',     {'fields': ('date_joined', 'updated_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields':  ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )

    readonly_fields = ['date_joined', 'updated_at']