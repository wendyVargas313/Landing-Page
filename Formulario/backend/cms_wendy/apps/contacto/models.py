from django.db import models
from django.utils import timezone

# Create your models here.
class ContactMessage(models.Model):
    nombre = models.CharField(max_length=120)
    email = models.EmailField()
    fecha_nacimiento = models.DateField()
    celular = models.CharField(max_length=20)
    telefono = models.CharField(max_length=30, blank=True)   # opcional

    # Guardaremos un hash para cumplir con tu formulario de ejemplo.
    password_hash = models.CharField(max_length=255)

    consent_terminos = models.BooleanField(default=False)

    # Extras de auditoría (opcionales, pero recomendados)
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    created_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "mensaje de contacto"
        verbose_name_plural = "mensajes de contacto"

    def __str__(self):
        return f"{self.nombre} <{self.email}>"
