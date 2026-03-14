import hashlib
import os
from dataclasses import dataclass
from typing import Any


try:
    import fal_client
except Exception:  # pragma: no cover
    fal_client = None  # type: ignore[assignment]


@dataclass(frozen=True)
class FalConfig:
    key: str
    endpoint: str
    seed: int
    max_megapixels: float
    resolution: str
    aspect_ratio: str
    output_format: str
    num_images: int


def get_fal_config() -> FalConfig | None:
    key = os.getenv("FAL_KEY", "").strip()
    if not key:
        return None

    endpoint = os.getenv("FAL_ENDPOINT", "fal-ai/nano-banana-2/edit").strip()
    seed = int(os.getenv("FAL_SEED", "0"))
    max_mp = float(os.getenv("FAL_MAX_MEGAPIXELS", "1"))
    resolution = os.getenv("FAL_RESOLUTION", "1K").strip() or "1K"
    aspect_ratio = os.getenv("FAL_ASPECT_RATIO", "2:3").strip() or "2:3"
    output_format = os.getenv("FAL_OUTPUT_FORMAT", "jpeg").strip() or "jpeg"
    num_images = int(os.getenv("FAL_NUM_IMAGES", "1"))
    return FalConfig(
        key=key,
        endpoint=endpoint,
        seed=seed,
        max_megapixels=max_mp,
        resolution=resolution,
        aspect_ratio=aspect_ratio,
        output_format=output_format,
        num_images=num_images,
    )


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _require_client() -> Any:
    if fal_client is None:
        raise RuntimeError("fal_client is not installed. Add fal-client to requirements and rebuild.")
    return fal_client


def upload_image_bytes(*, data: bytes, content_type: str, filename: str) -> str:
    client = _require_client()
    # fal_client uses env var FAL_KEY for auth.
    return client.upload(data, content_type=content_type, file_name=filename)


def downscale_image_to_max_megapixels(*, data: bytes, max_megapixels: float) -> tuple[bytes, str]:
    """
    Ensures width*height <= max_megapixels*1e6 by resizing the input image.
    Returns (jpeg_bytes, content_type).

    This is how we control cost for models priced per output megapixel.
    """
    if max_megapixels <= 0:
        return data, "image/jpeg"

    from PIL import Image  # local import to keep module import light

    max_pixels = int(max_megapixels * 1_000_000)
    try:
        with Image.open(io := __import__("io").BytesIO(data)) as im:
            im = im.convert("RGB")
            w, h = im.size
            pixels = w * h
            if pixels <= max_pixels:
                # Still normalize to JPEG to keep upload consistent.
                out = __import__("io").BytesIO()
                im.save(out, format="JPEG", quality=92, optimize=True)
                return out.getvalue(), "image/jpeg"

            scale = (max_pixels / float(pixels)) ** 0.5
            new_w = max(1, int(w * scale))
            new_h = max(1, int(h * scale))
            im = im.resize((new_w, new_h), resample=Image.Resampling.LANCZOS)
            out = __import__("io").BytesIO()
            im.save(out, format="JPEG", quality=92, optimize=True)
            return out.getvalue(), "image/jpeg"
    except Exception:
        # If PIL can't parse it, just pass through.
        return data, "image/jpeg"


def submit_nano_banana_edit(
    *,
    endpoint: str,
    image_urls: list[str],
    prompt: str,
    seed: int,
    resolution: str,
    aspect_ratio: str,
    output_format: str,
    num_images: int,
) -> str:
    client = _require_client()
    args: dict[str, Any] = {
        "image_urls": image_urls,
        "prompt": prompt,
        "resolution": resolution,
        "aspect_ratio": aspect_ratio,
        "output_format": output_format,
        "num_images": num_images,
        "safety_tolerance": "2",
        "sync_mode": False,
    }
    if seed > 0:
        args["seed"] = seed
    handle = client.submit(endpoint, arguments=args)
    # handle has .request_id
    return getattr(handle, "request_id", None) or handle["request_id"]


def get_status(*, endpoint: str, request_id: str) -> dict[str, Any]:
    client = _require_client()
    st = client.status(endpoint, request_id, with_logs=False)
    # Normalize to dict.
    if isinstance(st, dict):
        return st
    out: dict[str, Any] = {}
    for k in ("status", "queue_position", "response_url"):
        if hasattr(st, k):
            out[k] = getattr(st, k)
    if not out:
        out["status"] = str(st)
    return out


def get_result(*, endpoint: str, request_id: str) -> dict[str, Any]:
    client = _require_client()
    res = client.result(endpoint, request_id)
    return res if isinstance(res, dict) else {"result": res}
