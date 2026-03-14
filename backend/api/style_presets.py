from dataclasses import dataclass


@dataclass(frozen=True)
class StylePreset:
    key: str
    label: str
    prompt: str


BASE_PROMPT_PREFIX = (
    "portrait photo of the same person, full outfit visible, "
    "high-end fashion editorial, realistic skin texture, "
    "professional fashion photography, sharp focus, premium color grading, "
    "studio quality lighting"
)


PRESETS: list[StylePreset] = [
    StylePreset(
        key="startup_founder",
        label="Startup founder",
        prompt=(
            f"{BASE_PROMPT_PREFIX}, modern smart casual, clean background, softbox lighting"
        ),
    ),
    StylePreset(
        key="street_fashion",
        label="Street fashion model",
        prompt=f"{BASE_PROMPT_PREFIX}, oversized streetwear, urban background, cinematic lighting",
    ),
    StylePreset(
        key="luxury_lifestyle",
        label="Luxury lifestyle",
        prompt=f"{BASE_PROMPT_PREFIX}, tailored luxury suit, hotel lobby vibe, glossy editorial lighting",
    ),
    StylePreset(
        key="fitness_coach",
        label="Fitness coach",
        prompt=f"{BASE_PROMPT_PREFIX}, athletic fit outfit, gym studio, dramatic rim light",
    ),
    StylePreset(
        key="minimalist",
        label="Minimalist",
        prompt=f"{BASE_PROMPT_PREFIX}, monochrome minimalist outfit, gallery space, soft daylight",
    ),
    StylePreset(
        key="fashion_week",
        label="Fashion week",
        prompt=f"{BASE_PROMPT_PREFIX}, avant-garde outfit, runway backstage, flash photography",
    ),
]


PRESETS_BY_KEY = {p.key: p for p in PRESETS}

