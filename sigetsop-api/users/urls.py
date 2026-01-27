#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import CustomTokenObtainPairView, RegisterView, RoleViewSet, UserViewSet
from .views import export_users_csv, export_users_pdf, export_users_all_json

router = DefaultRouter()
router.register("users", UserViewSet, basename="users")
router.register("roles", RoleViewSet, basename="roles")
router.register("register", RegisterView, basename="register")

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("login/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("users/export/csv/", export_users_csv, name="users-export-csv"),
    path("users/export/pdf/", export_users_pdf, name="users-export-pdf"),
    path("users/export/all/", export_users_all_json, name="users-export-all"),
    path("", include(router.urls)),
]
