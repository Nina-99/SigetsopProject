#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import MobileSessionToken
from django.contrib.auth import login
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
import uuid


# Create your views here.

User = get_user_model()


class GenerateMobileTokenView(APIView):
    """
    Vista usada por el PC. Genera un token temporal para el móvil.
    """

    permission_classes = [IsAuthenticated]  # 🔥 AHORA SÍ FUNCIONA
    authentication_classes = []  # Usa Django Session Auth por defecto

    def post(self, request):

        token = MobileSessionToken.objects.create(
            user=request.user,  # 🔥 Ahora es CustomUser, ya no AnonymousUser
            device=request.data.get("device"),
            key=str(uuid.uuid4()),
            expires_at=timezone.now() + timezone.timedelta(minutes=5),
        )

        return Response({"token": token.key}, status=201)


class ConsumeMobileTokenView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request, token_key):
        try:
            token = MobileSessionToken.objects.get(key=token_key)
        except MobileSessionToken.DoesNotExist:
            return Response({"detail": "Token inválido"}, status=404)

        if not token.is_valid():
            return Response({"detail": "Token expirado"}, status=401)

        token.consumed = True
        token.save()

        return Response(
            {
                "detail": "Token válido",
                "user_id": token.user.id,
                "username": token.user.username,
            }
        )


# class GenerateMobileTokenView(APIView):
#     # Solo usuarios autenticados pueden generar un tóken
#     permission_classes = [IsAuthenticated]
#
#     def post(self, request):
#         # 1. Limpiar tókens viejos o usados del usuario
#         MobileSessionToken.objects.filter(
#             user=request.user, is_used=False, expires_at__lt=timezone.now()
#         ).delete()
#
#         # 2. Crear un nuevo tóken
#         token = MobileSessionToken.objects.create(user=request.user)
#
#         # 3. Retornar el tóken y su URL de consumo
#         # NOTA: Debes reemplazar 'http://tudominio.com/auth/mobile-login/' con tu URL real
#
#         # El tóken en sí
#         token_key = str(token.key)
#
#         # La URL completa que el móvil escaneará. Este es el ENLACE DE USO ÚNICO.
#         login_url = f"http://tudominio.com/auth/mobile-login/{token_key}/"
#
#         return Response(
#             {
#                 "token": token_key,
#                 "expires_in_minutes": 5,
#                 "qr_data_url": login_url,  # Este es el valor que se codifica en el QR
#             },
#             status=status.HTTP_201_CREATED,
#         )
#
#
# class ConsumeMobileTokenView(APIView):
#     # No se requiere autenticación previa, se autentica con el tóken
#     permission_classes = []
#
#     def post(self, request, token_key):
#         try:
#             token = MobileSessionToken.objects.get(key=token_key)
#         except MobileSessionToken.DoesNotExist:
#             raise AuthenticationFailed("Token de sesión inválido o inexistente.")
#
#         # 1. Validar el tóken
#         if not token.is_valid():
#             raise AuthenticationFailed("Token expirado o ya utilizado.")
#
#         # 2. Autenticar al usuario
#         user = token.user
#
#         # Django genera una nueva sesión para este navegador/dispositivo
#         # NOTA: Si usas DRF's Token Authentication, en lugar de login(request, user),
#         # deberías generar y devolver un nuevo DRF Token (Token.objects.create(user=user))
#
#         # Opción 1: Autenticación Basada en Sesión (si el móvil es un navegador)
#         # login(request, user)
#
#         # Opción 2: Autenticación Basada en Tóken de DRF (Recomendado para apps móviles/SPA)
#         from rest_framework.authtoken.models import Token
#
#         auth_token, created = Token.objects.get_or_create(user=user)
#
#         # 3. Marcar el tóken como usado para prevenir re-uso
#         token.is_used = True
#         token.save()
#
#         return Response(
#             {
#                 "user_id": user.id,
#                 "username": user.username,
#                 "auth_token": auth_token.key,  # Devuelve el tóken que el móvil usará en las cabeceras
#             },
#             status=status.HTTP_200_OK,
#         )
#
#
# class MobileUploadView(APIView):
#     parser_classes = [MultiPartParser, FormParser]
#     # No requerimos IsAuthenticated aquí, porque usaremos nuestro token personalizado.
#     # Si tu vista está protegida por defecto, tendrás que anularlo.
#
#     def post(self, request, format=None):
#         # 1. Obtener el token del encabezado personalizado (el que enviaste desde React)
#         mobile_token_str = request.headers.get("X-MOBILE-SESSION-TOKEN")
#
#         if not mobile_token_str:
#             # 🛑 NO AUTORIZADO (No hay token)
#             return Response(
#                 {"detail": "Token de sesión móvil requerido."},
#                 status=status.HTTP_401_UNAUTHORIZED,
#             )
#
#         try:
#             # Convertir el string del encabezado a objeto UUID
#             from uuid import UUID
#
#             mobile_token_uuid = UUID(mobile_token_str)
#         except ValueError:
#             # 🛑 NO AUTORIZADO (Formato de token inválido)
#             return Response(
#                 {"detail": "Token de sesión móvil inválido."},
#                 status=status.HTTP_401_UNAUTHORIZED,
#             )
#
#         # 2. Buscar y validar el token en la BD
#         try:
#             token_instance = MobileSessionToken.objects.get(token=mobile_token_uuid)
#         except MobileSessionToken.DoesNotExist:
#             return Response(
#                 {"detail": "Token de sesión no encontrado o ya expiró."},
#                 status=status.HTTP_404_NOT_FOUND,
#             )
#
#         if not token_instance.is_valid():
#             # 🛑 NO AUTORIZADO (Expirado o Usado)
#             return Response(
#                 {"detail": "Token de sesión expirado o ya utilizado."},
#                 status=status.HTTP_401_UNAUTHORIZED,
#             )
#
#         # 3. AUTENTICACIÓN EXITOSA - VINCULAR Y PROCESAR
#
#         # Si quieres que el token se use solo una vez:
#         # token_instance.is_used = True
#         # token_instance.save()
#
#         # Asignar el usuario de la sesión de escritorio (PC) a la request
#         request.user = token_instance.user
#
#         # 4. Lógica de Subida y Procesamiento (OCR)
#
#         uploaded_file = request.data.get("file")
#         points_json = request.data.get("points")  # Puntos corregidos del móvil
#
#         # ... Aquí va tu lógica para guardar el archivo,
#         # realizar la corrección geométrica con los 'points_json',
#         # y enviar el resultado final a la cola de Channels
#         # o procesarlo en la BD.
#
#         # Ejemplo:
#         # handle_image_upload_and_ocr(request.user, uploaded_file, points_json)
#
#         return Response(
#             {"detail": "Archivo recibido y en procesamiento."},
#             status=status.HTTP_200_OK,
#         )
