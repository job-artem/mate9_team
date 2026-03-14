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

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [leftPreview, setLeftPreview] = useState<string | null>(null);
  const [rightPreview, setRightPreview] = useState<string | null>(null);

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

  useEffect(() => bindPreview(frontFile, setFrontPreview), [frontFile]);
  useEffect(() => bindPreview(leftFile, setLeftPreview), [leftFile]);
  useEffect(() => bindPreview(rightFile, setRightPreview), [rightFile]);

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
    if (!frontFile || !leftFile || !rightFile) {
      setApiError("Завантаж 3 фото: прямо, 45° ліворуч, 45° праворуч.");
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
      form.append("image_front", frontFile);
      form.append("image_left", leftFile);
      form.append("image_right", rightFile);
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
          Завантаж 3 фото в повний зріст (прямо, 45° ліворуч, 45° праворуч) і отримай образи (AI Multiverse).
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
          <label className="filePick">
            <input className="fileInput" type="file" accept="image/*" onChange={(e) => setFrontFile(e.target.files?.[0] || null)} />
            <span>{frontFile ? "Прямо: змінити" : "Прямо: завантажити"}</span>
          </label>
          <label className="filePick">
            <input className="fileInput" type="file" accept="image/*" onChange={(e) => setLeftFile(e.target.files?.[0] || null)} />
            <span>{leftFile ? "45° ліворуч: змінити" : "45° ліворуч: завантажити"}</span>
          </label>
          <label className="filePick">
            <input className="fileInput" type="file" accept="image/*" onChange={(e) => setRightFile(e.target.files?.[0] || null)} />
            <span>{rightFile ? "45° праворуч: змінити" : "45° праворуч: завантажити"}</span>
          </label>

          <button
            className="btn"
            disabled={creating || pending || !frontFile || !leftFile || !rightFile || selectedStyleKeys.size === 0}
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

        {frontPreview || leftPreview || rightPreview ? (
          <div className="previewBlock">
            <div className="previewLabel">Вхідні фото</div>
            <div className="previewRow">
              {frontPreview ? <img className="previewThumb" src={frontPreview} alt="Front preview" /> : <div className="previewEmpty">Прямо</div>}
              {leftPreview ? <img className="previewThumb" src={leftPreview} alt="Left preview" /> : <div className="previewEmpty">45° ліворуч</div>}
              {rightPreview ? <img className="previewThumb" src={rightPreview} alt="Right preview" /> : <div className="previewEmpty">45° праворуч</div>}
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
                    {frontPreview || sourceFrontUrl ? (
                      <img className="pairImg" src={frontPreview || sourceFrontUrl || ""} alt="Input front" />
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
