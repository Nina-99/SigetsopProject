from django.db import models
from police_personnel.models import Personnel
from users.models import CustomUser
from civil_partners.models import CivilPartner

RELATIONSHIP_CHOICES = [
    ("officer", "Funcionario"),
    ("civil_partner", "Pareja Civil"),
]

DEPARTMENT_CHOICES = [
    ("la_paz", "La Paz"),
    ("cochabamba", "Cochabamba"),
    ("santa_cruz", "Santa Cruz"),
    ("oru", "Oruro"),
    ("potosi", "Potosí"),
    ("tarija", "Tarija"),
    ("chuquisaca", "Chuquisaca"),
    ("beni", "Beni"),
    ("pando", "Pando"),
]


class NatalData(models.Model):
    personnel = models.ForeignKey(
        Personnel,
        on_delete=models.SET_NULL,  # Cambiado de CASCADE a SET_NULL para permitir la eliminación del registro de personal sin eliminar los datos natales
        null=True,  # Ahora es opcional
        blank=True,  # Ahora es opcional
        related_name="natal_data_records",
        verbose_name="personnel",
    )

    civil_partner = models.ForeignKey(
        CivilPartner,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="natal_data_records",
        verbose_name="civil partner",
    )

    civil_partner_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="civil partner name",
    )

    relationship_type = models.CharField(
        max_length=50,
        choices=RELATIONSHIP_CHOICES,
        default="officer",
        verbose_name="relationship type",
    )

    birthdate = models.DateField(verbose_name="birthdate")
    country = models.CharField(
        max_length=100, default="BOLIVIA", verbose_name="country"
    )
    department = models.CharField(
        max_length=50,
        choices=DEPARTMENT_CHOICES,
        verbose_name="department",
    )
    province = models.CharField(max_length=100, verbose_name="province")
    locality = models.CharField(max_length=100, verbose_name="locality")

    nationality = models.CharField(
        max_length=50,
        default="BOLIVIANA",
        verbose_name="nationality",
    )

    observations = models.TextField(blank=True, verbose_name="observations")

    is_active = models.BooleanField(default=True, verbose_name="is active")
    registration_date = models.DateTimeField(
        null=True,
        auto_now_add=True,
        verbose_name="registration date",
    )
    updated_at = models.DateTimeField(null=True, auto_now=True)

    user_created = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="natal_data_created",
        verbose_name="user created",
    )

    class Meta:
        db_table = "natal_data"
        ordering = ["-registration_date"]
        verbose_name = "Natal Data"
        verbose_name_plural = "Natal Data Records"

    def __str__(self):
        if self.personnel:
            name = f"{self.personnel.last_name} {self.personnel.first_name}"
        elif self.civil_partner:
            name = f"{self.civil_partner.last_name} {self.civil_partner.first_name}"
        else:
            name = "Sin persona asociada"
        return f"Natal Data - {self.get_relationship_type_display()} - {name}"

    def save(self, *args, **kwargs):
        if self.country:
            self.country = self.country.upper()
        if self.province:
            self.province = self.province.upper()
        if self.locality:
            self.locality = self.locality.upper()
        if self.nationality:
            self.nationality = self.nationality.upper()
        if self.observations:
            self.observations = self.observations.upper()
        super().save(*args, **kwargs)
