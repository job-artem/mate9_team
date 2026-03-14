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

function lookContextText(styleKey: string, styleLabel: string) {
  const k = (styleKey || "").toLowerCase();
  const byKey: Record<string, string> = {
    tech_founder:
      "Best for pitches, investor meetings, or office days. Clean silhouette, smart casual, confident look.",
    fashion_model:
      "Best for photoshoots, fashion events, or when you want an editorial vibe. Focus on styling and details.",
    streetwear:
      "Best for city life, walks, parties, and creative work. Oversized layers, modern street look, cinematic feel.",
    luxury_lifestyle:
      "Best for dinners, hotels, important events, and premium outings. Tailored pieces, glossy light, elevated vibe.",
    fitness_athlete:
      "Best for workouts, fitness routine, or sporty content. Athletic fit, energy, clean lines.",
    minimal_aesthetic:
      "Best for everyday life, work, or meetings when you want a clean premium look. Monochrome, balance.",
  };

  if (byKey[k]) return byKey[k];
  const label = (styleLabel || "").toLowerCase();
  if (label.includes("tech")) return byKey.tech_founder;
  if (label.includes("fashion")) return byKey.fashion_model;
  if (label.includes("street")) return byKey.streetwear;
  if (label.includes("luxury")) return byKey.luxury_lifestyle;
  if (label.includes("fitness")) return byKey.fitness_athlete;
  if (label.includes("minimal")) return byKey.minimal_aesthetic;
  return "A practical look for everyday outings and content: quickly validate the vibe on yourself and keep the best results.";
}

export default function MyStyleDetailPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<StyleItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storesOpenFor, setStoresOpenFor] = useState<string | null>(null);
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());

  const STORE_PARTNERS: Array<{ id: string; name: string; badge: string }> = [
    { id: "zara", name: "Zara", badge: "ZA" },
    { id: "hm", name: "H&M", badge: "HM" },
    { id: "asos", name: "ASOS", badge: "AS" },
    { id: "uniqlo", name: "UNIQLO", badge: "UQ" },
    { id: "nike", name: "Nike", badge: "NK" },
    { id: "farfetch", name: "FARFETCH", badge: "FF" },
    { id: "amazon_fashion", name: "Amazon Fashion", badge: "AM" },
  ];

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
            <h1 style={{ marginBottom: 6 }}>{item?.name || "Style"}</h1>
            <p className="muted" style={{ margin: 0 }}>
              <Link to="/my-styles">Back to list</Link>
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
                      <div className="pairLabel">Before</div>
                      {item.source_images?.front ? (
                        <img className="pairImg" src={item.source_images.front} alt="Input front" loading="lazy" />
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
                      ) : j.error ? (
                        <div className="pairEmpty">Error</div>
                      ) : (
                        <div className="pairEmpty">No result</div>
                      )}
                    </div>
                    <div className="pairFrame pairContext" onClick={(e) => e.stopPropagation()}>
                      <div className="pairLabel">Context</div>
                      <div className="pairContextInner">
                        <div className="pairContextTitle">When this look works</div>
                        <div className="pairContextText">{lookContextText(j.style_key, j.style_label)}</div>
                        <div className="pairContextActions">
                          <button
                            className="btn secondary"
                            type="button"
                            onClick={() => setStoresOpenFor((prev) => (prev === j.style_key ? null : j.style_key))}
                          >
                            Find in stores
                          </button>
                          <button
                            className="btn secondary"
                            type="button"
                            onClick={() => window.alert("Coming soon: save ideas and improvement prompts for this look.")}
                          >
                            Add ideas
                          </button>
                        </div>
                        {storesOpenFor === j.style_key ? (
                          <div className="storesBox">
                            <div className="storesTitle">Search in your favorite stores (coming soon)</div>
                            <div className="storesList">
                              {STORE_PARTNERS.map((s) => {
                                const checked = selectedStores.has(s.id);
                                return (
                                  <label key={s.id} className={checked ? "storeItem checked" : "storeItem"}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        setSelectedStores((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(s.id)) next.delete(s.id);
                                          else next.add(s.id);
                                          return next;
                                        });
                                      }}
                                    />
                                    <span className="storeIcon" aria-hidden="true">
                                      {s.badge}
                                    </span>
                                    <span className="storeName">{s.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                            <div className="storesHint">
                              Next step: we will query these stores for similar items (by style + image).
                            </div>
                          </div>
                        ) : null}
                      </div>
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
