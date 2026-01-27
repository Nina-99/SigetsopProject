#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
import csv
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML
from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.permissions import IsAdminOrAuxiliarSIT


def generate_csv_response(queryset, filename, headers, row_data_func):
    """Genera una respuesta CSV desde un queryset"""
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = (
        f'attachment; filename="{filename}_{datetime.now().strftime("%Y%m%d")}.csv"'
    )
    writer = csv.writer(response)
    writer.writerow(headers)
    for obj in queryset:
        writer.writerow(row_data_func(obj))
    return response


def generate_pdf_response(queryset, template_name, filename, context_modifier=None):
    """Genera una respuesta PDF usando un template"""
    from django.utils import timezone

    context = {
        " queryset": queryset,
        "date": timezone.now().strftime("%d/%m/%Y"),
        "time": timezone.now().strftime("%H:%M"),
        "total": queryset.count(),
    }
    if context_modifier:
        context_modifier(context)

    html_string = render_to_string(template_name, context)
    html = HTML(string=html_string)
    pdf_file = html.write_pdf()

    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = (
        f'attachment; filename="{filename}_{datetime.now().strftime("%Y%m%d")}.pdf"'
    )
    return response


def generate_json_response(queryset, data_func):
    """Genera una respuesta JSON con datos serializables"""
    data = [data_func(obj) for obj in queryset]
    return Response(data)


# Decoradores reutilizables para endpoints de exportación
export_csv_permission = [IsAuthenticated, IsAdminOrAuxiliarSIT]
export_pdf_permission = [IsAuthenticated, IsAdminOrAuxiliarSIT]
export_json_permission = [IsAuthenticated, IsAdminOrAuxiliarSIT]


@api_view(["GET"])
@permission_classes(export_csv_permission)
def export_users_csv(request):
    """Exportar usuarios a CSV"""
    from users.models import CustomUser

    filter_status = request.query_params.get("filter_status", "True").lower() == "true"
    users = (
        CustomUser.objects.filter(is_active=filter_status)
        .select_related("role")
        .order_by("last_name", "first_name")
    )

    headers = [
        "Username",
        "Email",
        "Nombres",
        "Apellidos",
        "Teléfono",
        "Rol",
        "Activo",
        "Creado",
    ]

    def row_data(u):
        return [
            u.username,
            u.email,
            u.first_name,
            u.last_name,
            u.phone or "",
            u.role.name if u.role else "",
            u.is_active,
            str(u.created_at)[:10],
        ]

    return generate_csv_response(users, "usuarios", headers, row_data)


@api_view(["GET"])
@permission_classes(export_pdf_permission)
def export_users_pdf(request):
    """Exportar usuarios a PDF"""
    from users.models import CustomUser

    filter_status = request.query_params.get("filter_status", "True").lower() == "true"
    users = (
        CustomUser.objects.filter(is_active=filter_status)
        .select_related("role")
        .order_by("last_name", "first_name")
    )

    def context_modifier(ctx):
        ctx["title"] = "REPORTE DE USUARIOS"
        ctx["filter_status"] = "Activos" if filter_status else "Eliminados"

    return generate_pdf_response(
        users, "generic_export.html", "usuarios", context_modifier
    )


@api_view(["GET"])
@permission_classes(export_json_permission)
def export_users_all_json(request):
    """Exportar usuarios como JSON"""
    from users.models import CustomUser

    filter_status = request.query_params.get("filter_status", "True").lower() == "true"
    users = (
        CustomUser.objects.filter(is_active=filter_status)
        .select_related("role")
        .order_by("last_name", "first_name")
    )

    def data_func(u):
        return {
            "username": u.username,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "phone": u.phone or "",
            "role": u.role.name if u.role else "",
            "is_active": u.is_active,
        }

    return generate_json_response(users, data_func)
