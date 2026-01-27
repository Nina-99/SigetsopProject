#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    SickLeaveViewSet,
    export_sickleave_csv,
    export_sickleave_pdf,
    export_sickleave_all_json,
)

router = DefaultRouter()
router.register(r"sick-leaves", SickLeaveViewSet, basename="sickleave")

urlpatterns = [
    path(
        "sick-leaves/export/csv/",
        export_sickleave_csv,
        name="sickleave-export-csv",
    ),
    path(
        "sick-leaves/export/pdf/",
        export_sickleave_pdf,
        name="sickleave-export-pdf",
    ),
    path(
        "sick-leaves/export/all/",
        export_sickleave_all_json,
        name="sickleave-export-all",
    ),
    path("", include(router.urls)),
]
