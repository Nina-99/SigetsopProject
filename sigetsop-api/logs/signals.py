#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
from django.contrib.auth.signals import user_logged_in
from django.utils.timezone import now

from .models import AccessLogin


def register_access(sender, request, user, **kwargs):
    AccessLogin.objects.create(
        user=user,
        ip=get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
        country="",  # puedes llenarlo usando geolocalización
        region="",
        date=now(),
    )


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


user_logged_in.connect(register_access)
