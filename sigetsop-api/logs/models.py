#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
from django.db import models

from users.models import CustomUser


# Create your models here.
class AccessLogin(models.Model):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="id_user",
        related_name="logins",
    )
    ip = models.CharField(max_length=45, null=True, blank=True, verbose_name="IP")
    user_agent = models.TextField(null=True, blank=True, verbose_name="User Agent")
    country = models.CharField(
        max_length=100, null=True, blank=True, verbose_name="country"
    )
    region = models.CharField(
        max_length=100, null=True, blank=True, verbose_name="region"
    )
    date = models.DateTimeField(auto_now_add=True, verbose_name="date access")

    class Meta:
        db_table = "access_login"
        ordering = ["-date"]
        verbose_name = "Access Login"
        verbose_name_plural = "Access Logins"

    def __str__(self):
        return f"{self.user} - {self.ip} ({self.date})"
