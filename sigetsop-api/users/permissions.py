from rest_framework import permissions


class IsAdminOrAuxiliarSIT(permissions.BasePermission):
    """
    Permission class that allows access to users with role 'Admin' or 'AuxiliarSIT'.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        user = request.user

        # Superusuarios tienen acceso total
        if user.is_superuser:
            return True

        # Verificar roles permitidos
        if hasattr(user, "role") and user.role:
            role_name = (
                user.role.name.lower()
                if hasattr(user.role, "name")
                else str(user.role).lower()
            )
            # Incluimos 'auxiliar' en la lista permitida
            return role_name in ["admin", "auxiliarsit", "auxiliar"]

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
