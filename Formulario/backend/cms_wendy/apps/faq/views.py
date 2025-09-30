from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.response import Response
from .models import FAQ, FAQCategory
from .serializers import FAQSerializer, FAQCategorySerializer

class FAQListAPIView(generics.ListAPIView):
    """
    GET /api/faq/?q=palabra&category=slug
    Devuelve solo FAQs publicadas, ordenadas.
    """
    serializer_class = FAQSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = FAQ.objects.select_related('category').filter(is_published=True)
        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(question__icontains=q) | qs.filter(answer_html__icontains=q)
        cat = self.request.query_params.get('category')
        if cat:
            qs = qs.filter(category__slug=cat)
        return qs.order_by('category__order', 'order', 'created_at')

class FAQCategoryListAPIView(generics.ListAPIView):
    """
    GET /api/faq/categories/
    """
    queryset = FAQCategory.objects.all().order_by('order','name')
    serializer_class = FAQCategorySerializer
    permission_classes = [permissions.AllowAny]
