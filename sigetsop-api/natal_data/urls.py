from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    NatalDataViewSet,
    export_natal_csv,
    export_natal_pdf,
    export_natal_all_json,
)

router = DefaultRouter()
router.register(r"natal_data", NatalDataViewSet, basename="natal_data")

urlpatterns = [
    path("natal_data/export/csv/", export_natal_csv, name="natal-export-csv"),
    path("natal_data/export/pdf/", export_natal_pdf, name="natal-export-pdf"),
    path("natal_data/export/all/", export_natal_all_json, name="natal-export-json"),
]
urlpatterns += router.urls
