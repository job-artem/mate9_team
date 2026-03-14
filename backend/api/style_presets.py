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
        key="tech_founder",
        label="Тех фаундер",
        prompt=f"{BASE_PROMPT_PREFIX}, tech founder, modern smart casual, clean background, softbox lighting",
    ),
    StylePreset(
        key="fashion_model",
        label="Фешн модель",
        prompt=f"{BASE_PROMPT_PREFIX}, fashion model, runway-ready look, editorial studio lighting",
    ),
    StylePreset(
        key="streetwear",
        label="Стрітвір",
        prompt=f"{BASE_PROMPT_PREFIX}, oversized streetwear outfit, urban background, cinematic lighting",
    ),
    StylePreset(
        key="luxury_lifestyle",
        label="Лакшері лайфстайл",
        prompt=f"{BASE_PROMPT_PREFIX}, luxury lifestyle, tailored outfit, hotel lobby vibe, glossy editorial lighting",
    ),
    StylePreset(
        key="fitness_athlete",
        label="Фітнес атлет",
        prompt=f"{BASE_PROMPT_PREFIX}, fitness athlete, athletic fit outfit, gym studio, dramatic rim light",
    ),
    StylePreset(
        key="minimal_aesthetic",
        label="Мінімал естетика",
        prompt=f"{BASE_PROMPT_PREFIX}, minimal aesthetic, monochrome outfit, gallery space, soft daylight",
    ),
]


PRESETS_BY_KEY = {p.key: p for p in PRESETS}
