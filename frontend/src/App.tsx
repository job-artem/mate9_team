import { Link, NavLink, Route, Routes } from "react-router-dom";
import GeneratePage from "./pages/GeneratePage";
import MyStylesListPage from "./pages/MyStylesListPage";
import MyStyleDetailPage from "./pages/MyStyleDetailPage";
import DailyLookPage from "./pages/DailyLookPage";
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
          {user ? (
            <nav className="nav">
              <NavLink to="/" end className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
                Генерація стилю
              </NavLink>
              <NavLink to="/daily-look" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
                Daily look
              </NavLink>
              <NavLink to="/my-styles" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
                Мої стилі
              </NavLink>
              <NavLink to="/logout" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
                Вихід
              </NavLink>
            </nav>
          ) : (
            <div className="navEmpty" />
          )}

          <div className="userBox" title={user ? user.username : ""}>
            <div className="userIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="8" r="4" />
              </svg>
            </div>
            <div className="userName">
              {loading ? (
                "..."
              ) : user ? (
                displayName
              ) : (
                <p class="login-text">
                  <Link className="userLink" to="/login">Вхід</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<GeneratePage />} />
          <Route path="/daily-look" element={<DailyLookPage />} />
          <Route path="/my-styles" element={<MyStylesListPage />} />
          <Route path="/my-styles/:id" element={<MyStyleDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutPage />} />
        </Routes>
      </main>
    </div>
  );
}
