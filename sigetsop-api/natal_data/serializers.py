from rest_framework import serializers
from .models import NatalData
from civil_partners.models import CivilPartner
from civil_partners.serializers import CivilPartnerSerializer
from police_personnel.serializers import (
    PersonnelSerializer,
)  # Necesario para serializar Personnel en List


class NatalDataSerializer(serializers.ModelSerializer):
    # Campo anidado para CivilPartner. Solo se usa si relationship_type es 'civil_partner'
    civil_partner_data = CivilPartnerSerializer(required=False, write_only=True)

    # Añadimos un campo de sólo lectura para mostrar los datos de Personnel
    personnel_data = PersonnelSerializer(source="personnel", read_only=True)

    class Meta:
        model = NatalData
        fields = [
            "id",
            "personnel",
            "civil_partner",  # Nuevo campo
            "civil_partner_name",
            "relationship_type",
            "birthdate",
            "country",
            "department",
            "province",
            "locality",
            "nationality",
            "observations",
            "is_active",
            "registration_date",
            "updated_at",
            "user_created",
            "civil_partner_data",  # Campo de escritura para anidamiento
            "personnel_data",  # Campo de lectura
        ]
        extra_kwargs = {
            "personnel": {"required": False},  # Ahora es opcional
            "civil_partner": {
                "required": False,
                "read_only": True,
            },  # Se maneja a través de civil_partner_data
            "birthdate": {"required": True},
            "department": {"required": True},
            "province": {"required": True},
            "locality": {"required": True},
            "relationship_type": {"required": True},
        }

    def validate(self, data):
        """Validación cruzada para asegurar que solo haya personnel O civil_partner."""
        is_officer = data.get("relationship_type") == "officer"
        is_civil_partner = data.get("relationship_type") == "civil_partner"

        personnel_id = data.get("personnel")
        civil_partner_data = data.get("civil_partner_data")
        civil_partner_name = data.get("civil_partner_name")

        if is_officer and not personnel_id:
            raise serializers.ValidationError(
                {
                    "personnel": "Debe seleccionar un funcionario si el tipo de relación es 'Funcionario'."
                }
            )

        if is_civil_partner and not civil_partner_data and not civil_partner_name:
            # En caso de edición, si no se envía data, debe existir un civil_partner o un nombre
            if not self.instance or (
                not self.instance.civil_partner and not self.instance.civil_partner_name
            ):
                raise serializers.ValidationError(
                    {
                        "civil_partner_name": "Debe proporcionar el nombre o datos de la Pareja Civil si el tipo de relación es 'Pareja Civil'."
                    }
                )

        if is_officer and (civil_partner_data or civil_partner_name):
            raise serializers.ValidationError(
                {
                    "civil_partner": "No se pueden enviar datos de Pareja Civil si el tipo de relación es 'Funcionario'."
                }
            )

        if is_civil_partner and personnel_id:
            raise serializers.ValidationError(
                {
                    "personnel": "No se puede seleccionar un funcionario si el tipo de relación es 'Pareja Civil'."
                }
            )

        if not is_officer and not is_civil_partner:
            raise serializers.ValidationError(
                {"relationship_type": "Tipo de relación inválido."}
            )

        # Limpiar campos no usados en caso de edición
        if self.instance:
            if is_officer and self.instance.civil_partner:
                data["civil_partner"] = None
            if is_civil_partner and self.instance.personnel:
                data["personnel"] = None

        return data

    def create(self, validated_data):
        civil_partner_data = validated_data.pop("civil_partner_data", None)

        if civil_partner_data:
            # Intentar encontrar Pareja Civil por CI, sino crear
            ci = civil_partner_data.get("identity_card")
            try:
                civil_partner = CivilPartner.objects.get(identity_card=ci)
            except CivilPartner.DoesNotExist:
                civil_partner_serializer = CivilPartnerSerializer(
                    data=civil_partner_data
                )
                civil_partner_serializer.is_valid(raise_exception=True)
                civil_partner = civil_partner_serializer.save()

            validated_data["civil_partner"] = civil_partner
            # Asegurarse de que 'personnel' es None si es civil_partner
            validated_data["personnel"] = None
        elif validated_data.get("relationship_type") == "civil_partner":
            # Si no hay data de civil_partner_data, nos aseguramos que civil_partner sea None
            validated_data["civil_partner"] = None
            validated_data["personnel"] = None

        return super().create(validated_data)

    def update(self, instance, validated_data):
        civil_partner_data = validated_data.pop("civil_partner_data", None)

        # 1. Manejar la Pareja Civil
        if (
            validated_data.get("relationship_type") == "civil_partner"
            and civil_partner_data
        ):
            ci = civil_partner_data.get("identity_card")

            # Buscar o crear la pareja civil
            try:
                civil_partner = CivilPartner.objects.get(identity_card=ci)
                # Si encontramos, asegurarnos de que la instancia no cambie el CI de otra persona
                if (
                    instance.civil_partner
                    and instance.civil_partner.id != civil_partner.id
                ):
                    # Si ya tiene una pareja civil diferente, significa que CI enviado pertenece a otro, error
                    raise serializers.ValidationError(
                        {
                            "identity_card": "La CI proporcionada pertenece a otra Pareja Civil registrada."
                        }
                    )
            except CivilPartner.DoesNotExist:
                # Si no existe, crear la nueva pareja civil
                civil_partner_serializer = CivilPartnerSerializer(
                    data=civil_partner_data
                )
                civil_partner_serializer.is_valid(raise_exception=True)
                civil_partner = civil_partner_serializer.save()

            validated_data["civil_partner"] = civil_partner
            validated_data["personnel"] = None  # Limpiar la FK de personnel

            # Si ya existía y se proporcionó data, actualizar
            if instance.civil_partner:
                instance.civil_partner.first_name = civil_partner_data.get(
                    "first_name", instance.civil_partner.first_name
                )
                instance.civil_partner.last_name = civil_partner_data.get(
                    "last_name", instance.civil_partner.last_name
                )
                instance.civil_partner.date_of_birth = civil_partner_data.get(
                    "date_of_birth", instance.civil_partner.date_of_birth
                )
                instance.civil_partner.save()

        elif validated_data.get("relationship_type") == "civil_partner":
            # Si es civil_partner pero no se enviaron datos completos (solo nombre)
            validated_data["civil_partner"] = None
            validated_data["personnel"] = None

        # 2. Manejar Funcionario
        elif validated_data.get("relationship_type") == "officer":
            validated_data["civil_partner"] = None  # Limpiar la FK de civil_partner
            # personnel se mantiene si viene en validated_data o en instance

        return super().update(instance, validated_data)

    def to_representation(self, instance):
        """Serializar la Pareja Civil para lectura."""
        representation = super().to_representation(instance)

        if instance.civil_partner:
            representation["civil_partner_data"] = CivilPartnerSerializer(
                instance.civil_partner
            ).data
        elif instance.personnel:
            # Aquí no hacemos nada porque PersonnelSerializer(source='personnel', read_only=True) ya maneja esto.
            pass

        # Eliminamos el campo personnel si es pareja civil para lectura en el listado
        if instance.relationship_type == "civil_partner":
            representation.pop("personnel", None)
        elif instance.relationship_type == "officer":
            representation.pop("civil_partner", None)

        return representation


