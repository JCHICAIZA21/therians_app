import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Layout } from '../../shared/layout';
import { useAuthStore } from '../../shared/auth.store';
import api, { BACKEND_URL } from '../../shared/api';

const SPECIES_LABELS: Record<string, string> = {
  DOG: 'Perro', CAT: 'Gato', RABBIT: 'Conejo', BIRD: 'Ave', OTHER: 'Otro',
};
const SIZE_LABELS: Record<string, string> = {
  SMALL: 'Pequeño', MEDIUM: 'Mediano', LARGE: 'Grande',
};

export function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [msgSent, setMsgSent] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [activeImg, setActiveImg] = useState(0);

  const { data: pet, isLoading } = useQuery({
    queryKey: ['pet', id],
    queryFn: async () => {
      const { data } = await api.get(`/pets/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      await api.post('/messages', { partnerId: pet.partner.id, body });
    },
    onSuccess: () => {
      setMsgSent(true);
      setMessage('');
    },
    onError: (err: any) => {
      setMsgError(err.response?.data?.message || 'Error al enviar el mensaje');
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
  };

  if (isLoading) {
    return (
      <Layout>
        <main className="main">
          <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
        </main>
      </Layout>
    );
  }

  if (!pet) {
    return (
      <Layout>
        <main className="main">
          <p style={{ color: 'var(--text-muted)' }}>Animal no encontrado.</p>
          <Link to="/pets" className="btn">Volver al listado</Link>
        </main>
      </Layout>
    );
  }

  const images: string[] = pet.images ?? [];
  const videos: string[] = pet.videos ?? [];

  return (
    <Layout>
      <main className="main">
        <Link
          to="/pets"
          style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'inline-block', marginBottom: '1rem' }}
        >
          ← Volver al listado
        </Link>

        {/* ── Galería de fotos ── */}
        {images.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div
              style={{
                width: '100%',
                height: 300,
                borderRadius: 12,
                overflow: 'hidden',
                background: 'var(--surface)',
                marginBottom: '0.5rem',
              }}
            >
              <img
                src={`${BACKEND_URL}${images[activeImg]}`}
                alt={pet.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {images.map((url: string, i: number) => (
                  <button
                    key={url}
                    onClick={() => setActiveImg(i)}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: `2px solid ${i === activeImg ? 'var(--primary)' : 'var(--border)'}`,
                      padding: 0,
                      cursor: 'pointer',
                      flexShrink: 0,
                      background: 'var(--surface)',
                    }}
                  >
                    <img
                      src={`${BACKEND_URL}${url}`}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Info del animal ── */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ margin: 0 }}>{pet.name}</h2>
            <span className="badge" style={{ backgroundColor: 'var(--success)', color: '#000' }}>
              {pet.status === 'AVAILABLE' ? 'Disponible' : pet.status}
            </span>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span className="badge">{SPECIES_LABELS[pet.species] || pet.species}</span>
            {pet.breed && <span className="badge">{pet.breed}</span>}
            {pet.size && <span className="badge">{SIZE_LABELS[pet.size] || pet.size}</span>}
            {pet.ageMonths != null && (
              <span className="badge">
                {Math.floor(pet.ageMonths / 12)}a {pet.ageMonths % 12}m
              </span>
            )}
            {pet.city && <span className="badge">{pet.city}</span>}
          </div>

          {pet.healthNotes && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Notas de salud
              </p>
              <p style={{ margin: 0 }}>{pet.healthNotes}</p>
            </div>
          )}
        </div>

        {/* ── Videos ── */}
        {videos.length > 0 && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>
              Videos ({videos.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {videos.map((url: string) => (
                <video
                  key={url}
                  src={`${BACKEND_URL}${url}`}
                  controls
                  style={{
                    width: '100%',
                    borderRadius: 8,
                    maxHeight: 340,
                    background: '#000',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Datos de la veterinaria ── */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Veterinaria responsable</h3>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>{pet.partner.legalName}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem' }}>
            {pet.partner.phone && (
              <span style={{ color: 'var(--text-muted)' }}>
                Tel: <a href={`tel:${pet.partner.phone}`} style={{ color: 'var(--primary)' }}>{pet.partner.phone}</a>
              </span>
            )}
            {pet.partner.email && (
              <span style={{ color: 'var(--text-muted)' }}>
                Email: <a href={`mailto:${pet.partner.email}`} style={{ color: 'var(--primary)' }}>{pet.partner.email}</a>
              </span>
            )}
            {pet.partner.address && (
              <span style={{ color: 'var(--text-muted)' }}>Dir: {pet.partner.address}</span>
            )}
            {pet.partner.city && (
              <span style={{ color: 'var(--text-muted)' }}>Ciudad: {pet.partner.city}</span>
            )}
            {pet.partner.website && (
              <span style={{ color: 'var(--text-muted)' }}>
                Web:{' '}
                <a href={pet.partner.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                  {pet.partner.website}
                </a>
              </span>
            )}
          </div>
          {pet.partner.description && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {pet.partner.description}
            </p>
          )}
        </div>

        {/* ── Enviar mensaje ── */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Contactar a la veterinaria</h3>

          {msgSent ? (
            <div>
              <p style={{ color: 'var(--success)' }}>Mensaje enviado correctamente.</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn" onClick={() => setMsgSent(false)}>Enviar otro</button>
                <Link to="/messages" className="btn btn-primary">Ver mis mensajes</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!user && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                  Debes{' '}
                  <Link to="/login" style={{ color: 'var(--primary)' }}>iniciar sesión</Link>{' '}
                  para enviar un mensaje.
                </p>
              )}
              {msgError && (
                <p style={{ color: 'var(--danger, #ff4d67)', fontSize: '0.875rem', margin: 0 }}>{msgError}</p>
              )}
              <label className="form-label" style={{ margin: 0 }}>
                Mensaje
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder={`Hola, me interesa adoptar a ${pet.name}. ¿Cuáles son los requisitos?`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!user}
                  style={{ resize: 'vertical' }}
                />
              </label>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={!user || sendMutation.isPending || !message.trim()}
              >
                {sendMutation.isPending ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </form>
          )}
        </div>
      </main>
    </Layout>
  );
}
