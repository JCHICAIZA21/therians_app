import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '../../shared/layout';
import { useAuthStore } from '../../shared/auth.store';
import api from '../../shared/api';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.user, data.accessToken, data.refreshToken);
      if (data.user.role === 'PARTNER') {
        navigate('/partner/dashboard');
      } else {
        navigate('/pets');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <main className="main">
        <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Iniciar sesión</h2>
          {error && (
            <div className="badge badge-danger" style={{ marginBottom: '1rem', display: 'block' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label className="form-label">
              Correo electrónico
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </label>
            <label className="form-label">
              Contraseña
              <input
                className="form-input"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
          <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: 'var(--primary)' }}>
              Regístrate
            </Link>
          </p>
        </div>
      </main>
    </Layout>
  );
}
