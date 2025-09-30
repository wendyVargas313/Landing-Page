from django.shortcuts import render
from django.conf import settings
from django.http import HttpRequest
from rest_framework import generics, permissions, throttling, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .serializers import ContactCreateSerializer, ContactMessageListSerializer
from .models import ContactMessage
import requests

# Throttle simple para evitar spam
class ContactAnonRateThrottle(throttling.AnonRateThrottle):
    rate = "10/hour"  # ajusta si quieres

def verify_recaptcha(token: str) -> bool:
    secret = getattr(settings, "RECAPTCHA_SECRET", None)
    if not secret:
        # Si no tienes clave, en desarrollo podrías permitirlo:
        return True
    try:
        r = requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": secret, "response": token},
            timeout=5
        )
        data = r.json()
        return bool(data.get("success"))
    except Exception:
        return False

class ContactCreateAPIView(generics.CreateAPIView):
    """
    Endpoint público para recibir el formulario de contacto.
    POST /api/contacto/
    """
    serializer_class = ContactCreateSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ContactAnonRateThrottle]

    def create(self, request: HttpRequest, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)

        # Verificar reCAPTCHA
        token = ser.validated_data.get("captcha", "")
        if not verify_recaptcha(token):
            raise ValidationError({"captcha": "Verificación reCAPTCHA falló."})

        # Crear objeto
        obj = ser.save()

        # Setear IP y user agent (no estaban en serializer)
        obj.ip = request.META.get("REMOTE_ADDR")
        obj.user_agent = request.META.get("HTTP_USER_AGENT","")[:500]
        obj.save(update_fields=["ip","user_agent"])

        return Response({"ok": True, "message": "Formulario recibido y almacenado."}, status=status.HTTP_201_CREATED)


class ContactMessageListAPIView(generics.ListAPIView):
    """
    Endpoint privado para listar mensajes (solo staff/auth).
    GET /api/contacto/list/
    """
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageListSerializer
    permission_classes = [permissions.IsAdminUser]
# Create your views here.
