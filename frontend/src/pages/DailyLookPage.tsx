import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

type WeatherKey =
  | "sunny"
  | "cloudy"
  | "rain"
  | "snow"
  | "windy"
  | "hot"
  | "cold"
  | "fog";

type OccasionKey =
  | "casual_day"
  | "business_meeting"
  | "business_party"
  | "date"
  | "birthday"
  | "holiday"
  | "wedding_guest"
  | "funeral"
  | "graduation"
  | "gym"
  | "travel"
  | "interview"
  | "conference"
  | "night_out";

type GenerationStatusResponse = {
  generation: {
    id: string;
    created_at: string;
    name?: string;
    source_images?: { front?: string };
    source_image_url: string;
  };
  jobs: Array<{
    id: string;
    style_key: string;
    style_label: string;
    status: string;
    images: string[];
    error: string;
  }>;
  pending: boolean;
};

type CreateDailyLookResponse = {
  generation: {
    id: string;
    created_at: string;
    name?: string;
    source_images?: { front?: string };
    source_image_url: string;
  };
  jobs: Array<{
    id: string;
    style_key: string;
    style_label: string;
    status: string;
    fal_request_id?: string;
    error?: string;
  }>;
};

const WEATHER_OPTIONS: Array<{ key: WeatherKey; label: string }> = [
  { key: "sunny", label: "Сонячно" },
  { key: "cloudy", label: "Хмарно" },
  { key: "rain", label: "Дощ" },
  { key: "snow", label: "Сніг" },
  { key: "windy", label: "Вітряно" },
  { key: "hot", label: "Спека" },
  { key: "cold", label: "Холодно" },
  { key: "fog", label: "Туман" }
];

const OCCASION_OPTIONS: Array<{ key: OccasionKey; label: string }> = [
  { key: "casual_day", label: "Звичайний день" },
  { key: "business_meeting", label: "Бізнес зустріч" },
  { key: "business_party", label: "Бізнес вечірка" },
  { key: "interview", label: "Співбесіда" },
  { key: "conference", label: "Конференція" },
  { key: "date", label: "Побачення" },
  { key: "birthday", label: "День народження" },
  { key: "holiday", label: "Свято" },
  { key: "wedding_guest", label: "Весілля (гість)" },
  { key: "funeral", label: "Похорони" },
  { key: "graduation", label: "Випускний" },
  { key: "gym", label: "Тренування" },
  { key: "travel", label: "Подорож" },
  { key: "night_out", label: "Вечір з друзями" }
];

const LOCATION_GROUPS: Array<{ label: string; options: Array<{ value: string; label: string }> }> = [
  {
    label: "Континенти",
    options: [
      { value: "Європа", label: "Європа" },
      { value: "Африка", label: "Африка" },
      { value: "Америка", label: "Америка" },
      { value: "Азія", label: "Азія" }
    ]
  },
  {
    label: "Країни",
    options: [
      { value: "Україна", label: "Україна" },
      { value: "Франція", label: "Франція" },
      { value: "Італія", label: "Італія" },
      { value: "Велика Британія", label: "Велика Британія" },
      { value: "США", label: "США" },
      { value: "Японія", label: "Японія" },
      { value: "Китай", label: "Китай" },
      { value: "ОАЕ", label: "ОАЕ" },
      { value: "Туреччина", label: "Туреччина" }
    ]
  },
  {
    label: "Міста / столиці",
    options: [
      { value: "Київ", label: "Київ" },
      { value: "Париж", label: "Париж" },
      { value: "Лондон", label: "Лондон" },
      { value: "Мілан", label: "Мілан" },
      { value: "Рим", label: "Рим" },
      { value: "Нью-Йорк", label: "Нью-Йорк" },
      { value: "Лос-Анджелес", label: "Лос-Анджелес" },
      { value: "Токіо", label: "Токіо" },
      { value: "Шанхай", label: "Шанхай" },
      { value: "Пекін", label: "Пекін" },
      { value: "Дубай", label: "Дубай" },
      { value: "Стамбул", label: "Стамбул" }
    ]
  },
  {
    label: "Визначні місця",
    options: [
      { value: "Eiffel Tower (Paris)", label: "Ейфелева вежа (Париж)" },
      { value: "Shibuya Crossing (Tokyo)", label: "Шібуя (Токіо)" },
      { value: "Times Square (NYC)", label: "Times Square (NYC)" },
      { value: "Dubai Marina", label: "Dubai Marina" }
    ]
  }
];

