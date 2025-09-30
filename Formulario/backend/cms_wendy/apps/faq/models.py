from django.db import models
from django.utils.text import slugify

class FAQCategory(models.Model):
    name  = models.CharField(max_length=80, unique=True)
    slug  = models.SlugField(max_length=90, unique=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'categoría de FAQ'
        verbose_name_plural = 'categorías de FAQ'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class FAQ(models.Model):
    question     = models.CharField(max_length=160)
    # Guardaremos HTML básico; lo sanitizamos en el serializer
    answer_html  = models.TextField()
    category     = models.ForeignKey(FAQCategory, null=True, blank=True,
                                     on_delete=models.SET_NULL, related_name='faqs')
    is_published = models.BooleanField(default=True)
    order        = models.PositiveIntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category__order', 'order', 'created_at']
        verbose_name = 'pregunta frecuente'
        verbose_name_plural = 'preguntas frecuentes'

    def __str__(self):
        return self.question

