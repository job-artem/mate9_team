import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function LogoutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // No auth in MVP, but this makes the menu item meaningful.
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="page">
      <div className="card">
        <h1>Вихід</h1>
        <p className="muted">Локальні дані очищені. Авторизацію додамо пізніше.</p>

        <div className="actions">
          <button className="btn" onClick={() => navigate("/")}>
            Повернутись до генерації
          </button>
          <Link className="btn secondary" to="/">
            На головну
          </Link>
        </div>
      </div>
    </div>
  );
}

