from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from weasyprint import HTML
from datetime import datetime
import csv

from .models import PrenatalRecord
from .serializers import PrenatalRecordSerializer, PrenatalRecordListSerializer


class PrenatalRecordViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["personnel", "relationship_type", "rh_factor", "is_active"]
    search_fields = ["control_location", "observations"]
    ordering_fields = ["registration_date", "estimated_delivery_date"]
    ordering = ["-registration_date"]

    def get_queryset(self):
        queryset = PrenatalRecord.objects.filter(is_active=True)

        personnel_id = self.request.query_params.get("personnel_id")
        if personnel_id:
            queryset = queryset.filter(personnel_id=personnel_id)

        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return PrenatalRecordListSerializer
        return PrenatalRecordSerializer

    def perform_create(self, serializer):
        serializer.save(user_created=self.request.user)

    @action(detail=False, methods=["get"])
    def by_personnel(self, request):
        personnel_id = request.query_params.get("personnel_id")
        if not personnel_id:
            return Response(
                {"error": "personnel_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        records = self.get_queryset().filter(personnel_id=personnel_id)
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_prenatal_csv(request):
    """Exportar registros prenatales a CSV"""
    # Filtrar solo registros activos
    queryset = PrenatalRecord.objects.filter(is_active=True)

    # Opcional: filtrar por personnel_id si se proporciona
    personnel_id = request.query_params.get("personnel_id", None)
    if personnel_id:
        queryset = queryset.filter(personnel_id=personnel_id)

    queryset = queryset.select_related("personnel", "personnel__grade").order_by(
        "-registration_date"
    )

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = (
        f'attachment; filename="prenatal_records_{datetime.now().strftime("%Y%m%d")}.csv"'
    )

    writer = csv.writer(response)
    writer.writerow(
        [
            "Tipo Relación",
            "Grado",
            "Nombres",
            "Apellidos",
            "C.I.",
            "Nombre Pareja Civil",
            "Fecha Probable Parto",
            "Semana Gestación",
            "Factor RH",
            "Lugar Control",
            "Observaciones",
            "Fecha Registro",
        ]
    )

    for record in queryset:
        p = record.personnel

        # Determinar tipo de relación
        relationship = (
            "Funcionario" if record.relationship_type == "officer" else "Pareja Civil"
        )

        # Datos del funcionario (si aplica)
        grade = p.grade.grade_abbr if p and p.grade else ""
        first_name = f"{p.first_name} {p.middle_name or ''}".strip() if p else ""
        last_name = f"{p.last_name} {p.maternal_name}".strip() if p else ""
        identity_card = p.identity_card if p else ""

        writer.writerow(
            [
                relationship,
                grade,
                first_name,
                last_name,
                identity_card,
                record.civil_partner_name or "",
                str(record.estimated_delivery_date)[:10]
                if record.estimated_delivery_date
                else "",
                record.current_gestation_week or "",
                record.rh_factor or "",
                record.control_location or "",
                record.observations or "",
                str(record.registration_date)[:10] if record.registration_date else "",
            ]
        )

    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_prenatal_pdf(request):
    """Exportar registros prenatales a PDF"""
    # Filtrar solo registros activos
    queryset = PrenatalRecord.objects.filter(is_active=True)

    # Opcional: filtrar por personnel_id si se proporciona
    personnel_id = request.query_params.get("personnel_id", None)
    if personnel_id:
        queryset = queryset.filter(personnel_id=personnel_id)

    queryset = queryset.select_related("personnel", "personnel__grade").order_by(
        "-registration_date"
    )[:500]  # Limitar a 500 registros para PDF

    context = {
        "queryset": queryset,
        "title": "REPORTE DE CONTROL PRENATAL",
        "date": timezone.now().strftime("%d/%m/%Y"),
        "time": timezone.now().strftime("%H:%M"),
        "total": queryset.count(),
    }

    html_string = render_to_string("prenatal_export.html", context)
    html = HTML(string=html_string)
    pdf_file = html.write_pdf()

    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = (
        f'attachment; filename="prenatal_records_{datetime.now().strftime("%Y%m%d")}.pdf"'
    )
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_prenatal_all_json(request):
    """Exportar todos los registros prenatales como JSON"""
    # Filtrar solo registros activos
    queryset = PrenatalRecord.objects.filter(is_active=True)

    # Opcional: filtrar por personnel_id si se proporciona
    personnel_id = request.query_params.get("personnel_id", None)
    if personnel_id:
        queryset = queryset.filter(personnel_id=personnel_id)

    queryset = queryset.select_related("personnel", "personnel__grade").order_by(
        "-registration_date"
    )

    data = []
    for record in queryset:
        p = record.personnel
        data.append(
            {
                "relationship_type": record.relationship_type,
                "grade": p.grade.grade_abbr if p and p.grade else "",
                "first_name": f"{p.first_name} {p.middle_name or ''}".strip()
                if p
                else "",
                "last_name": f"{p.last_name} {p.maternal_name}".strip() if p else "",
                "identity_card": p.identity_card if p else "",
                "civil_partner_name": record.civil_partner_name or "",
                "estimated_delivery_date": str(record.estimated_delivery_date)[:10]
                if record.estimated_delivery_date
                else "",
                "current_gestation_week": record.current_gestation_week,
                "rh_factor": record.rh_factor,
                "control_location": record.control_location,
                "observations": record.observations or "",
                "registration_date": str(record.registration_date)[:10]
                if record.registration_date
                else "",
                "is_active": record.is_active,
            }
        )

    return Response(data)
