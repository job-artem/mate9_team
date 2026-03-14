import os
import json
from typing import Any

from django.http import HttpRequest, JsonResponse
from django.core.cache import cache
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model

from .fal_service import (
    downscale_image_to_max_megapixels,
    get_fal_config,
    get_result,
    get_status,
    sha256_bytes,
    submit_nano_banana_edit,
    upload_image_bytes,
)
from .models import Generation, GenerationJob
from .style_presets import PRESETS, PRESETS_BY_KEY


def health(_request: HttpRequest):
    return JsonResponse({"ok": True})


def hello(_request: HttpRequest):
    return JsonResponse({"message": "Hello from Django API"})


def styles(_request: HttpRequest):
    return JsonResponse(
        {
            "styles": [{"key": p.key, "label": p.label, "prompt": p.prompt} for p in PRESETS],
        }
    )


def _json_error(message: str, status: int = 400, **extra: Any) -> JsonResponse:
    payload: dict[str, Any] = {"error": message, **extra}
    return JsonResponse(payload, status=status)


def _require_auth(request: HttpRequest) -> JsonResponse | None:
    if not request.user.is_authenticated:
        return _json_error("Unauthorized", status=401)
    return None


def _read_json(request: HttpRequest) -> dict[str, Any] | None:
    try:
        body = request.body.decode("utf-8") if request.body else ""
        return json.loads(body) if body else {}
    except Exception:
        return None


@csrf_exempt
def auth_register(request: HttpRequest):
    if request.method != "POST":
        return _json_error("Method not allowed", status=405)

    data = _read_json(request)
    if data is None:
        return _json_error("Invalid JSON")

    username = str(data.get("username") or "").strip()
    password = str(data.get("password") or "").strip()
    first_name = str(data.get("first_name") or "").strip()
    last_name = str(data.get("last_name") or "").strip()

    if not username or not password:
        return _json_error("username and password are required")
    UserModel = get_user_model()
    if UserModel.objects.filter(username=username).exists():
        return _json_error("username already exists", status=409)

    user = UserModel.objects.create_user(
        username=username, password=password, first_name=first_name, last_name=last_name
    )
    login(request, user)
    return JsonResponse(
        {"user": {"username": user.username, "first_name": user.first_name, "last_name": user.last_name}},
        status=201,
    )


@csrf_exempt
def auth_login(request: HttpRequest):
    if request.method != "POST":
        return _json_error("Method not allowed", status=405)

    data = _read_json(request)
    if data is None:
        return _json_error("Invalid JSON")

    username = str(data.get("username") or "").strip()
    password = str(data.get("password") or "").strip()
    user = authenticate(request, username=username, password=password)
    if user is None:
        return _json_error("Invalid credentials", status=401)

    login(request, user)
    return JsonResponse({"user": {"username": user.username, "first_name": user.first_name, "last_name": user.last_name}})


@csrf_exempt
def auth_logout(request: HttpRequest):
    if request.method != "POST":
        return _json_error("Method not allowed", status=405)
    logout(request)
    return JsonResponse({"ok": True})


def auth_me(request: HttpRequest):
    if not request.user.is_authenticated:
        return _json_error("Unauthorized", status=401)
    u = request.user
    return JsonResponse({"user": {"username": u.username, "first_name": u.first_name, "last_name": u.last_name}})


def my_styles(request: HttpRequest):
    unauth = _require_auth(request)
    if unauth:
        return unauth
    if request.method != "GET":
        return _json_error("Method not allowed", status=405)

    gens = (
        Generation.objects.filter(user=request.user)
        .prefetch_related("jobs")
        .order_by("-created_at")
    )
    out: list[dict[str, Any]] = []
    for gen in gens:
        out.append(
            {
                "id": str(gen.id),
                "name": gen.name or f"Style {gen.created_at.strftime('%Y-%m-%d %H:%M')}",
                "created_at": gen.created_at.isoformat(),
                "source_images": gen.source_images,
                "jobs": [
                    {
                        "style_key": j.style_key,
                        "style_label": j.style_label,
                        "status": j.status,
                        "images": j.result_images,
                        "error": j.error,
                    }
                    for j in gen.jobs.all().order_by("created_at")
                ],
            }
        )

    return JsonResponse({"styles": out})


