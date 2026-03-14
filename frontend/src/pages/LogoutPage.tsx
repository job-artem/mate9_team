import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function LogoutPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    void logout().finally(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // ignore
      }
      navigate("/login");
    });
  }, []);

  return (
    <div className="page">
      <div className="card">
        <h1>Signed out</h1>
        <p className="muted">Local data cleared.</p>

        <div className="actions">
          <button className="btn" onClick={() => navigate("/generate")}>
            Back to generator
          </button>
          <Link className="btn secondary" to="/">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
