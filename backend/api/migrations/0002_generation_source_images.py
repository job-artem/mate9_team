# Generated manually for hackathon template.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="generation",
            name="source_images",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]

