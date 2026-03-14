import { useEffect, useState } from "react";

type Health = { ok: boolean };

export default function GeneratePage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="page">
      <div className="card">
        <h1>Генерація стилю</h1>
        <p className="muted">Завантаж фото, і ми згенеруємо 6 стилів (fal.ai).</p>

        <div className="row">
          <span className="label">API health</span>
          <span className="value">
            {error ? `Error: ${error}` : health ? (health.ok ? "OK" : "NOT OK") : "Loading..."}
          </span>
        </div>

        <p className="muted" style={{ marginTop: 14 }}>
          Endpoint: <code>/api/generations/</code> (multipart <code>image</code>)
        </p>
      </div>
    </div>
  );
}

