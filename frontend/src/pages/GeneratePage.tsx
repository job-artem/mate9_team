import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

type Health = { ok: boolean };

type Style = { key: string; label: string; prompt: string };
type StylesResponse = { styles: Style[] };

type CreateGenerationResponse = {
  generation: {
    id: string;
    created_at: string;
    endpoint: string;
    source_image_url: string;
    source_images?: { front?: string; left?: string; right?: string };
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

type GenerationStatusResponse = {
  generation: {
    id: string;
    created_at: string;
    endpoint: string;
    source_image_url: string;
    source_images?: { front?: string; left?: string; right?: string };
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

export default function GeneratePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [styles, setStyles] = useState<Style[]>([]);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [selectedStyleKeys, setSelectedStyleKeys] = useState<Set<string>>(new Set());

  const [creating, setCreating] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<GenerationStatusResponse["jobs"]>([]);
  const [pending, setPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [styleName, setStyleName] = useState("");
  const [sourceFrontUrl, setSourceFrontUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health/")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as Health;
      })
      .then((data) => {
        if (!cancelled) setHealth(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/styles/")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as StylesResponse;
      })
      .then((data) => {
        if (cancelled) return;
        const list = data.styles || [];
        setStyles(list);
        setSelectedStyleKeys(new Set(list.map((s) => s.key)));
      })
      .catch(() => {
        // styles is optional for UI; ignore errors
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const bindPreview = (file: File | null, setter: (url: string | null) => void) => {
    if (!file) {
      setter(null);
      return () => {};
    }
    const url = URL.createObjectURL(file);
    setter(url);
    return () => URL.revokeObjectURL(url);
  };

  useEffect(() => bindPreview(photoFile, setPhotoPreview), [photoFile]);

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
        if (!cancelled) setApiError(e instanceof Error ? e.message : String(e));
        if (!cancelled) setPending(false);
      }
    };

    const t = window.setInterval(() => {
      void tick();
    }, 1500);
    void tick();

    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [generationId, pending]);

  const onGenerate = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!photoFile) {
      setApiError("Додай фото, щоб згенерувати стилі.");
      return;
    }

    const stylesToSend = Array.from(selectedStyleKeys);
    if (!stylesToSend.length) {
      setApiError("Обери хоча б 1 стилістику.");
      return;
    }

    setApiError(null);
    setCreating(true);
    setGenerationId(null);
    setJobs([]);
    setPending(false);
    setSourceFrontUrl(null);

    try {
      const form = new FormData();
      form.append("image", photoFile);
      form.append("styles", stylesToSend.join(","));
      if (styleName.trim()) form.append("name", styleName.trim());

      const r = await fetch("/api/generations/", { method: "POST", body: form });
      const data = (await r.json()) as CreateGenerationResponse & { error?: string; hint?: string };
      if (r.status === 401) {
        navigate("/login");
        return;
      }
      if (!r.ok) throw new Error([data.error, data.hint].filter(Boolean).join(". ") || `HTTP ${r.status}`);

      setGenerationId(data.generation.id);
      setSourceFrontUrl(data.generation.source_images?.front || data.generation.source_image_url || null);

      // Map initial jobs to the polling response shape.
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
      setApiError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1>Генерація стилю</h1>
        <p className="muted">
          Додай фото і отримай образи (AI Multiverse) у 6 стилях.
        </p>

        {!loading && !user ? (
          <div className="alert">

            Потрібен вхід. <a href="#/login">Перейти на логін</a>
          </div>
        ) : null}

        {/*<div className="row" style={{ marginTop: 18 }}>*/}
        {/*  <span className="label">API health</span>*/}
        {/*  <span className="value">*/}
        {/*    {error ? `Error: ${error}` : health ? (health.ok ? "OK" : "NOT OK") : "Loading..."}*/}
        {/*  </span>*/}
        {/*</div>*/}

        <div className="uploader">
          <label className="fieldInline">
            <span className="fieldLabel">Назва</span>
            <input
              className="input"
              placeholder="Напр. 'Мій Multiverse #1'"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
            />
          </label>




            <div className="filePickerContainer">

                <input className="fileInput" type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />

                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 31.9987C0 14.3263 14.3263 0 31.9987 0C49.6711 0 63.9974 14.3263 63.9974 31.9987C63.9974 49.6711 49.6711 63.9974 31.9987 63.9974C14.3263 63.9974 0 49.6711 0 31.9987Z" fill="#F5F5F5"/>
                    <path d="M43.9956 35.9976V41.3296C43.9956 42.0367 43.7147 42.7148 43.2147 43.2147C42.7148 43.7147 42.0367 43.9956 41.3296 43.9956H22.6675C21.9604 43.9956 21.2823 43.7147 20.7823 43.2147C20.2823 42.7148 20.0015 42.0367 20.0015 41.3296V35.9976" stroke="#525252" stroke-width="2.66602" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M38.6636 26.6665L31.9985 20.0015L25.3335 26.6665" stroke="#525252" stroke-width="2.66602" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M31.9985 20.0015V35.9976" stroke="#525252" stroke-width="2.66602" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>


                <p>Click to upload or drag and drop</p>


            </div>

          {/*<label className="filePick">*/}
          {/*  <input className="fileInput" type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />*/}
          {/*  <span>{photoFile ? "Змінити фото" : "Додати фото"}</span>*/}
          {/*</label>*/}

          <button
            className="btn"
            disabled={creating || pending || !photoFile || selectedStyleKeys.size === 0}
            onClick={() => void onGenerate()}
          >
            {creating ? "Генеруємо..." : pending ? "У процесі..." : "Згенерувати"}
          </button>
        </div>

        {apiError ? (
          <div className="alert">
            <strong>Error:</strong> {apiError}
          </div>
        ) : null}

        {photoPreview ? (
          <div className="previewBlock">
            <div className="previewLabel">Вхідне фото</div>
            <div className="previewRow" style={{ gridTemplateColumns: "1fr" }}>
              <img className="previewThumb" src={photoPreview} alt="Photo preview" />
            </div>
          </div>
        ) : null}

        {styles.length ? (
          <div className="stylesPick">
            <div className="previewLabel">Стилістика оточення</div>
            <div className="stylesGrid">
              {styles.map((s) => {
                const checked = selectedStyleKeys.has(s.key);
                return (
                  <label key={s.key} className={checked ? "styleOpt checked" : "styleOpt"}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedStyleKeys((prev) => {
                          const next = new Set(prev);
                          if (next.has(s.key)) next.delete(s.key);
                          else next.add(s.key);
                          return next;
                        });
                      }}
                    />
                    <span>{s.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        {generationId ? (
          <p className="muted" style={{ marginTop: 10 }}>
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
                    {photoPreview || sourceFrontUrl ? (
                      <img className="pairImg" src={photoPreview || sourceFrontUrl || ""} alt="Input photo" />
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
