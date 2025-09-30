from rest_framework import serializers
from .models import Book

class BookSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = (
            "id",
            "title",
            "slug",
            "summary",
            "description_html",
            "image_url",     # 👈 en lugar de image crudo
            "image_alt",
            "keywords",
            "detail_url",
            "order",
        )

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
