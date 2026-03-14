import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

type Mode = "login" | "register";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      const payload =
        mode === "register"
          ? { email, password, first_name: firstName, last_name: lastName }
          : { email, password };

      const r = await fetch(mode === "register" ? "/api/auth/register/" : "/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);

      await refresh();
      navigate("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1>{mode === "login" ? "Вхід" : "Реєстрація"}</h1>
        <p className="muted">Проста авторизація для привʼязки твоїх стилів.</p>

        <div className="form">
          <label className="field">
            <span className="fieldLabel">Пошта</span>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span className="fieldLabel">Пароль</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          {mode === "register" ? (
            <>
              <label className="field">
                <span className="fieldLabel">Імʼя</span>
                <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>
              <label className="field">
                <span className="fieldLabel">Прізвище</span>
                <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </label>
            </>
          ) : null}
        </div>

        {error ? (
          <div className="alert">
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        <div className="actions">
          <button className="btn" disabled={busy || !email || !password} onClick={() => void onSubmit()}>
            {busy ? "..." : mode === "login" ? "Увійти" : "Створити акаунт"}
          </button>
          <button
            className="btn secondary"
            disabled={busy}
            onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
          >
            {mode === "login" ? "Реєстрація" : "У мене вже є акаунт"}
          </button>
        </div>
      </div>
    </div>
  );
}
