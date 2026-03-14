import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth";

type Job = { style_key: string; style_label: string; status: string; images: string[]; error: string };
type StyleItem = {
  id: string;
  name: string;
  created_at: string;
  source_images: { front?: string; left?: string; right?: string };
  jobs: Job[];
};

export default function MyStyleDetailPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<StyleItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!id) return;

    let cancelled = false;
    fetch(`/api/my-styles/${id}/`)
      .then(async (r) => {
        if (r.status === 401) throw new Error("Unauthorized");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as { style: StyleItem };
      })
      .then((data) => {
        if (!cancelled) setItem(data.style);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });

    return () => {
      cancelled = true;
    };
  }, [user, loading, id, navigate]);

  return (
    <div className="page">
      <div className="card">
        <div className="detailHead">
          <div>
            <h1 style={{ marginBottom: 6 }}>{item?.name || "Стиль"}</h1>
            <p className="muted" style={{ margin: 0 }}>
              <Link to="/my-styles">Назад до списку</Link>
            </p>
          </div>
          {item?.created_at ? <div className="styleMeta">{new Date(item.created_at).toLocaleString()}</div> : null}
        </div>

        {error ? (
          <div className="alert">
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        {!item && !error ? <p className="muted">Loading...</p> : null}

        {item ? (
          <>
            <div className="previewBlock">
              <div className="previewLabel">Вхідні фото</div>
              <div className="previewRow">
                {item.source_images?.front ? (
                  <div className="thumbWrap">
                    <img className="previewThumb" src={item.source_images.front} alt="front" loading="lazy" />
                    <div className="thumbLabel">Прямо</div>
                  </div>
                ) : null}
                {item.source_images?.left ? (
                  <div className="thumbWrap">
                    <img className="previewThumb" src={item.source_images.left} alt="left" loading="lazy" />
                    <div className="thumbLabel">45° ліворуч</div>
                  </div>
                ) : null}
                {item.source_images?.right ? (
                  <div className="thumbWrap">
                    <img className="previewThumb" src={item.source_images.right} alt="right" loading="lazy" />
                    <div className="thumbLabel">45° праворуч</div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="jobs">
              {item.jobs.map((j) => (
                <div key={j.style_key} className="job">
                  <div className="jobHead">
                    <div className="jobTitle">{j.style_label}</div>
                    <div className={j.status === "COMPLETED" ? "badge ok" : j.status === "ERROR" ? "badge err" : "badge"}>
                      {j.status}
                    </div>
                  </div>
                  <div className="pair">
                    <div className="pairFrame">
                      <div className="pairLabel">До</div>
                      {item.source_images?.front ? (
                        <img className="pairImg" src={item.source_images.front} alt="Input front" loading="lazy" />
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
                      ) : j.error ? (
                        <div className="pairEmpty">Помилка</div>
                      ) : (
                        <div className="pairEmpty">Немає результату</div>
                      )}
                    </div>
                  </div>
                  {j.error ? <div className="jobErr">{j.error}</div> : null}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

