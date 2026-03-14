import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import GeneratePage from "./pages/GeneratePage";
import MyStylesListPage from "./pages/MyStylesListPage";
import MyStyleDetailPage from "./pages/MyStyleDetailPage";
import DailyLookPage from "./pages/DailyLookPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import { useAuth } from "./auth";

export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const displayName = user ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username : "";

  return (
    <div className="appShell">
      <header className={isLanding ? "topbar topbarLanding" : "topbar"}>
        <div className="topbarInner">
          <Link to="/" className="brand">
            Mate9
          </Link>

          {user && !isLanding ? (
            <nav className="nav">
              <NavLink to="/generate" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
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
          ) : isLanding ? (
            <div className="navLanding" />
          ) : (
            <div className="navEmpty" />
          )}

          <div className={isLanding ? "userBox userBoxLanding" : "userBox"} title={user ? user.username : ""}>
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
                <>
                  {displayName} {isLanding ? <span className="proPill">PRO</span> : null}
                </>
              ) : (
                isLanding ? (
                  <Link className="userLink" to="/login">
                    Sign in
                  </Link>
                ) : (
                  <>
                    Треба залогінитись.{" "}
                    <Link className="userLink" to="/login">
                      Вхід
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/generate" element={<GeneratePage />} />
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
