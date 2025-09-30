from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import ContactMessage
import re
from datetime import date

CEL_CO_RE = re.compile(r'^(?:\+57\s?)?(3\d{2})[\s\.-]?\d{3}[\s\.-]?\d{4}$')

class ContactCreateSerializer(serializers.Serializer):
    # Nombres EXACTOS como tu front
    nombre = serializers.CharField(min_length=3, max_length=120)
    email = serializers.EmailField()
    fechaNacimiento = serializers.DateField(format="%Y-%m-%d", input_formats=["%Y-%m-%d"])
    celular = serializers.CharField(max_length=20)
    telefono = serializers.CharField(max_length=30, required=False, allow_blank=True)
    password = serializers.CharField(min_length=8, write_only=True)
    confirmPassword = serializers.CharField(min_length=8, write_only=True)
    terminos = serializers.BooleanField()
    captcha = serializers.CharField(write_only=True)
    website = serializers.CharField(required=False, allow_blank=True)  # honeypot

    def validate_fechaNacimiento(self, fn):
        today = date.today()
        years = today.year - fn.year - ((today.month, today.day) < (fn.month, fn.day))
        if years < 18: raise serializers.ValidationError("Debes ser mayor de 18 años.")
        return fn

    def validate_celular(self, cel):
        if not CEL_CO_RE.match(cel.strip()):
            raise serializers.ValidationError("Celular inválido. Formato CO: 3XX XXX XXXX (opcional +57).")
        return cel

    def validate(self, data):
        # Honeypot
        if data.get("website"):
            raise serializers.ValidationError("Solicitud rechazada.")
        # Password rules & match
        pwd, cpw = data.get("password",""), data.get("confirmPassword","")
        if pwd != cpw:
            raise serializers.ValidationError({"confirmPassword": "Las contraseñas no coinciden."})
        if not re.search(r"[A-Z]", pwd) or not re.search(r"\d", pwd) or not re.search(r"[^A-Za-z0-9]", pwd):
            raise serializers.ValidationError({"password": "Incluye 1 mayúscula, 1 número y 1 carácter especial (mín. 8)."})
        return data

    def create(self, validated):
        # map names to model fields
        obj = ContactMessage.objects.create(
            nombre=validated["nombre"],
            email=validated["email"],
            fecha_nacimiento=validated["fechaNacimiento"],
            celular=validated["celular"],
            telefono=validated.get("telefono",""),
            password_hash=make_password(validated["password"]),
            consent_terminos=validated["terminos"],
            # ip y user_agent se setean en la vista
        )
        return obj


class ContactMessageListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        # No exponemos password_hash
        fields = [
            "id","nombre","email","fecha_nacimiento","celular","telefono",
            "consent_terminos","ip","user_agent","created_at"
        ]