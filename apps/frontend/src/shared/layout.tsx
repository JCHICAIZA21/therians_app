import { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
    >
      {label}
    </NavLink>
  );
}

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="shell">
      <header className="header">
        <div className="brand">
          <div className="brand-badge">T</div>
          <div>
            <h1>Therians App</h1>
            <p>Matching consciente + adopción responsable</p>
          </div>
        </div>
        <span className="status ok">MVP</span>
      </header>

      <nav className="nav" aria-label="Navegación principal">
        <NavItem to="/onboarding" label="Onboarding" />
        <NavItem to="/matching" label="Matching" />
        <NavItem to="/chat" label="Chat" />
        <NavItem to="/adoption" label="Adopción" />
      </nav>

      {children}
    </div>
  );
}
