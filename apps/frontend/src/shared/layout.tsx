import { PropsWithChildren } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from './auth.store';

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
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        <div className="header-actions">
          {user ? (
            <>
              <span className="header-user-email">{user.email}</span>
              <button type="button" className="btn header-btn" onClick={handleLogout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn header-btn">
                Ingresar
              </NavLink>
              <NavLink to="/register" className="btn btn-primary header-btn">
                Registrarse
              </NavLink>
            </>
          )}
        </div>
      </header>

      {user && (
        <nav className="nav" aria-label="Navegación principal">
          <NavItem to="/pets" label="Adopción" />
          <NavItem to="/matching" label="Matching" />
          <NavItem to="/chat" label="Chat" />
          {user.role !== 'PARTNER' && (
            <NavItem to="/messages" label="Mensajes" />
          )}
          {user.role === 'PARTNER' && (
            <NavItem to="/partner/dashboard" label="Mi panel" />
          )}
        </nav>
      )}

      {children}
    </div>
  );
}
