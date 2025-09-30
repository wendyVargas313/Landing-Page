from django.db import models
from django.utils.text import slugify

class Book(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    summary = models.CharField(max_length=300, blank=True)
    description_html = models.TextField(blank=True)
    image = models.ImageField(upload_to="books/", blank=True, null=True)
    image_alt = models.CharField(max_length=200, blank=True)
    keywords = models.CharField(
        max_length=300, blank=True,
        help_text="Separadas por coma: aventura, ciencia ficción, etc."
    )
    detail_url = models.URLField(blank=True)
    is_published = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "title"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
