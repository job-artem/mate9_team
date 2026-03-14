import { NavLink, Route, Routes } from "react-router-dom";
import GeneratePage from "./pages/GeneratePage";
import LogoutPage from "./pages/LogoutPage";

export default function App() {
  return (
    <div className="appShell">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">Mate9</div>
          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
              Генерація стилю
            </NavLink>
            <NavLink to="/logout" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
              Вихід
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<GeneratePage />} />
          <Route path="/logout" element={<LogoutPage />} />
        </Routes>
      </main>
    </div>
  );
}

