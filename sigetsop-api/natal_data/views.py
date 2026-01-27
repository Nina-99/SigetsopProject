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

from .models import NatalData
from .serializers import NatalDataSerializer, NatalDataListSerializer


class NatalDataViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["personnel", "relationship_type", "department", "is_active"]
    search_fields = ["province", "locality", "observations"]
    ordering_fields = ["registration_date", "birthdate"]
    ordering = ["-registration_date"]

    def get_queryset(self):
        return NatalData.objects.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == "list" or self.action == "retrieve":
            return NatalDataListSerializer
        return NatalDataSerializer

    def perform_create(self, serializer):
        serializer.save(user_created=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

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
def export_natal_csv(request):
    """Exportar datos natales a CSV"""
    # Filtrar solo registros activos
    queryset = NatalData.objects.filter(is_active=True)

    # Opcional: filtrar por personnel_id si se proporciona
    personnel_id = request.query_params.get("personnel_id", None)
    if personnel_id:
        queryset = queryset.filter(personnel_id=personnel_id)

    queryset = queryset.select_related(
        "personnel", "personnel__grade", "civil_partner"
    ).order_by("-registration_date")

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = (
        f'attachment; filename="natal_data_{datetime.now().strftime("%Y%m%d")}.csv"'
    )

    writer = csv.writer(response)
    writer.writerow(
        [
            "Tipo Relación",
            "Grado",
            "Nombres Completos",
            "Apellidos Completos",
            "C.I.",
            "Nombre Pareja Civil",
            "Fecha Nacimiento",
            "País",
            "Departamento",
            "Provincia",
            "Localidad",
            "Nacionalidad",
            "Observaciones",
            "Fecha Registro",
        ]
    )

    for record in queryset:
        # Determinar tipo de relación
        relationship = (
            "Funcionario" if record.relationship_type == "officer" else "Pareja Civil"
        )

        # Datos según el tipo de relación
        if record.relationship_type == "officer" and record.personnel:
            p = record.personnel
            grade = p.grade.grade_abbr if p.grade else ""
            first_name = f"{p.first_name} {p.middle_name or ''}".strip()
            last_name = f"{p.last_name} {p.maternal_name}".strip()
            identity_card = p.identity_card or ""
            civil_partner_name = ""
        elif record.civil_partner:
            cp = record.civil_partner
            grade = ""
            first_name = cp.first_name or ""
            last_name = f"{cp.last_name} {cp.maternal_name or ''}".strip()
            identity_card = cp.identity_card or ""
            civil_partner_name = f"{first_name} {last_name}".strip()
        else:
            grade = ""
            first_name = ""
            last_name = ""
            identity_card = ""
            civil_partner_name = record.civil_partner_name or ""

        writer.writerow(
            [
                relationship,
                grade,
                first_name,
                last_name,
                identity_card,
                civil_partner_name,
                str(record.birthdate)[:10] if record.birthdate else "",
                record.country or "",
                record.department or "",
                record.province or "",
                record.locality or "",
                record.nationality or "",
                record.observations or "",
                str(record.registration_date)[:10] if record.registration_date else "",
            ]
        )

    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_natal_pdf(request):
    """Exportar datos natales a PDF"""
    # Filtrar solo registros activos
    queryset = NatalData.objects.filter(is_active=True)

    # Opcional: filtrar por personnel_id si se proporciona
    personnel_id = request.query_params.get("personnel_id", None)
    if personnel_id:
        queryset = queryset.filter(personnel_id=personnel_id)

    queryset = queryset.select_related(
        "personnel", "personnel__grade", "civil_partner"
    ).order_by("-registration_date")[:500]  # Limitar a 500 registros para PDF

    context = {
        "queryset": queryset,
        "title": "REPORTE DE NATALIDAD Y LACTANCIA",
        "date": timezone.now().strftime("%d/%m/%Y"),
        "time": timezone.now().strftime("%H:%M"),
        "total": queryset.count(),
    }

    html_string = render_to_string("natal_export.html", context)
    html = HTML(string=html_string)
    pdf_file = html.write_pdf()

    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = (
        f'attachment; filename="natal_data_{datetime.now().strftime("%Y%m%d")}.pdf"'
    )
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_natal_all_json(request):
    """Exportar todos los datos natales como JSON"""
    # Filtrar solo registros activos
    queryset = NatalData.objects.filter(is_active=True)

    # Opcional: filtrar por personnel_id si se proporciona
    personnel_id = request.query_params.get("personnel_id", None)
    if personnel_id:
        queryset = queryset.filter(personnel_id=personnel_id)

    queryset = queryset.select_related(
        "personnel", "personnel__grade", "civil_partner"
    ).order_by("-registration_date")

    data = []
    for record in queryset:
        # Determinar tipo de relación y datos correspondientes
        if record.relationship_type == "officer" and record.personnel:
            p = record.personnel
            grade = p.grade.grade_abbr if p.grade else ""
            first_name = f"{p.first_name} {p.middle_name or ''}".strip()
            last_name = f"{p.last_name} {p.maternal_name}".strip()
            identity_card = p.identity_card or ""
            civil_partner_name = ""
        elif record.civil_partner:
            cp = record.civil_partner
            grade = ""
            first_name = cp.first_name or ""
            last_name = f"{cp.last_name} {cp.maternal_name or ''}".strip()
            identity_card = cp.identity_card or ""
            civil_partner_name = f"{first_name} {last_name}".strip()
        else:
            grade = ""
            first_name = ""
            last_name = ""
            identity_card = ""
            civil_partner_name = record.civil_partner_name or ""

        data.append(
            {
                "relationship_type": record.relationship_type,
                "grade": grade,
                "first_name": first_name,
                "last_name": last_name,
                "identity_card": identity_card,
                "civil_partner_name": civil_partner_name,
                "birthdate": str(record.birthdate)[:10] if record.birthdate else "",
                "country": record.country,
                "department": record.department,
                "province": record.province,
                "locality": record.locality,
                "nationality": record.nationality,
                "observations": record.observations or "",
                "registration_date": str(record.registration_date)[:10]
                if record.registration_date
                else "",
                "is_active": record.is_active,
            }
        )

    return Response(data)
