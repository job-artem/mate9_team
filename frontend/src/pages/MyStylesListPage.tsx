import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

type Job = { style_key: string; style_label: string; status: string; images: string[]; error: string };
type StyleItem = {
  id: string;
  name: string;
  created_at: string;
  source_images: { front?: string; left?: string; right?: string };
  jobs: Job[];
};

export default function MyStylesListPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<StyleItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login");
      return;
    }

    let cancelled = false;
    fetch("/api/my-styles/")
      .then(async (r) => {
        if (r.status === 401) throw new Error("Unauthorized");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as { styles: StyleItem[] };
      })
      .then((data) => {
        if (!cancelled) setItems(data.styles || []);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });

    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate]);

  const renameStyle = async (id: string, currentName: string) => {
    const next = window.prompt("Нова назва стилю", currentName);
    if (!next || next.trim() === currentName) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/my-styles/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next.trim() }),
      });
      if (r.status === 401) throw new Error("Unauthorized");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, name: next.trim() } : it)));
    } finally {
      setBusyId((prev) => (prev === id ? null : prev));
    }
  };

  const deleteStyle = async (id: string, name: string) => {
    if (!window.confirm(`Видалити стиль “${name}”?`)) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/my-styles/${id}/`, { method: "DELETE" });
      if (r.status === 401) throw new Error("Unauthorized");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setItems((prev) => prev.filter((it) => it.id !== id));
    } finally {
      setBusyId((prev) => (prev === id ? null : prev));
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1>Мої стилі</h1>
        <p className="muted">Список твоїх “проєктів стилю”. Клікни рядок, щоб відкрити деталі.</p>

        {error ? (
          <div className="alert">
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        {!items.length && !error ? (
          <p className="muted">
            Поки порожньо. Перейди в <Link to="/generate">Генерація стилю</Link> і згенеруй перший сет.
          </p>
        ) : null}

        {items.length ? (
          <div className="stylesTable">
            {items.map((it) => {
              const previews = it.jobs
                .map((j) => ({ key: j.style_key, label: j.style_label, url: j.images?.[0] || "", status: j.status }))
                .slice(0, 6);

              return (
                <div
                  key={it.id}
                  className="stylesRow"
                  onClick={() => navigate(`/my-styles/${it.id}`)}
                  title="Open details"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") navigate(`/my-styles/${it.id}`);
                  }}
                >
                  <div className="stylesRowLeft">
                    <div className="stylesRowTitle">{it.name}</div>
                    <div className="stylesRowMeta">{new Date(it.created_at).toLocaleString()}</div>
                    <div className="stylesRowImg">
                      {it.source_images?.front ? (
                        <img src={it.source_images.front} alt="input front" loading="lazy" />
                      ) : (
                        <div className="pairEmpty">Вхідне фото</div>
                      )}
                    </div>
                  </div>

                  <div className="stylesRowThumbs">
                    <div className="stylesRowGrid" aria-label="Generated previews">
                      {previews.map((p) => (
                        <div key={p.key} className="stylesThumb" title={p.label}>
                          {p.url ? <img src={p.url} alt={p.label} loading="lazy" /> : <div className="stylesThumbEmpty">{p.status}</div>}
                          <div className="stylesThumbLabel">{p.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="stylesRowActions" aria-label="Row actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="rowActionBtn"
                      type="button"
                      disabled={busyId === it.id}
                      onClick={() => renameStyle(it.id, it.name)}
                      title="Rename"
                    >
                      Змінити
                    </button>
                    <button
                      className="rowActionBtn danger"
                      type="button"
                      disabled={busyId === it.id}
                      onClick={() => deleteStyle(it.id, it.name)}
                      title="Delete"
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
