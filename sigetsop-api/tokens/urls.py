#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
from django.urls import path, re_path
from .views import GenerateMobileTokenView, ConsumeMobileTokenView

urlpatterns = [
    # PC usa esta ruta para pedir un tóken
    path(
        "generate-mobile-token/",
        GenerateMobileTokenView.as_view(),
        name="generate-mobile-token",
    ),
    # Móvil accede a esta ruta (ej. 'auth/mobile-login/1a2b3c4d/') y hace POST
    # Nota: Si el móvil navega a la URL, la vista de React debe capturar el tóken
    re_path(
        r"^consume-mobile-token/(?P<token_key>[^/]+)/?$",
        ConsumeMobileTokenView.as_view(),
        name="consume-mobile-token",
    ),
]
