from django.urls import path, include
from rest_framework import routers
from .views import (
    PrenatalRecordViewSet,
    export_prenatal_csv,
    export_prenatal_pdf,
    export_prenatal_all_json,
)

router = routers.DefaultRouter()
router.register(r"prenatal_records", PrenatalRecordViewSet, basename="prenatal_record")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "prenatal_records/export/csv/", export_prenatal_csv, name="prenatal-export-csv"
    ),
    path(
        "prenatal_records/export/pdf/", export_prenatal_pdf, name="prenatal-export-pdf"
    ),
    path(
        "prenatal_records/export/all/",
        export_prenatal_all_json,
        name="prenatal-export-json",
    ),
]
