import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Layout } from '../../shared/layout';
import api, { BACKEND_URL } from '../../shared/api';

// ─── Breed catalog per species ────────────────────────────────────────────────

const BREEDS: Record<string, string[]> = {
  DOG: [
    'Mestizo', 'Labrador Retriever', 'Golden Retriever', 'Bulldog Inglés',
    'Pastor Alemán', 'Poodle', 'Beagle', 'Chihuahua', 'Yorkshire Terrier',
    'Pomeranian', 'Rottweiler', 'Boxer', 'Dálmata', 'Shih Tzu',
    'Bichón Frisé', 'Cocker Spaniel', 'Husky Siberiano', 'Doberman',
    'Border Collie', 'Schnauzer', 'Pinscher', 'Maltés', 'Shar Pei',
  ],
  CAT: [
    'Mestizo', 'Persa', 'Siamés', 'Maine Coon', 'Bengalí', 'Ragdoll',
    'Esfinge', 'Angora Turco', 'Azul Ruso', 'Abisinio',
    'British Shorthair', 'Scottish Fold', 'Bombay',
  ],
  RABBIT: [
    'Mestizo', 'Mini Rex', 'Holland Lop', 'Belier Francés', 'Angora',
    'Californiano', 'Nueva Zelanda', 'Rex', 'Lionhead',
  ],
  BIRD: [
    'Canario', 'Periquito Australiano', 'Agaporni', 'Loro Amazona',
    'Cacatúa', 'Ninfa', 'Cotorra Alejandrina', 'Guacamayo',
  ],
  OTHER: [
    'Hámster Sirio', 'Hámster Enano', 'Cobayo', 'Chinchilla',
    'Tortuga', 'Iguana', 'Serpiente Maíz', 'Gecko Leopardo',
  ],
};

// ─── Thumbnail shared styles ──────────────────────────────────────────────────

const thumbStyle: React.CSSProperties = {
  position: 'relative',
  width: 96,
  height: 96,
  borderRadius: 8,
  overflow: 'hidden',
  flexShrink: 0,
  border: '2px solid var(--border)',
  background: '#000',
};

const thumbMediaStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const removeBtn: React.CSSProperties = {
  position: 'absolute',
  top: 3,
  right: 3,
  background: 'rgba(0,0,0,0.7)',
  color: '#fff',
  border: 'none',
  borderRadius: '50%',
  width: 22,
  height: 22,
  cursor: 'pointer',
  fontSize: 13,
  lineHeight: '22px',
  textAlign: 'center',
  padding: 0,
};

const principalBadge: React.CSSProperties = {
  position: 'absolute',
  bottom: 3,
  left: 3,
  background: 'var(--primary)',
  color: '#fff',
  fontSize: 9,
  fontWeight: 700,
  padding: '1px 5px',
  borderRadius: 4,
  textTransform: 'uppercase',
};

const addBtnStyle: React.CSSProperties = {
  width: 96,
  height: 96,
  borderRadius: 8,
  border: '2px dashed var(--border)',
  background: 'var(--surface)',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  gap: 4,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|avi)$/i.test(url);
}

