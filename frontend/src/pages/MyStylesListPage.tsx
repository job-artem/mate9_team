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
            Поки порожньо. Перейди в <Link to="/">Генерація стилю</Link> і згенеруй перший сет.
          </p>
        ) : null}

        {items.length ? (
          <div className="stylesTable">
            {items.map((it) => {
              const previews = it.jobs
                .map((j) => ({ key: j.style_key, label: j.style_label, url: j.images?.[0] || "", status: j.status }))
                .slice(0, 6);

              return (
                <button
                  key={it.id}
                  className="stylesRow"
                  onClick={() => navigate(`/my-styles/${it.id}`)}
                  title="Open details"
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

                  <div className="stylesRowRight">
                    <div className="stylesRowGrid">
                      {previews.map((p) => (
                        <div key={p.key} className="stylesThumb" title={p.label}>
                          {p.url ? <img src={p.url} alt={p.label} loading="lazy" /> : <div className="stylesThumbEmpty">{p.status}</div>}
                          <div className="stylesThumbLabel">{p.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

