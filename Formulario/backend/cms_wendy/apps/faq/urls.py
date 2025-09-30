from django.urls import path
from .views import FAQListAPIView, FAQCategoryListAPIView

urlpatterns = [
    path('faq/', FAQListAPIView.as_view(), name='faq-list'),
    path('faq/categories/', FAQCategoryListAPIView.as_view(), name='faq-categories'),
]