export default function DailyLookPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [location, setLocation] = useState(LOCATION_GROUPS[2].options[0].value);
  const [weather, setWeather] = useState<WeatherKey>("cloudy");
  const [occasion, setOccasion] = useState<OccasionKey>("casual_day");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [generationName, setGenerationName] = useState<string | null>(null);
  const [sourceFrontUrl, setSourceFrontUrl] = useState<string | null>(null);
  const [jobs, setJobs] = useState<GenerationStatusResponse["jobs"]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!generationId) return;
    if (!pending) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/generations/${generationId}/`);
        if (r.status === 401) {
          navigate("/login");
          return;
        }
        const data = (await r.json()) as GenerationStatusResponse & { error?: string };
        if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
        if (cancelled) return;

        setJobs(data.jobs || []);
        setPending(Boolean(data.pending));
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
        if (!cancelled) setPending(false);
      }
    };

    const t = window.setInterval(() => void tick(), 1500);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [generationId, pending, navigate]);

  const canSubmit = Boolean(user && file && location && weather && occasion && !creating && !pending);

  const onGenerate = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!file) {
      setError("Завантаж базове фото.");
      return;
    }

    setError(null);
    setCreating(true);
    setGenerationId(null);
    setGenerationName(null);
    setJobs([]);
    setPending(false);
    setSourceFrontUrl(null);

    try {
      const form = new FormData();
      form.append("image", file);
      form.append("location", location);
      form.append("weather", weather);
      form.append("occasion", occasion);

      const r = await fetch("/api/daily-look/", { method: "POST", body: form });
      if (r.status === 401) {
        navigate("/login");
        return;
      }
      const data = (await r.json()) as CreateDailyLookResponse & { error?: string; hint?: string };
      if (!r.ok) throw new Error([data.error, data.hint].filter(Boolean).join(". ") || `HTTP ${r.status}`);

      setGenerationId(data.generation.id);
      setGenerationName(data.generation.name || null);
      setSourceFrontUrl(data.generation.source_images?.front || data.generation.source_image_url || null);

      setJobs(
        (data.jobs || []).map((j) => ({
          id: j.id,
          style_key: j.style_key,
          style_label: j.style_label,
          status: j.status,
          images: [],
          error: j.error || ""
        }))
      );
      setPending(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const headerMeta = useMemo(() => {
    const w = WEATHER_OPTIONS.find((x) => x.key === weather)?.label || weather;
    const o = OCCASION_OPTIONS.find((x) => x.key === occasion)?.label || occasion;
    return `${location} · ${w} · ${o}`;
  }, [location, weather, occasion]);

  if (!loading && !user) {
    return (
      <div className="page">
        <div className="card">
          <h1>Daily look</h1>
          <div className="alert">
            Треба залогінитись, щоб користуватись генератором. <a href="#/login">Вхід</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Daily look</h1>
        <p className="muted">Підбір образу на основі погоди, локації та події. Результат збережеться у “Мої стилі”.</p>

        <div className="dailyForm">
          <label className="field">
            <span className="fieldLabel">Локація</span>
            <select className="input" value={location} onChange={(e) => setLocation(e.target.value)}>
              {LOCATION_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="fieldLabel">Погода</span>
            <select className="input" value={weather} onChange={(e) => setWeather(e.target.value as WeatherKey)}>
              {WEATHER_OPTIONS.map((w) => (
                <option key={w.key} value={w.key}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="fieldLabel">Подія / occasion</span>
            <select className="input" value={occasion} onChange={(e) => setOccasion(e.target.value as OccasionKey)}>
              {OCCASION_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="fieldLabel">Вихідна фотка</span>
            <label className="filePick" style={{ width: "100%" }}>
              <input className="fileInput" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span>{file ? "Змінити фото" : "Завантажити фото"}</span>
            </label>
          </label>
        </div>

        {previewUrl ? (
          <div className="previewBlock">
            <div className="previewLabel">Базове фото</div>
            <img className="previewImg" src={previewUrl} alt="Base preview" />
          </div>
        ) : null}

        {error ? (
          <div className="alert">
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        <div className="actions">
          <button className="btn" disabled={!canSubmit} onClick={() => void onGenerate()}>
            {creating ? "Генеруємо..." : pending ? "У процесі..." : "Згенерувати 5 варіантів"}
          </button>
          <button className="btn secondary" onClick={() => navigate("/my-styles")}>
            Мої стилі
          </button>
        </div>

        {generationId ? (
          <p className="muted" style={{ marginTop: 10 }}>
            {generationName ? (
              <>
                Назва: <code>{generationName}</code>
                <br />
              </>
            ) : null}
            Контекст: <code>{headerMeta}</code>
            <br />
            Generation id: <code>{generationId}</code>
          </p>
        ) : null}

        {jobs.length ? (
          <div className="jobs">
            {jobs.map((j) => (
              <div key={j.id} className="job">
                <div className="jobHead">
                  <div className="jobTitle">{j.style_label || j.style_key}</div>
                  <div className={j.status === "COMPLETED" ? "badge ok" : j.status === "ERROR" ? "badge err" : "badge"}>
                    {j.status}
                  </div>
                </div>
                {j.error ? <div className="jobErr">{j.error}</div> : null}
                <div className="pair">
                  <div className="pairFrame">
                    <div className="pairLabel">До</div>
                    {previewUrl || sourceFrontUrl ? (
                      <img className="pairImg" src={previewUrl || sourceFrontUrl || ""} alt="Input" />
                    ) : (
                      <div className="pairEmpty">Вхідне фото</div>
                    )}
                  </div>
                  <div className="pairFrame">
                    <div className="pairLabel">Після</div>
                    {j.images?.length ? (
                      <a className="pairLink" href={j.images[0]} target="_blank" rel="noreferrer">
                        <img className="pairImg" src={j.images[0]} alt={j.style_label} loading="lazy" />
                      </a>
                    ) : j.status === "ERROR" ? (
                      <div className="pairEmpty">Помилка</div>
                    ) : (
                      <div className="pairEmpty">Генерується...</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

