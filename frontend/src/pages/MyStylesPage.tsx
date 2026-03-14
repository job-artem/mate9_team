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

export default function MyStylesPage() {
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
        <p className="muted">Список твоїх генерацій, збережених на бекенді.</p>

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
          <div className="stylesList">
            {items.map((it) => (
              <div key={it.id} className="styleCard">
                <div className="styleCardHead">
                  <div>
                    <div className="styleName">{it.name}</div>
                    <div className="styleMeta">
                      <code>{it.id}</code>
                    </div>
                  </div>
                  <div className="styleMeta">{new Date(it.created_at).toLocaleString()}</div>
                </div>

                <div className="previewRow">
                  {it.source_images?.front ? (
                    <div className="thumbWrap">
                      <img className="previewThumb" src={it.source_images.front} alt="front" loading="lazy" />
                      <div className="thumbLabel">Прямо</div>
                    </div>
                  ) : null}
                  {it.source_images?.left ? (
                    <div className="thumbWrap">
                      <img className="previewThumb" src={it.source_images.left} alt="left" loading="lazy" />
                      <div className="thumbLabel">45° ліворуч</div>
                    </div>
                  ) : null}
                  {it.source_images?.right ? (
                    <div className="thumbWrap">
                      <img className="previewThumb" src={it.source_images.right} alt="right" loading="lazy" />
                      <div className="thumbLabel">45° праворуч</div>
                    </div>
                  ) : null}
                </div>

                <div className="jobs">
                  {it.jobs.map((j) => (
                    <div key={j.style_key} className="job">
                      <div className="jobHead">
                        <div className="jobTitle">{j.style_label}</div>
                        <div className={j.status === "COMPLETED" ? "badge ok" : j.status === "ERROR" ? "badge err" : "badge"}>
                          {j.status}
                        </div>
                      </div>
                      {j.images?.length ? (
                        <div className="grid">
                          {j.images.map((url) => (
                            <a key={url} className="gridItem" href={url} target="_blank" rel="noreferrer">
                              <img src={url} alt={j.style_label} loading="lazy" />
                            </a>
                          ))}
                        </div>
                      ) : j.error ? (
                        <div className="jobErr">{j.error}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

