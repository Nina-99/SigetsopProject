#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import PersonnelViewSet, PersonnelSearchAPIView
from .views import export_personnel_csv, export_personnel_pdf, export_personnel_all_json

router = DefaultRouter()
router.register(r"personnel", PersonnelViewSet, basename="personnel")

urlpatterns = [
    path(
        "personnel/search/", PersonnelSearchAPIView.as_view(), name="personnel-search"
    ),
    path("personnel/export/csv/", export_personnel_csv, name="personnel-export-csv"),
    path("personnel/export/pdf/", export_personnel_pdf, name="personnel-export-pdf"),
    path(
        "personnel/export/all/", export_personnel_all_json, name="personnel-export-all"
    ),
]
urlpatterns += router.urls