def my_style_detail(request: HttpRequest, generation_id):
    unauth = _require_auth(request)
    if unauth:
        return unauth
    if request.method != "GET":
        return _json_error("Method not allowed", status=405)

    try:
        gen = Generation.objects.prefetch_related("jobs").get(id=generation_id, user=request.user)
    except Generation.DoesNotExist:
        return _json_error("Not found", status=404)

    return JsonResponse(
        {
            "style": {
                "id": str(gen.id),
                "name": gen.name or f"Style {gen.created_at.strftime('%Y-%m-%d %H:%M')}",
                "created_at": gen.created_at.isoformat(),
                "source_images": gen.source_images,
                "jobs": [
                    {
                        "style_key": j.style_key,
                        "style_label": j.style_label,
                        "status": j.status,
                        "images": j.result_images,
                        "error": j.error,
                    }
                    for j in gen.jobs.all().order_by("created_at")
                ],
            }
        }
    )


@csrf_exempt
def create_generation(request: HttpRequest):
    """
    POST multipart/form-data:
      - image_front: file
      - image_left: file
      - image_right: file
      - styles: optional comma-separated list of style keys
    """
    if request.method != "POST":
        return _json_error("Method not allowed", status=405)

    unauth = _require_auth(request)
    if unauth:
        return unauth

    ip = request.META.get("REMOTE_ADDR") or "unknown"
    rate_key = f"rate:generations:{ip}"
    current = cache.get(rate_key, 0)
    if current >= 2:
        return _json_error("Rate limit exceeded", status=429, retry_after_seconds=60)
    cache.set(rate_key, current + 1, timeout=60)

    cfg = get_fal_config()
    if cfg is None:
        return _json_error(
            "FAL_KEY is not configured on backend",
            status=503,
            hint="Set FAL_KEY in .env and restart docker compose",
        )
    if cfg.endpoint != "fal-ai/nano-banana-2/edit":
        return _json_error(
            "FAL_ENDPOINT is not set to Nano Banana 2 endpoint",
            status=503,
            expected="fal-ai/nano-banana-2/edit",
            got=cfg.endpoint,
            hint="Update FAL_ENDPOINT in .env and restart backend",
        )

    required_fields = ["image_front", "image_left", "image_right"]
    missing = [f for f in required_fields if f not in request.FILES]
    if missing:
        return _json_error("Missing image files", missing=missing)

    # Ensure fal_client sees auth.
    os.environ["FAL_KEY"] = cfg.key

    uploaded_urls: dict[str, str] = {}
    combined_hash_parts: list[str] = []
    for field in required_fields:
        img = request.FILES[field]
        raw = img.read()
        if not raw:
            return _json_error("Empty image upload", field=field)
        filename = getattr(img, "name", None) or f"{field}.jpg"
        raw, normalized_content_type = downscale_image_to_max_megapixels(
            data=raw, max_megapixels=cfg.max_megapixels
        )
        url = upload_image_bytes(data=raw, content_type=normalized_content_type, filename=filename)
        uploaded_urls[field] = url
        combined_hash_parts.append(sha256_bytes(raw))

    image_hash = sha256_bytes(("|".join(combined_hash_parts)).encode("utf-8"))
    image_urls_list = [uploaded_urls["image_front"], uploaded_urls["image_left"], uploaded_urls["image_right"]]

    style_keys_raw = (request.POST.get("styles") or "").strip()
    style_name = (request.POST.get("name") or "").strip()
    if style_keys_raw:
        style_keys = [s.strip() for s in style_keys_raw.split(",") if s.strip()]
    else:
        style_keys = [p.key for p in PRESETS]

    unknown = [k for k in style_keys if k not in PRESETS_BY_KEY]
    if unknown:
        return _json_error("Unknown style keys", unknown=unknown)

    gen = Generation.objects.create(
        user=request.user,
        name=style_name,
        endpoint=cfg.endpoint,
        source_image_url=uploaded_urls["image_front"],
        source_image_sha256=image_hash,
        source_images={
            "front": uploaded_urls["image_front"],
            "left": uploaded_urls["image_left"],
            "right": uploaded_urls["image_right"],
        },
    )

    jobs_out: list[dict[str, Any]] = []
    for key in style_keys:
        preset = PRESETS_BY_KEY[key]
        try:
            request_id = submit_nano_banana_edit(
                endpoint=cfg.endpoint,
                image_urls=image_urls_list,
                prompt=preset.prompt,
                seed=cfg.seed,
                resolution=cfg.resolution,
                aspect_ratio=cfg.aspect_ratio,
                output_format=cfg.output_format,
                num_images=cfg.num_images,
            )
        except Exception as e:
            job = GenerationJob.objects.create(
                generation=gen,
                style_key=preset.key,
                style_label=preset.label,
                prompt=preset.prompt,
                fal_request_id=f"ERROR:{preset.key}:{gen.id}",
                status="ERROR",
                error=str(e),
                result_images=[],
            )
            jobs_out.append(
                {
                    "id": str(job.id),
                    "style_key": job.style_key,
                    "style_label": job.style_label,
                    "status": job.status,
                    "error": job.error,
                }
            )
            continue

        job = GenerationJob.objects.create(
            generation=gen,
            style_key=preset.key,
            style_label=preset.label,
            prompt=preset.prompt,
            fal_request_id=request_id,
            status="SUBMITTED",
            result_images=[],
        )
        jobs_out.append(
            {
                "id": str(job.id),
                "style_key": job.style_key,
                "style_label": job.style_label,
                "status": job.status,
                "fal_request_id": job.fal_request_id,
            }
        )

    return JsonResponse(
        {
            "generation": {
                "id": str(gen.id),
                "created_at": gen.created_at.isoformat(),
                "endpoint": gen.endpoint,
                "source_image_url": gen.source_image_url,
                "source_images": gen.source_images,
            },
            "jobs": jobs_out,
        },
        status=201,
    )


