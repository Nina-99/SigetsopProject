#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CustomUser, Role
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    RoleSerializer,
    UserSerializer,
)


# Create your views here.
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    serializer_class = CustomTokenObtainPairSerializer
    # @classmethod
    # def get_token(cls, user):
    #     token = super().get_token(user)
    #     # Añadir datos personalizados al JWT
    #     token["username"] = user.username
    #     token["email"] = user.email
    #     if user.role:
    #         token["role"] = user.role.name
    #     return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def create(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]


class RegisterRoleView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def create(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by("id")
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user_created=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user_updated=self.request.user)

    def perform_destroy(self, instance):
        instance.user_deleted = self.request.user
        instance.deleted_at = timezone.now()
        instance.save()


# Endpoints de exportación
import csv
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML
from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from server.export_utils import IsAdminOrAuxiliarSIT


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrAuxiliarSIT])
def export_users_csv(request):
    """Exportar usuarios a CSV"""
    filter_status = request.query_params.get("filter_status", "True").lower() == "true"
    users = (
        CustomUser.objects.filter(is_active=filter_status)
        .select_related("role")
        .order_by("last_name", "first_name")
    )

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = (
        f'attachment; filename="usuarios_{datetime.now().strftime("%Y%m%d")}.csv"'
    )
    writer = csv.writer(response)
    writer.writerow(
        [
            "Username",
            "Email",
            "Nombres",
            "Apellidos",
            "Teléfono",
            "Rol",
            "Activo",
            "Creado",
        ]
    )

    for u in users:
        writer.writerow(
            [
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.phone or "",
                u.role.name if u.role else "",
                u.is_active,
                str(u.created_at)[:10],
            ]
        )

    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrAuxiliarSIT])
def export_users_pdf(request):
    """Exportar usuarios a PDF"""
    from django.utils import timezone

    filter_status = request.query_params.get("filter_status", "True").lower() == "true"
    users = (
        CustomUser.objects.filter(is_active=filter_status)
        .select_related("role")
        .order_by("last_name", "first_name")
    )

    context = {
        "queryset": users,
        "title": "REPORTE DE USUARIOS",
        "date": timezone.now().strftime("%d/%m/%Y"),
        "time": timezone.now().strftime("%H:%M"),
        "filter_status": "Activos" if filter_status else "Eliminados",
        "total": users.count(),
    }

    html_string = render_to_string("generic_export.html", context)
    html = HTML(string=html_string)
    pdf_file = html.write_pdf()

    response = HttpResponse(pdf_file, content_type="application/pdf")
    response["Content-Disposition"] = (
        f'attachment; filename="usuarios_{datetime.now().strftime("%Y%m%d")}.pdf"'
    )
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrAuxiliarSIT])
def export_users_all_json(request):
    """Exportar usuarios como JSON"""
    filter_status = request.query_params.get("filter_status", "True").lower() == "true"
    users = (
        CustomUser.objects.filter(is_active=filter_status)
        .select_related("role")
        .order_by("last_name", "first_name")
    )

    data = []
    for u in users:
        data.append(
            {
                "username": u.username,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "phone": u.phone or "",
                "role": u.role.name if u.role else "",
                "is_active": u.is_active,
            }
        )

    return Response(data)
