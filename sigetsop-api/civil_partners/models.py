from django.db import models


class CivilPartner(models.Model):
    first_name = models.CharField(max_length=128, verbose_name="Nombre(s)")
    last_name = models.CharField(max_length=128, verbose_name="Apellido Paterno")
    identity_card = models.CharField(
        max_length=20, unique=True, verbose_name="Cédula de Identidad"
    )
    date_of_birth = models.DateField(verbose_name="Fecha de Nacimiento")

    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.last_name} {self.first_name} (CI: {self.identity_card})"

    class Meta:
        db_table = "civil_partners"
        verbose_name = "Pareja Civil"
        verbose_name_plural = "Parejas Civiles"
        ordering = ["last_name", "first_name"]
