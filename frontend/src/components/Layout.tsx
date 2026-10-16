import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Activity, User, BarChart3, GitFork, Cpu, History, Settings, ShieldCheck, Sun, Moon, Hexagon } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import "./Layout.css";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/predict", label: "Predict", icon: Activity },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/skill-gap", label: "Skill Gap", icon: GitFork },
  { to: "/model", label: "Model", icon: Cpu },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
];

export function ThemeSwitch() {
  const { theme, toggle } = useTheme();
  return (
    <button className={`tswitch ${theme}`} onClick={toggle} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title="Toggle theme">
      <span className="tswitch-knob">{theme === "light" ? <Sun size={15} /> : <Moon size={15} />}</span>
      <span className="tswitch-track">{theme === "light" ? "LIGHT" : "DARK"}</span>
    </button>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  const hideChrome = loc.pathname === "/";
  if (hideChrome) return <>{children}</>;
  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => nav("/")} aria-label="PlaceIntel home">
          <Hexagon size={22} strokeWidth={2.4} />
          <span>PLACE<em>INTEL</em></span>
          <span className="brand-tag mono">v1.0 / neuro-fuzzy</span>
        </button>
        <nav className="topnav">
          {LINKS.slice(0, 6).map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `topnav-link${isActive ? " active" : ""}`}>{label}</NavLink>
          ))}
        </nav>
        <div className="topbar-right">
          <ThemeSwitch />
          <button className="avatar" onClick={() => nav("/profile")} aria-label="Profile">AS</button>
        </div>
      </header>
      <main>{children}</main>
      <nav className="bottomnav" aria-label="Primary">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `bnav-link${isActive ? " active" : ""}`}>
            <Icon size={19} /><span>{label}</span>
          </NavLink>
        ))}
        <NavLink to="/settings" className={({ isActive }) => `bnav-link${isActive ? " active" : ""}`}>
          <Settings size={19} /><span>Settings</span>
        </NavLink>
      </nav>
    </>
  );
}
