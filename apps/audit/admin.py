from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """
    Shows all audit logs in the admin panel.
    Logs are read-only — you can view but never edit them.
    This is important for security — audit logs must
    never be tampered with.
    """
    list_display  = [
        "timestamp", "action", "user_email",
        "ip_address", "method", "endpoint", "was_successful"
    ]
    list_filter   = ["action", "was_successful", "method"]
    search_fields = ["user_email", "ip_address", "endpoint", "action"]
    ordering      = ["-timestamp"]
    readonly_fields = [
        "timestamp", "user", "user_email", "action",
        "description", "ip_address", "user_agent",
        "endpoint", "method", "was_successful", "extra_data"
    ]

    # Nobody can add, edit, or delete audit logs
    # They can only view them
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False