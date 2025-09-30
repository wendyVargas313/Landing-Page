from django.urls import path
from .views import ContactCreateAPIView, ContactMessageListAPIView

urlpatterns = [
    path('contacto/', ContactCreateAPIView.as_view(), name='contacto-create'),
    path('contacto/list/', ContactMessageListAPIView.as_view(), name='contacto-list'),
]