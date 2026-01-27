from rest_framework import permissions


class IsAdminOrAuxiliarSIT(permissions.BasePermission):
    """
    Permission class that allows access to users with role 'Admin' or 'AuxiliarSIT'.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        user = request.user
        # Check if user has a role and if it's Admin or AuxiliarSIT
        if hasattr(user, "role") and user.role:
            role_name = (
                user.role.name.lower()
                if hasattr(user.role, "name")
                else str(user.role).lower()
            )
            return role_name in ["admin", "auxiliarsit"]
        return False


class IsAdminOnly(permissions.BasePermission):
    """
    Permission class that allows access only to users with role 'Admin'.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        user = request.user
        if hasattr(user, "role") and user.role:
            role_name = (
                user.role.name.lower()
                if hasattr(user.role, "name")
                else str(user.role).lower()
            )
            return role_name == "admin"
        return False
