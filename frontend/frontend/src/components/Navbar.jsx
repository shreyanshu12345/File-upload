import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <>
      <style>{css}</style>
      <nav className="nb-root">
        <div className="nb-brand">R2 TRANSFER</div>
        <div className="nb-links">
          <NavLink to="/" end className={({ isActive }) => "nb-link" + (isActive ? " nb-link--active" : "")}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16" />
              <line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
            </svg>
            UPLOAD
          </NavLink>
          <NavLink to="/download" className={({ isActive }) => "nb-link" + (isActive ? " nb-link--active" : "")}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            DOWNLOAD
          </NavLink>
        </div>
      </nav>
    </>
  );
}

const css = `
.nb-root {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 44px;
  background: #0a0a0a;
  border-bottom: 1px solid #1a1a1a;
  font-family: 'IBM Plex Mono', monospace;
}

.nb-brand {
  font-size: 11px;
  font-weight: 600;
  color: #f59e0b;
  letter-spacing: 0.2em;
}

.nb-links {
  display: flex;
  gap: 4px;
}

.nb-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: #444;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 2px;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}

.nb-link:hover {
  color: #f59e0b;
  background: #f59e0b08;
}

.nb-link--active {
  color: #f59e0b;
  border-color: #f59e0b33;
  background: #f59e0b0a;
}
`;
