from django.contrib import admin
from .models import FAQ, FAQCategory

@admin.register(FAQCategory)
class FAQCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order')
    prepopulated_fields = {"slug": ("name",)}
    ordering = ('order', 'name')

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display  = ('question', 'category', 'is_published', 'order', 'updated_at')
    list_filter   = ('is_published', 'category')
    search_fields = ('question', 'answer_html')
    ordering      = ('category__order', 'order')
