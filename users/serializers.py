# users/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles new user registration.
    Validates password strength and confirms passwords match.
    """
    password  = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]   # Enforces Django password rules
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model  = User
        fields = [
            'email', 'first_name', 'last_name',
            'phone_number', 'role', 'password', 'password2'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name':  {'required': True},
        }

    def validate(self, attrs):
        # Check both passwords match
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {'password': 'Passwords do not match.'}
            )
        # Prevent self-assigning admin role on registration
        if attrs.get('role') == 'admin':
            raise serializers.ValidationError(
                {'role': 'You cannot register as an admin.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')   # Remove confirm password field
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Returns user profile data.
    Read-only — used for GET profile endpoint.
    """
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'full_name', 'phone_number', 'role',
            'profile_picture', 'is_verified', 'date_joined'
        ]
        read_only_fields = ['email', 'role', 'is_verified', 'date_joined']


class UpdateProfileSerializer(serializers.ModelSerializer):
    """
    Allows users to update their profile.
    Email and role cannot be changed here.
    """
    class Meta:
        model  = User
        fields = ['first_name', 'last_name', 'phone_number', 'profile_picture']


class ChangePasswordSerializer(serializers.Serializer):
    """
    Handles password change for logged-in users.
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError(
                {'new_password': 'New passwords do not match.'}
            )
        return attrs