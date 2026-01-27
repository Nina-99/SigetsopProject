from django.db import models
from police_personnel.models import Personnel
from users.models import CustomUser

# Choice sets for fields like relationship_type and rh_factor
RELATIONSHIP_CHOICES = [
    ("officer", "Funcionario"),
    ("civil_partner", "Pareja Civil"),
]

RH_FACTOR_CHOICES = [
    ("A+", "A+"),
    ("A-", "A-"),
    ("B+", "B+"),
    ("B-", "B-"),
    ("AB+", "AB+"),
    ("AB-", "AB-"),
    ("O+", "O+"),
    ("O-", "O-"),
]


class PrenatalRecord(models.Model):
    # Foreign Key to Personnel
    personnel = models.ForeignKey(
        Personnel,
        on_delete=models.CASCADE,
        related_name="prenatal_records",
        verbose_name="personnel",
    )

    # Required fields
    relationship_type = models.CharField(
        max_length=50,
        choices=RELATIONSHIP_CHOICES,
        default="officer",
        verbose_name="relationship type",
    )
    civil_partner_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="civil partner name",
    )
    estimated_delivery_date = models.DateField(verbose_name="estimated delivery date")
    current_gestation_week = models.IntegerField(verbose_name="current gestation week")
    rh_factor = models.CharField(
        max_length=5,
        choices=RH_FACTOR_CHOICES,
        verbose_name="rh factor",
    )
    control_location = models.CharField(max_length=255, verbose_name="control location")

    # Optional fields
    observations = models.TextField(blank=True, verbose_name="observations")

    # Audit fields (following the pattern of Personnel model)
    is_active = models.BooleanField(default=True, verbose_name="is active")
    registration_date = models.DateTimeField(
        null=True, auto_now_add=True, verbose_name="registration date"
    )
    updated_at = models.DateTimeField(null=True, auto_now=True)

    user_created = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="prenatal_records_created",
        verbose_name="user created",
    )

    class Meta:
        db_table = "prenatal_records"
        ordering = ["-registration_date"]
        verbose_name = "Prenatal Record"
        verbose_name_plural = "Prenatal Records"

    def __str__(self):
        return f"Prenatal Record for {self.personnel.first_name} {self.personnel.last_name} ({self.registration_date.strftime('%Y-%m-%d')})"
