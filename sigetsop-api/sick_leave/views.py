#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
import csv
from datetime import datetime

from django.http import HttpResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from weasyprint import HTML

from users.permissions import IsAdminOrAuxiliarSIT

from .models import SickLeave
from .serializers import SickLeaveSerializer


# Create your views here.
class SickLeaveViewSet(viewsets.ModelViewSet):
    queryset = SickLeave.objects.all().order_by("-created_at")
    serializer_class = SickLeaveSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user_created=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user_modified=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.deleted_at = timezone.now()
        instance.user_deleted = request.user
        instance.save()
        return Response(
            {"detail": "SickLeave deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )

    def get_queryset(self):
        if self.request.query_params.get("show_deleted") == "true":
            return SickLeave.objects.all()
        return SickLeave.objects.filter(deleted_at__isnull=True)


# Endpoints de exportación
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrAuxiliarSIT])
def export_sickleave_csv(request):
    """Exportar bajas médicas a CSV"""
    filter_status = request.query_params.get("filter_status", "active")

    # Filtrar por deleted_at
    if filter_status == "active":
        queryset = SickLeave.objects.filter(deleted_at__isnull=True)
    else:
        queryset = SickLeave.objects.filter(deleted_at__isnull=False)

    queryset = queryset.select_related(
        "personnel", "personnel__grade", "hospital"
    ).order_by("-created_at")

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = (
        f'attachment; filename="bajas_medicas_{datetime.now().strftime("%Y%m%d")}.csv"'
    )

    writer = csv.writer(response)
    writer.writerow(
        [
            "Grado",
            "Nombres",
            "Apellidos",
            "C.I.",
            "Clasificación",
            "Fecha Inicio",
            "Fecha Fin",
            "Días",
            "Hospital",
            "Traído Por",
            "Estado",
            "Creado",
        ]
    )

    for sick in queryset:
        p = sick.personnel
        days = ""
        if sick.start_date and sick.end_date:
            days = (sick.end_date - sick.start_date).days

        writer.writerow(
            [
                p.grade.grade_abbr if p and p.grade else "",
                p.first_name if p else "",
                f"{p.last_name} {p.maternal_name}" if p else "",
                p.identity_card if p else "",
                sick.classification,
                str(sick.start_date) if sick.start_date else "",
                str(sick.end_date) if sick.end_date else "",
                days,
                sick.hospital.name if sick.hospital else "",
                sick.brought_by,
                "Activo" if not sick.deleted_at else "Eliminado",
                str(sick.created_at)[:10] if sick.created_at else "",
            ]
        )

    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrAuxiliarSIT])
def export_sickleave_pdf(request):
    """Exportar bajas médicas a PDF"""
    filter_status = request.query_params.get("filter_status", "active")

    if filter_status == "active":
        queryset = SickLeave.objects.filter(deleted_at__isnull=True)
    else:
        queryset = SickLeave.objects.filter(deleted_at__isnull=False)

    queryset = queryset.select_related(
        "personnel", "personnel__grade", "hospital"
    ).order_by("-created_at")[:500]  # Limitar a 500 registros

    context = {
        "queryset": queryset,
        "title": "REPORTE DE BAJAS MÉDICAS",
        "date": timezone.now().strftime("%d/%m/%Y"),
        "time": timezone.now().strftime("%H:%M"),
        "filter_status": "Activos" if filter_status == "active" else "Eliminados",
        "total": queryset.count(),
    }

    html_string = render_to_string("sickleave_export.html", context)
    html = HTML(string=html_string)
    pdf_file = html.write_pdf()

    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = (
        f'attachment; filename="bajas_medicas_{datetime.now().strftime("%Y%m%d")}.pdf"'
    )
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrAuxiliarSIT])
def export_sickleave_all_json(request):
    """Exportar todas las bajas médicas como JSON"""
    filter_status = request.query_params.get("filter_status", "active")

    if filter_status == "active":
        queryset = SickLeave.objects.filter(deleted_at__isnull=True)
    else:
        queryset = SickLeave.objects.filter(deleted_at__isnull=False)

    queryset = queryset.select_related(
        "personnel", "personnel__grade", "hospital"
    ).order_by("-created_at")

    data = []
    for sick in queryset:
        p = sick.personnel
        days = ""
        if sick.start_date and sick.end_date:
            days = (sick.end_date - sick.start_date).days

        data.append(
            {
                "grade": p.grade.grade_abbr if p and p.grade else "",
                "first_name": p.first_name if p else "",
                "last_name": p.last_name if p else "",
                "maternal_name": p.maternal_name if p else "",
                "identity_card": p.identity_card if p else "",
                "classification": sick.classification,
                "start_date": str(sick.start_date) if sick.start_date else "",
                "end_date": str(sick.end_date) if sick.end_date else "",
                "days": days,
                "hospital": sick.hospital.name if sick.hospital else "",
                "brought_by": sick.brought_by,
                "status": "Activo" if not sick.deleted_at else "Eliminado",
                "created_at": str(sick.created_at)[:10] if sick.created_at else "",
            }
        )

    return Response(data)
