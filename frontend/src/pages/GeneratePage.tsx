import { useEffect, useState } from "react";

type Health = { ok: boolean };

type Style = { key: string; label: string; prompt: string };
type StylesResponse = { styles: Style[] };

type CreateGenerationResponse = {
  generation: { id: string; created_at: string; endpoint: string; source_image_url: string };
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
  generation: { id: string; created_at: string; endpoint: string; source_image_url: string };
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
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [styles, setStyles] = useState<Style[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<GenerationStatusResponse["jobs"]>([]);
  const [pending, setPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
        if (!cancelled) setStyles(data.styles || []);
      })
      .catch(() => {
        // styles is optional for UI; ignore errors
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    if (!generationId) return;
    if (!pending) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/generations/${generationId}/`);
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
    if (!file) {
      setApiError("Choose a selfie photo first.");
      return;
    }

    setApiError(null);
    setCreating(true);
    setGenerationId(null);
    setJobs([]);
    setPending(false);

    try {
      const form = new FormData();
      form.append("image", file);

      const r = await fetch("/api/generations/", { method: "POST", body: form });
      const data = (await r.json()) as CreateGenerationResponse & { error?: string; hint?: string };
      if (!r.ok) throw new Error([data.error, data.hint].filter(Boolean).join(". ") || `HTTP ${r.status}`);

      setGenerationId(data.generation.id);

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
        <p className="muted">Завантаж selfie і отримай 6 образів (AI Multiverse).</p>

        <div className="row" style={{ marginTop: 18 }}>
          <span className="label">API health</span>
          <span className="value">
            {error ? `Error: ${error}` : health ? (health.ok ? "OK" : "NOT OK") : "Loading..."}
          </span>
        </div>

        <div className="uploader">
          <label className="filePick">
            <input
              className="fileInput"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <span>{file ? "Change photo" : "Upload selfie"}</span>
          </label>

          <button className="btn" disabled={creating || pending || !file} onClick={() => void onGenerate()}>
            {creating ? "Generating..." : pending ? "Working..." : "Generate 6 styles"}
          </button>
        </div>

        {apiError ? (
          <div className="alert">
            <strong>Error:</strong> {apiError}
          </div>
        ) : null}

        {previewUrl ? (
          <div className="previewBlock">
            <div className="previewLabel">Input</div>
            <img className="previewImg" src={previewUrl} alt="Selfie preview" />
          </div>
        ) : null}

        {styles.length ? (
          <div className="chips">
            {styles.map((s) => (
              <span key={s.key} className="chip">
                {s.label}
              </span>
            ))}
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
                {j.images?.length ? (
                  <div className="grid">
                    {j.images.map((url) => (
                      <a key={url} className="gridItem" href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt={j.style_label} loading="lazy" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
