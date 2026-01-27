#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import AccessLogin
from .serializers import AccessLoginSerializer


# Create your views here.
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login con registro automático en AccessLogin
    """

    serializer_class = TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            user = self.get_user(request)  # obtener usuario desde credenciales
            ip = self.get_client_ip(request)
            user_agent = request.META.get("HTTP_USER_AGENT", "")

            print("🚀 Registrando login para:", user.username, ip)
            AccessLogin.objects.create(
                user=user,
                ip=ip,
                user_agent=user_agent,
                country=None,  # podrías llenar con geoip2
                region=None,
            )

        return response

    def get_user(self, request):
        # El serializer ya valida usuario con username/password
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return serializer.user

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip


class AccessLoginViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AccessLogin.objects.all()
    serializer_class = AccessLoginSerializer
    permission_classes = [IsAuthenticated]
