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
    num_inference_steps: int
    guidance_scale: float
    image_size: int
    seed: int


def get_fal_config() -> FalConfig | None:
    key = os.getenv("FAL_KEY", "").strip()
    if not key:
        return None

    endpoint = os.getenv("FAL_ENDPOINT", "fal-ai/flux/dev/image-to-image").strip()
    num_steps = int(os.getenv("FAL_NUM_INFERENCE_STEPS", "28"))
    guidance = float(os.getenv("FAL_GUIDANCE_SCALE", "3.5"))
    image_size = int(os.getenv("FAL_IMAGE_SIZE", "1024"))
    seed = int(os.getenv("FAL_SEED", "0"))
    return FalConfig(
        key=key,
        endpoint=endpoint,
        num_inference_steps=num_steps,
        guidance_scale=guidance,
        image_size=image_size,
        seed=seed,
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


def submit_image_to_image(
    *,
    endpoint: str,
    image_url: str,
    prompt: str,
    num_inference_steps: int,
    guidance_scale: float,
    image_size: int,
    seed: int,
) -> str:
    client = _require_client()
    args: dict[str, Any] = {
        "image_url": image_url,
        "prompt": prompt,
        "num_inference_steps": num_inference_steps,
        "guidance_scale": guidance_scale,
        "image_size": image_size,
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

