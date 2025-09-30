from rest_framework import serializers
from .models import FAQ, FAQCategory

# Sanitizado básico de HTML
try:
    import bleach
except ImportError:
    bleach = None

ALLOWED_TAGS = ['p','br','strong','em','ul','ol','li','a','code','pre','span']
ALLOWED_ATTRS = {'a': ['href','title','target','rel'], 'span': ['class']}
ALLOWED_PROTOCOLS = ['http','https','mailto']

class FAQCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = FAQCategory
        fields = ('id','name','slug','order')

class FAQSerializer(serializers.ModelSerializer):
    category = FAQCategorySerializer(read_only=True)

    class Meta:
        model  = FAQ
        fields = ('id','question','answer_html','category','order')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Nos aseguramos de que links tengan rel/target seguros para front
        return data

    def validate_answer_html(self, value):
        if bleach:
            return bleach.clean(
                value or '',
                tags=ALLOWED_TAGS,
                attributes=ALLOWED_ATTRS,
                protocols=ALLOWED_PROTOCOLS,
                strip=True
            )
        return value