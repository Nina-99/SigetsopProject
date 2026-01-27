#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
from django.apps import AppConfig


class AccessConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "logs"

    def ready(self):
        import logs.signals
