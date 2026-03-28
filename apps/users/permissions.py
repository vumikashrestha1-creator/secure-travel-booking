from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to Admin users."""
    message = "Access restricted to administrators only."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsCustomer(BasePermission):
    """Allow access only to Customer users."""
    message = "Access restricted to customers only."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "CUSTOMER"
        )


class IsTravelAgent(BasePermission):
    """Allow access only to Travel Agents."""
    message = "Access restricted to travel agents only."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "TRAVEL_AGENT"
        )


class IsAdminOrTravelAgent(BasePermission):
    """Allow access to Admins and Travel Agents."""
    message = "Access restricted to administrators and travel agents."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "TRAVEL_AGENT"]
        )


class IsOwnerOrAdmin(BasePermission):
    """Allow access to object owner or Admin."""
    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        if request.user.role == "ADMIN":
            return True
        return obj == request.user