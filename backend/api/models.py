import uuid

from django.db import models


class Generation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    endpoint = models.CharField(max_length=200)
    source_image_url = models.URLField()
    source_image_sha256 = models.CharField(max_length=64)

    def __str__(self) -> str:  # pragma: no cover
        return f"Generation({self.id})"


class GenerationJob(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    generation = models.ForeignKey(Generation, related_name="jobs", on_delete=models.CASCADE)

    style_key = models.CharField(max_length=64)
    style_label = models.CharField(max_length=128)
    prompt = models.TextField()

    fal_request_id = models.CharField(max_length=128, unique=True)
    status = models.CharField(max_length=32, default="SUBMITTED")
    result_images = models.JSONField(default=list, blank=True)
    error = models.TextField(blank=True, default="")

    def __str__(self) -> str:  # pragma: no cover
        return f"Job({self.style_key}, {self.status})"