class NatalDataListSerializer(serializers.ModelSerializer):
    personnel_data = serializers.SerializerMethodField()
    civil_partner_data = (
        serializers.SerializerMethodField()
    )  # Nuevo campo para CivilPartner

    class Meta:
        model = NatalData
        fields = [
            "id",
            "personnel_data",
            "civil_partner_data",  # Añadido
            "civil_partner_name",
            "relationship_type",
            "birthdate",
            "country",
            "department",
            "province",
            "locality",
            "nationality",
            "observations",
            "is_active",
            "registration_date",
            "updated_at",
        ]

    def get_personnel_data(self, obj):
        if obj.personnel:
            # Se usaba obj.personnel.maternal_name que no existe en CivilPartner.
            # Ahora solo se usa si es Personnel.
            return {
                "id": obj.personnel.id,
                "first_name": obj.personnel.first_name,
                "last_name": obj.personnel.last_name,
                "maternal_name": obj.personnel.maternal_name,  # Solo existe en Personnel
                "identity_card": obj.personnel.identity_card,
            }
        return None

    def get_civil_partner_data(self, obj):
        if obj.civil_partner:
            return {
                "id": obj.civil_partner.id,
                "first_name": obj.civil_partner.first_name,
                "last_name": obj.civil_partner.last_name,
                "identity_card": obj.civil_partner.identity_card,
            }
        return None
