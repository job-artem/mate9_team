# Generated manually for hackathon template.

import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Generation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("endpoint", models.CharField(max_length=200)),
                ("source_image_url", models.URLField()),
                ("source_image_sha256", models.CharField(max_length=64)),
            ],
        ),
        migrations.CreateModel(
            name="GenerationJob",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("style_key", models.CharField(max_length=64)),
                ("style_label", models.CharField(max_length=128)),
                ("prompt", models.TextField()),
                ("fal_request_id", models.CharField(max_length=128, unique=True)),
                ("status", models.CharField(default="SUBMITTED", max_length=32)),
                ("result_images", models.JSONField(blank=True, default=list)),
                ("error", models.TextField(blank=True, default="")),
                (
                    "generation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="jobs", to="api.generation"
                    ),
                ),
            ],
        ),
    ]
