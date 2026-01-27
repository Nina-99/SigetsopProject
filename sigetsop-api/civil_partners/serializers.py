from rest_framework import serializers
from .models import CivilPartner


class CivilPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = CivilPartner
        fields = [
            "id",
            "first_name",
            "last_name",
            "identity_card",
            "date_of_birth",
        ]
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
            "identity_card": {"required": True},
            "date_of_birth": {"required": True},
        }

    def validate_identity_card(self, value):
        # Asegurarse de que CI sea único al crear
        if (
            self.instance is None
            and CivilPartner.objects.filter(identity_card=value).exists()
        ):
            raise serializers.ValidationError(
                "Ya existe una pareja civil registrada con esta Cédula de Identidad."
            )
        return value