def _extract_images_from_result(res: dict[str, Any]) -> list[str]:
    images = res.get("images")
    if isinstance(images, list):
        out: list[str] = []
        for item in images:
            if isinstance(item, str):
                out.append(item)
            elif isinstance(item, dict) and "url" in item:
                out.append(str(item["url"]))
        return out
    return []


def get_generation(request: HttpRequest, generation_id):
    if request.method != "GET":
        return _json_error("Method not allowed", status=405)

    unauth = _require_auth(request)
    if unauth:
        return unauth

    cfg = get_fal_config()
    if cfg is None:
        return _json_error("FAL_KEY is not configured on backend", status=503)

    os.environ["FAL_KEY"] = cfg.key

    try:
        gen = Generation.objects.get(id=generation_id, user=request.user)
    except Generation.DoesNotExist:
        return _json_error("Generation not found", status=404)

    jobs = list(gen.jobs.all().order_by("created_at"))
    jobs_out: list[dict[str, Any]] = []
    any_pending = False

    for job in jobs:
        if job.status in ("COMPLETED", "ERROR"):
            jobs_out.append(
                {
                    "id": str(job.id),
                    "style_key": job.style_key,
                    "style_label": job.style_label,
                    "status": job.status,
                    "images": job.result_images,
                    "error": job.error,
                }
            )
            continue

        any_pending = True
        try:
            st = get_status(endpoint=gen.endpoint, request_id=job.fal_request_id)
            st_name = str(st.get("status", "")).upper()
            # Normalize fal statuses to our simple set.
            if "COMPLETED" in st_name:
                res = get_result(endpoint=gen.endpoint, request_id=job.fal_request_id)
                images = _extract_images_from_result(res)
                job.status = "COMPLETED"
                job.result_images = images
                job.error = ""
            elif "FAILED" in st_name or "ERROR" in st_name:
                job.status = "ERROR"
                job.error = st.get("error", "") or st_name or "FAILED"
            else:
                job.status = st_name or "IN_PROGRESS"
        except Exception as e:
            job.status = "ERROR"
            job.error = str(e)

        job.updated_at = timezone.now()
        job.save(update_fields=["status", "result_images", "error", "updated_at"])

        jobs_out.append(
            {
                "id": str(job.id),
                "style_key": job.style_key,
                "style_label": job.style_label,
                "status": job.status,
                "images": job.result_images,
                "error": job.error,
            }
        )

    return JsonResponse(
        {
            "generation": {
                "id": str(gen.id),
                "created_at": gen.created_at.isoformat(),
                "endpoint": gen.endpoint,
                "source_image_url": gen.source_image_url,
                "source_images": gen.source_images,
            },
            "jobs": jobs_out,
            "pending": any_pending,
        }
    )
