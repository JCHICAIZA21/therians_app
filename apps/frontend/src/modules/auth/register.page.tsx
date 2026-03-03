import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '../../shared/layout';
import { useAuthStore } from '../../shared/auth.store';
import api from '../../shared/api';

type RoleType = 'USER' | 'PARTNER';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [role, setRole] = useState<RoleType>('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [userForm, setUserForm] = useState({ email: '', password: '', phone: '' });
  const [partnerForm, setPartnerForm] = useState({
    type: 'VETERINARY',
    legalName: '',
    taxId: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: any = { ...userForm, role };
      if (role === 'PARTNER') payload.partner = partnerForm;
      const { data } = await api.post('/auth/register', payload);
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate(role === 'PARTNER' ? '/partner/dashboard' : '/pets');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <main className="main">
        <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ marginBottom: '1rem' }}>Crear cuenta</h2>

          {/* Selector de tipo */}
          <div className="grid two" style={{ marginBottom: '1.5rem', gap: '0.75rem' }}>
            <button
              type="button"
              className={`btn ${role === 'USER' ? 'btn-primary' : ''}`}
              onClick={() => setRole('USER')}
            >
              Soy usuario
            </button>
            <button
              type="button"
              className={`btn ${role === 'PARTNER' ? 'btn-primary' : ''}`}
              onClick={() => setRole('PARTNER')}
            >
              Soy veterinaria
            </button>
          </div>

          {error && (
            <div className="badge badge-danger" style={{ marginBottom: '1rem', display: 'block' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label className="form-label">
              Correo electrónico *
              <input
                className="form-input"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                required
              />
            </label>
            <label className="form-label">
              Contraseña * (mín. 8 caracteres)
              <input
                className="form-input"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                required
                minLength={8}
              />
            </label>
            <label className="form-label">
              Teléfono
              <input
                className="form-input"
                type="tel"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
              />
            </label>

            {role === 'PARTNER' && (
              <>
                <hr style={{ borderColor: 'var(--border)', margin: '0.5rem 0' }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                  Datos de la empresa
                </p>

                <label className="form-label">
                  Tipo de organización *
                  <select
                    className="form-input"
                    value={partnerForm.type}
                    onChange={(e) => setPartnerForm({ ...partnerForm, type: e.target.value })}
                  >
                    <option value="VETERINARY">Veterinaria</option>
                    <option value="SHELTER">Albergue / Refugio</option>
                    <option value="RESCUE">Rescatista</option>
                  </select>
                </label>
                <label className="form-label">
                  Razón social / Nombre legal *
                  <input
                    className="form-input"
                    type="text"
                    value={partnerForm.legalName}
                    onChange={(e) => setPartnerForm({ ...partnerForm, legalName: e.target.value })}
                    required
                    minLength={3}
                  />
                </label>
                <label className="form-label">
                  NIT / RUT *
                  <input
                    className="form-input"
                    type="text"
                    value={partnerForm.taxId}
                    onChange={(e) => setPartnerForm({ ...partnerForm, taxId: e.target.value })}
                    required
                  />
                </label>
                <label className="form-label">
                  Teléfono de contacto
                  <input
                    className="form-input"
                    type="tel"
                    value={partnerForm.phone}
                    onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                  />
                </label>
                <label className="form-label">
                  Correo de contacto público
                  <input
                    className="form-input"
                    type="email"
                    value={partnerForm.email}
                    onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                  />
                </label>
                <label className="form-label">
                  Dirección
                  <input
                    className="form-input"
                    type="text"
                    value={partnerForm.address}
                    onChange={(e) => setPartnerForm({ ...partnerForm, address: e.target.value })}
                  />
                </label>
                <label className="form-label">
                  Ciudad
                  <input
                    className="form-input"
                    type="text"
                    value={partnerForm.city}
                    onChange={(e) => setPartnerForm({ ...partnerForm, city: e.target.value })}
                  />
                </label>
                <label className="form-label">
                  Descripción
                  <textarea
                    className="form-input"
                    rows={3}
                    value={partnerForm.description}
                    onChange={(e) => setPartnerForm({ ...partnerForm, description: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                </label>
              </>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: 'var(--primary)' }}>
              Iniciar sesión
            </Link>
          </p>
        </div>
      </main>
    </Layout>
  );
}
