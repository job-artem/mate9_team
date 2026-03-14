import { NavLink, Route, Routes } from "react-router-dom";
import GeneratePage from "./pages/GeneratePage";
import MyStylesPage from "./pages/MyStylesPage";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import { useAuth } from "./auth";

export default function App() {
  const { user, loading } = useAuth();
  const displayName = user ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username : "";

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">Mate9</div>
          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
              Генерація стилю
            </NavLink>
            <NavLink to="/my-styles" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
              Мої стилі
            </NavLink>
            <NavLink to="/logout" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
              Вихід
            </NavLink>
          </nav>

          <div className="userBox" title={user ? user.username : ""}>
            <div className="userIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="8" r="4" />
              </svg>
            </div>
            <div className="userName">{loading ? "..." : user ? displayName : "Гість"}</div>
          </div>
        </div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<GeneratePage />} />
          <Route path="/my-styles" element={<MyStylesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutPage />} />
        </Routes>
      </main>
    </div>
  );
}
