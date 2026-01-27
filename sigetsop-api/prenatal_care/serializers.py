from rest_framework import serializers
from .models import PrenatalRecord
from police_personnel.serializers import PersonnelSerializer


class PrenatalRecordSerializer(serializers.ModelSerializer):
    personnel = PersonnelSerializer(read_only=True)
    personnel_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = PrenatalRecord
        fields = [
            "id",
            "personnel",
            "personnel_id",
            "relationship_type",
            "civil_partner_name",
            "registration_date",
            "estimated_delivery_date",
            "current_gestation_week",
            "rh_factor",
            "control_location",
            "observations",
            "is_active",
            "updated_at",
        ]
        read_only_fields = ["registration_date", "updated_at"]

    def create(self, validated_data):
        validated_data["user_created"] = self.context["request"].user
        return super().create(validated_data)


class PrenatalRecordListSerializer(serializers.ModelSerializer):
    personnel_name = serializers.SerializerMethodField()

    class Meta:
        model = PrenatalRecord
        fields = [
            "id",
            "personnel_name",
            "relationship_type",
            "civil_partner_name",
            "registration_date",
            "estimated_delivery_date",
            "current_gestation_week",
            "rh_factor",
            "control_location",
            "observations",
            "is_active",
        ]

    def get_personnel_name(self, obj):
        return f"{obj.personnel.first_name} {obj.personnel.last_name}"
