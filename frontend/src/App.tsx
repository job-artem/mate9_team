import { useEffect, useState } from "react";

type Health = { ok: boolean };

export default function App() {
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
        <h1>Mate9</h1>
        <p className="muted">React (Vite) + Django + Postgres via docker-compose</p>
        <div className="row">
          <span className="label">API health</span>
          <span className="value">
            {error ? `Error: ${error}` : health ? (health.ok ? "OK" : "NOT OK") : "Loading..."}
          </span>
        </div>
        <p className="muted">
          Backend endpoint: <code>/api/health/</code>
        </p>
      </div>
    </div>
  );
}

