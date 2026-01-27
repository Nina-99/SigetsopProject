#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
from rest_framework import serializers

from grades.models import Grade
from police_personnel.models import Personnel
from police_unit.models import Units

from .models import AffiliationAVC09


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ["id", "grade_abbr"]


class UnitsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Units
        fields = ["id", "name", "assistant"]


class PersonnelSerializer(serializers.ModelSerializer):
    grade_data = GradeSerializer(source="grade", read_only=True)
    units_data = UnitsSerializer(source="current_destination", read_only=True)

    grade = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), write_only=True, required=False, allow_null=True
    )
    current_destination = serializers.PrimaryKeyRelatedField(
        queryset=Units.objects.all(), write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Personnel
        fields = [
            "id",
            "grade_data",
            "grade",
            "last_name",
            "maternal_name",
            "first_name",
            "middle_name",
            "phone",
            "units_data",
            "current_destination",
        ]
        read_only_fields = ("id",)


class AffiliationAVC09Serializer(serializers.ModelSerializer):
    personnel_data = PersonnelSerializer(source="personnel", read_only=True)

    personnel = serializers.PrimaryKeyRelatedField(
        queryset=Personnel.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    matricula = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    delivery_date = serializers.DateTimeField(required=False, allow_null=True)
    state = serializers.CharField(required=False, allow_null=True)

    class Meta:
        model = AffiliationAVC09
        fields = [
            "id",
            "personnel",
            "personnel_data",
            "insured_number",
            "employer_number",
            "type_risk",
            "isue_date",
            "from_date",
            "to_date",
            "days_incapacity",
            "hospital",
            "matricula",
            "state",
            "delivery_date",
            "scanned_document",  # AGREGAR
            "created_at",
            "modified_at",
            "deleted_at",
            "user_created",
            "user_modified",
        ]
        read_only_fields = ("id", "created_at", "modified_at", "deleted_at")

    def validate_matricula(self, value):
        if not value or value.strip() == "":
            return None
        return value.strip().upper()
