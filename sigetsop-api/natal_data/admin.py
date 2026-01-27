from django.contrib import admin
from .models import NatalData


@admin.register(NatalData)
class NatalDataAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "personnel",
        "relationship_type",
        "birthdate",
        "department",
        "province",
        "locality",
        "is_active",
        "registration_date",
    ]
    list_filter = ["relationship_type", "department", "is_active", "registration_date"]
    search_fields = [
        "province",
        "locality",
        "personnel__first_name",
        "personnel__last_name",
    ]
    list_editable = ["is_active"]
    readonly_fields = ["registration_date", "updated_at", "user_created"]

    fieldsets = (
        ("Datos del Registro", {"fields": ("personnel", "relationship_type")}),
        (
            "Datos de Nacimiento",
            {
                "fields": (
                    "birthdate",
                    "country",
                    "department",
                    "province",
                    "locality",
                    "nationality",
                )
            },
        ),
        ("Observaciones", {"fields": ("observations",)}),
        ("Estado", {"fields": ("is_active",)}),
        (
            "Información de Auditoría",
            {
                "fields": ("registration_date", "updated_at", "user_created"),
                "classes": ("collapse",),
            },
        ),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.user_created = request.user
        super().save_model(request, obj, form, change)
