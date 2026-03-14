from django.contrib import admin

from .models import Generation, GenerationJob


@admin.register(Generation)
class GenerationAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at", "endpoint", "source_image_sha256")
    list_filter = ("endpoint", "created_at")
    search_fields = ("id", "source_image_sha256", "source_image_url")
    readonly_fields = ("id", "created_at", "source_image_sha256", "source_image_url", "source_images", "endpoint")


@admin.register(GenerationJob)
class GenerationJobAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at", "updated_at", "style_key", "status", "fal_request_id")
    list_filter = ("status", "style_key", "created_at")
    search_fields = ("id", "fal_request_id", "style_key", "style_label")
    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
        "fal_request_id",
        "style_key",
        "style_label",
        "prompt",
        "status",
        "result_images",
        "error",
        "generation",
    )
