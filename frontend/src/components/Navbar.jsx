import heroLogo from "../hero-logo.png";
import { cx } from "./shared.jsx";

export default function Navbar({ dark, setDark, activeView, onViewChange }) {
  const navItems = [
    { label: "Dashboard", view: "dashboard" },
    { label: "History", view: "history" },
    { label: "Settings", view: "brand" },
  ];

  return (
    <header className="navbar">
      <div className="nav-left">
        <img src={heroLogo} alt="Hero MotoCorp" className="nav-logo" />
        <span className="brand-wordmark">Hero Studio</span>
      </div>

      <nav className="nav-center" aria-label="Primary navigation">
        {navItems.map(item => (
          <button
            key={item.label}
            type="button"
            className={cx("nav-link", activeView === item.view && "active")}
            onClick={() => onViewChange(item.view)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="nav-right">
        <button className="theme-toggle" type="button" onClick={() => setDark(d => !d)} title={dark ? "Switch to Light" : "Switch to Dark"}>
          {dark ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
        <div className="profile-avatar">HS</div>
      </div>
    </header>
  );
}