function isVideoFile(file: File) {
  return file.type.startsWith('video/');
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PetFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    species: 'DOG',
    breed: '',
    ageMonths: '',
    size: '',
    healthNotes: '',
    city: '',
    status: 'AVAILABLE',
  });
  const [error, setError] = useState('');

  // Stored media (edit mode)
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  // Pending uploads (new files)
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);
  const [removingFile, setRemovingFile] = useState<string | null>(null);

  const { data: existing } = useQuery({
    queryKey: ['pet-edit', id],
    queryFn: async () => {
      const { data } = await api.get(`/pets/${id}`);
      return data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name ?? '',
        species: existing.species ?? 'DOG',
        breed: existing.breed ?? '',
        ageMonths: existing.ageMonths != null ? String(existing.ageMonths) : '',
        size: existing.size ?? '',
        healthNotes: existing.healthNotes ?? '',
        city: existing.city ?? '',
        status: existing.status ?? 'AVAILABLE',
      });
      setExistingImages(existing.images ?? []);
      setExistingVideos(existing.videos ?? []);
    }
  }, [existing]);

  // ── Media handlers ──────────────────────────────────────────────────────────

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => !isVideoFile(f));
    setNewImages((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const handleVideoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(isVideoFile);
    setNewVideos((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const handleRemoveExistingImage = async (url: string) => {
    const filename = url.split('/').pop()!;
    setRemovingFile(filename);
    try {
      await api.delete(`/pets/${id}/images/${filename}`);
      setExistingImages((prev) => prev.filter((u) => u !== url));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar la imagen');
    } finally {
      setRemovingFile(null);
    }
  };

  const handleRemoveExistingVideo = async (url: string) => {
    const filename = url.split('/').pop()!;
    setRemovingFile(filename);
    try {
      await api.delete(`/pets/${id}/videos/${filename}`);
      setExistingVideos((prev) => prev.filter((u) => u !== url));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el video');
    } finally {
      setRemovingFile(null);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name,
        species: form.species,
        breed: form.breed || undefined,
        ageMonths: form.ageMonths ? Number(form.ageMonths) : undefined,
        size: form.size || undefined,
        healthNotes: form.healthNotes || undefined,
        city: form.city || undefined,
      };

      let petId = id;
      if (isEdit) {
        payload.status = form.status;
        await api.patch(`/pets/${id}`, payload);
      } else {
        const { data } = await api.post('/pets', payload);
        petId = data.id;
      }

      if (newImages.length > 0) {
        const fd = new FormData();
        newImages.forEach((f) => fd.append('files', f));
        await api.post(`/pets/${petId}/images`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (newVideos.length > 0) {
        const fd = new FormData();
        newVideos.forEach((f) => fd.append('files', f));
        await api.post(`/pets/${petId}/videos`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    },
    onSuccess: () => navigate('/partner/dashboard'),
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error al guardar');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate();
  };

  const totalImages = existingImages.length + newImages.length;
  const totalVideos = existingVideos.length + newVideos.length;

  return (
    <Layout>
      <main className="main">
        <Link
          to="/partner/dashboard"
          style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'inline-block', marginBottom: '1rem' }}
        >
          ← Volver al dashboard
        </Link>

        <div className="card" style={{ maxWidth: 580, margin: '0 auto' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>
            {isEdit ? 'Editar animal' : 'Registrar animal en adopción'}
          </h2>

          {error && (
            <div className="badge badge-danger" style={{ marginBottom: '1rem', display: 'block' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* ── Nombre ── */}
            <label className="form-label">
              Nombre *
              <input
                className="form-input"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>

            {/* ── Especie ── */}
            <label className="form-label">
              Especie *
              <select
                className="form-input"
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value, breed: '' })}
              >
                <option value="DOG">Perro</option>
                <option value="CAT">Gato</option>
                <option value="RABBIT">Conejo</option>
                <option value="BIRD">Ave</option>
                <option value="OTHER">Otro</option>
              </select>
            </label>

            {/* ── Raza con sugerencias por especie ── */}
            <label className="form-label">
              Raza
              <input
                className="form-input"
                type="text"
                list={`breeds-${form.species}`}
                placeholder="Escribe o selecciona una raza..."
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
                autoComplete="off"
              />
              <datalist id={`breeds-${form.species}`}>
                {(BREEDS[form.species] ?? []).map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </label>

            {/* ── Edad / Tamaño ── */}
            <div className="grid two" style={{ gap: '0.75rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Edad (meses)
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  value={form.ageMonths}
                  onChange={(e) => setForm({ ...form, ageMonths: e.target.value })}
                />
              </label>
              <label className="form-label" style={{ margin: 0 }}>
                Tamaño
                <select
                  className="form-input"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                >
                  <option value="">Sin especificar</option>
                  <option value="SMALL">Pequeño</option>
                  <option value="MEDIUM">Mediano</option>
                  <option value="LARGE">Grande</option>
                </select>
              </label>
            </div>

            {/* ── Ciudad ── */}
            <label className="form-label">
              Ciudad
              <input
                className="form-input"
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ej: Bogotá"
              />
            </label>

            {/* ── Notas de salud ── */}
            <label className="form-label">
              Notas de salud
              <textarea
                className="form-input"
                rows={3}
                value={form.healthNotes}
                onChange={(e) => setForm({ ...form, healthNotes: e.target.value })}
                placeholder="Vacunas, esterilización, condiciones especiales..."
                style={{ resize: 'vertical' }}
              />
            </label>

            {/* ── Estado (solo edición) ── */}
            {isEdit && (
              <label className="form-label">
                Estado
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="AVAILABLE">Disponible</option>
                  <option value="IN_PROCESS">En proceso</option>
                  <option value="ADOPTED">Adoptado</option>
                  <option value="PAUSED">Pausado</option>
                </select>
              </label>
            )}

            {/* ── Fotos ── */}
            <div>
              <span className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Fotos{totalImages > 0 ? ` (${totalImages})` : ''}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.25rem 0' }}>

                {existingImages.map((url, i) => {
                  const filename = url.split('/').pop()!;
                  return (
                    <div key={url} style={{ ...thumbStyle, opacity: removingFile === filename ? 0.4 : 1 }}>
                      <img src={`${BACKEND_URL}${url}`} alt={`foto-${i + 1}`} style={thumbMediaStyle} />
                      {i === 0 && <span style={principalBadge}>principal</span>}
                      <button
                        type="button"
                        style={removeBtn}
                        disabled={removingFile === filename}
                        onClick={() => handleRemoveExistingImage(url)}
                        title="Eliminar foto"
                      >×</button>
                    </div>
                  );
                })}

                {newImages.map((file, i) => (
                  <div key={`ni-${i}`} style={thumbStyle}>
                    <img src={URL.createObjectURL(file)} alt={`nueva-${i}`} style={thumbMediaStyle} />
                    {existingImages.length === 0 && i === 0 && <span style={principalBadge}>principal</span>}
                    <button
                      type="button"
                      style={removeBtn}
                      onClick={() => setNewImages((prev) => prev.filter((_, idx) => idx !== i))}
                      title="Quitar foto"
                    >×</button>
                  </div>
                ))}

                {totalImages < 10 && (
                  <button
                    type="button"
                    style={addBtnStyle}
                    onClick={() => imageInputRef.current?.click()}
                    title="Agregar fotos"
                  >
                    <span style={{ fontSize: 24 }}>+</span>
                    <span style={{ fontSize: 10 }}>foto</span>
                  </button>
                )}
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: 'none' }}
                onChange={handleImagePick}
              />
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                JPG, PNG o WebP · máx. 5 MB · hasta 10 fotos
              </p>
            </div>

            {/* ── Videos ── */}
            <div>
              <span className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Videos{totalVideos > 0 ? ` (${totalVideos})` : ''}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.25rem 0' }}>

                {existingVideos.map((url, i) => {
                  const filename = url.split('/').pop()!;
                  return (
                    <div key={url} style={{ ...thumbStyle, opacity: removingFile === filename ? 0.4 : 1 }}>
                      <video src={`${BACKEND_URL}${url}`} style={thumbMediaStyle} muted />
                      {i === 0 && <span style={{ ...principalBadge, background: 'var(--primary-2, #7c3aed)' }}>principal</span>}
                      <button
                        type="button"
                        style={removeBtn}
                        disabled={removingFile === filename}
                        onClick={() => handleRemoveExistingVideo(url)}
                        title="Eliminar video"
                      >×</button>
                    </div>
                  );
                })}

                {newVideos.map((file, i) => (
                  <div key={`nv-${i}`} style={thumbStyle}>
                    <video src={URL.createObjectURL(file)} style={thumbMediaStyle} muted />
                    {existingVideos.length === 0 && i === 0 && (
                      <span style={{ ...principalBadge, background: 'var(--primary-2, #7c3aed)' }}>principal</span>
                    )}
                    <button
                      type="button"
                      style={removeBtn}
                      onClick={() => setNewVideos((prev) => prev.filter((_, idx) => idx !== i))}
                      title="Quitar video"
                    >×</button>
                  </div>
                ))}

                {totalVideos < 5 && (
                  <button
                    type="button"
                    style={addBtnStyle}
                    onClick={() => videoInputRef.current?.click()}
                    title="Agregar video"
                  >
                    <span style={{ fontSize: 24 }}>▶</span>
                    <span style={{ fontSize: 10 }}>video</span>
                  </button>
                )}
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                multiple
                style={{ display: 'none' }}
                onChange={handleVideoPick}
              />
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                MP4, WebM o MOV · máx. 100 MB · hasta 5 videos
              </p>
            </div>

            {/* ── Acciones ── */}
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
              <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar animal'}
              </button>
              <Link to="/partner/dashboard" className="btn">Cancelar</Link>
            </div>
          </form>
        </div>
      </main>
    </Layout>
  );
}
