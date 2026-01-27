#
# Project: SigetsopProject
# Copyrigtht (C) 2025 marconina999@gmail.com. All rights reserveds.
# Unauthorized copyng or distribution prohibited.
#
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CustomUser, Role


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name", "description"]
        read_only_fields = ["created_at", "updated_at", "deleted_at"]


class UserSerializer(serializers.ModelSerializer):
    role_data = RoleSerializer(source="role", read_only=True)

    # Esto permite escribir el rol enviando solo el ID (ej: "role": 5)
    role = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "maternal_name",
            "phone",
            "profile_picture",
            "role",
            "role_data",
            "is_active",
            "created_at",
            "updated_at",
            "password",
        ]

    extra_kwargs = {"password": {"write_only": True, "required": False}}

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "maternal_name",
            "phone",
            "role",
        ]

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            maternal_name=validated_data.get("maternal_name", ""),
            phone=validated_data.get("phone", ""),
            role=validated_data.get("role", ""),
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            # Validación estándar de SimpleJWT
            data = super().validate(attrs)

            # Verificar si el usuario está activo
            if not self.user.is_active:
                raise serializers.ValidationError(
                    {"detail": "Usuario desactivado. Contacta al administrador."}
                )

            return data

        except serializers.ValidationError as e:
            # Si ya es un ValidationError, lo propagamos
            raise e
        except Exception as e:
            # Manejo de errores de base de datos o conexión
            error_message = str(e).lower()
            if "connection" in error_message or "database" in error_message:
                raise serializers.ValidationError(
                    {
                        "detail": "Error de conexión con la base de datos. Intente nuevamente."
                    }
                )
            elif "timeout" in error_message:
                raise serializers.ValidationError(
                    {"detail": "Tiempo de espera agotado. Intente nuevamente."}
                )
            else:
                raise serializers.ValidationError(
                    {"detail": "Error del servidor. Contacte al administrador."}
                )

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Agregamos datos extra al payload del JWT
        token["username"] = user.username
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name
        token["email"] = user.email
        if hasattr(user, "role") and user.role:
            token["role"] = user.role.name

        return token
