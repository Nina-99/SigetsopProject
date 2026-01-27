#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
from datetime import timedelta
from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


def get_default_expiration_time():
    return timezone.now() + timedelta(days=1)


class MobileSessionToken(models.Model):
    key = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=get_default_expiration_time)

    is_used = models.BooleanField(default=False)

    def is_valid(self):
        return timezone.now() < self.expires_at and not self.is_used


# from django.db import models
# from django.conf import settings
# from django.utils import timezone
# from datetime import timedelta
# import uuid
#
#
# def get_default_expiration_time():
#     """Devuelve la hora actual + 15 minutos."""
#     return timezone.now() + timedelta(minutes=15)
#
#
# # Create your models here.
# class MobileSessionToken(models.Model):
#     token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
#     # Enlace al usuario que está iniciando la sesión en la PC
#     user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
#
#     # Tóken único que se usará en el QR/enlace
#     key = models.CharField(max_length=64, unique=True, default=uuid.uuid4)
#
#     # La clave solo debe ser válida por un corto tiempo (ej: 5 minutos)
#     created_at = models.DateTimeField(auto_now_add=True)
#     expires_at = models.DateTimeField(default=get_default_expiration_time)
#
#     # Indica si el tóken ya fue utilizado
#     is_used = models.BooleanField(default=False)
#
#     def save(self, *args, **kwargs):
#         if not self.id:
#             # Establecer expiración a 5 minutos (ajustable)
#             self.expires_at = timezone.now() + timezone.timedelta(minutes=5)
#         super().save(*args, **kwargs)
#
#     def is_valid(self):
#         return timezone.now() < self.expires_at and not self.is_used
#
#     def __str__(self):
#         return f"Token for {self.user.username}"
