from django.shortcuts import render
from rest_framework import generics, permissions
from .models import Book
from .serializers import BookSerializer

class BookListAPIView(generics.ListAPIView):
    """
    GET /api/books/?q=palabra
    Devuelve solo libros publicados, ordenados.
    """
    serializer_class = BookSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Book.objects.filter(is_published=True)
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(title__icontains=q) | qs.filter(summary__icontains=q) | qs.filter(description_html__icontains=q)
        return qs.order_by("order", "title")
