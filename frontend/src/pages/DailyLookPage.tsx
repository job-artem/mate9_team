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
  { key: "sunny", label: "Sunny" },
  { key: "cloudy", label: "Cloudy" },
  { key: "rain", label: "Rain" },
  { key: "snow", label: "Snow" },
  { key: "windy", label: "Windy" },
  { key: "hot", label: "Hot" },
  { key: "cold", label: "Cold" },
  { key: "fog", label: "Fog" }
];

const OCCASION_OPTIONS: Array<{ key: OccasionKey; label: string }> = [
  { key: "casual_day", label: "Everyday" },
  { key: "business_meeting", label: "Business meeting" },
  { key: "business_party", label: "Business party" },
  { key: "interview", label: "Interview" },
  { key: "conference", label: "Conference" },
  { key: "date", label: "Date night" },
  { key: "birthday", label: "Birthday" },
  { key: "holiday", label: "Holiday" },
  { key: "wedding_guest", label: "Wedding (guest)" },
  { key: "funeral", label: "Funeral" },
  { key: "graduation", label: "Graduation" },
  { key: "gym", label: "Workout" },
  { key: "travel", label: "Travel" },
  { key: "night_out", label: "Night out" }
];

const LOCATION_GROUPS: Array<{ label: string; options: Array<{ value: string; label: string }> }> = [
  {
    label: "Continents",
    options: [
      { value: "Europe", label: "Europe" },
      { value: "Africa", label: "Africa" },
      { value: "Americas", label: "Americas" },
      { value: "Asia", label: "Asia" }
    ]
  },
  {
    label: "Countries",
    options: [
      { value: "Ukraine", label: "Ukraine" },
      { value: "France", label: "France" },
      { value: "Italy", label: "Italy" },
      { value: "United Kingdom", label: "United Kingdom" },
      { value: "USA", label: "USA" },
      { value: "Japan", label: "Japan" },
      { value: "China", label: "China" },
      { value: "UAE", label: "UAE" },
      { value: "Turkey", label: "Turkey" }
    ]
  },
  {
    label: "Cities / capitals",
    options: [
      { value: "Kyiv", label: "Kyiv" },
      { value: "Paris", label: "Paris" },
      { value: "London", label: "London" },
      { value: "Milan", label: "Milan" },
      { value: "Rome", label: "Rome" },
      { value: "New York", label: "New York" },
      { value: "Los Angeles", label: "Los Angeles" },
      { value: "Tokyo", label: "Tokyo" },
      { value: "Shanghai", label: "Shanghai" },
      { value: "Beijing", label: "Beijing" },
      { value: "Dubai", label: "Dubai" },
      { value: "Istanbul", label: "Istanbul" }
    ]
  },
  {
    label: "Landmarks",
    options: [
      { value: "Eiffel Tower (Paris)", label: "Eiffel Tower (Paris)" },
      { value: "Shibuya Crossing (Tokyo)", label: "Shibuya Crossing (Tokyo)" },
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
      setError("Upload a base photo.");
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
            Please sign in to use the generator. <a href="#/login">Sign in</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Daily look</h1>
        <p className="muted">Generate outfit ideas based on weather, location, and occasion. Results are saved to “My styles”.</p>

        <div className="dailyForm">
          <label className="field">
            <span className="fieldLabel">Location</span>
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
            <span className="fieldLabel">Weather</span>
            <select className="input" value={weather} onChange={(e) => setWeather(e.target.value as WeatherKey)}>
              {WEATHER_OPTIONS.map((w) => (
                <option key={w.key} value={w.key}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="fieldLabel">Occasion</span>
            <select className="input" value={occasion} onChange={(e) => setOccasion(e.target.value as OccasionKey)}>
              {OCCASION_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="fieldLabel">Base photo</span>
            <label className="filePick" style={{ width: "100%" }}>
              <input className="fileInput" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span>{file ? "Change photo" : "Upload photo"}</span>
            </label>
          </label>
        </div>

        {previewUrl ? (
          <div className="previewBlock">
            <div className="previewLabel">Base photo</div>
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
            {creating ? "Generating..." : pending ? "In progress..." : "Generate 5 looks"}
          </button>
          <button className="btn secondary" onClick={() => navigate("/my-styles")}>
            My styles
          </button>
        </div>

        {generationId ? (
          <p className="muted" style={{ marginTop: 10 }}>
            {generationName ? (
              <>
                Name: <code>{generationName}</code>
                <br />
              </>
            ) : null}
            Context: <code>{headerMeta}</code>
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
                    <div className="pairLabel">Before</div>
                    {previewUrl || sourceFrontUrl ? (
                      <img className="pairImg" src={previewUrl || sourceFrontUrl || ""} alt="Input" />
                    ) : (
                      <div className="pairEmpty">Input photo</div>
                    )}
                  </div>
                  <div className="pairFrame">
                    <div className="pairLabel">After</div>
                    {j.images?.length ? (
                      <a className="pairLink" href={j.images[0]} target="_blank" rel="noreferrer">
                        <img className="pairImg" src={j.images[0]} alt={j.style_label} loading="lazy" />
                      </a>
                    ) : j.status === "ERROR" ? (
                      <div className="pairEmpty">Error</div>
                    ) : (
                      <div className="pairEmpty">Generating...</div>
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
