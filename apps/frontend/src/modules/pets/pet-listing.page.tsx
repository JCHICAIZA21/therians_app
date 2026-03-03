import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Layout } from '../../shared/layout';
import api, { BACKEND_URL } from '../../shared/api';

const SPECIES_LABELS: Record<string, string> = {
  DOG: 'Perro', CAT: 'Gato', RABBIT: 'Conejo', BIRD: 'Ave', OTHER: 'Otro',
};
const SIZE_LABELS: Record<string, string> = {
  SMALL: 'Pequeño', MEDIUM: 'Mediano', LARGE: 'Grande',
};

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  ageMonths?: number;
  size?: string;
  healthNotes?: string;
  city?: string;
  images?: string[];
  createdAt: string;
  partner: { id: string; legalName: string; city?: string };
}

export function PetListingPage() {
  const [filters, setFilters] = useState({ species: '', city: '', size: '' });
  const [applied, setApplied] = useState({ species: '', city: '', size: '' });

  const { data: pets = [], isLoading } = useQuery<Pet[]>({
    queryKey: ['pets', applied],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (applied.species) params.set('species', applied.species);
      if (applied.city) params.set('city', applied.city);
      if (applied.size) params.set('size', applied.size);
      const { data } = await api.get(`/pets?${params}`);
      return data;
    },
  });

  const applyFilters = () => setApplied({ ...filters });
  const clearFilters = () => {
    setFilters({ species: '', city: '', size: '' });
    setApplied({ species: '', city: '', size: '' });
  };

  return (
    <Layout>
      <main className="main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Animales en adopción</h2>
        </div>

        {/* Filtros */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="grid two" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
            <label className="form-label" style={{ margin: 0 }}>
              Especie
              <select
                className="form-input"
                value={filters.species}
                onChange={(e) => setFilters({ ...filters, species: e.target.value })}
              >
                <option value="">Todas</option>
                <option value="DOG">Perro</option>
                <option value="CAT">Gato</option>
                <option value="RABBIT">Conejo</option>
                <option value="BIRD">Ave</option>
                <option value="OTHER">Otro</option>
              </select>
            </label>
            <label className="form-label" style={{ margin: 0 }}>
              Tamaño
              <select
                className="form-input"
                value={filters.size}
                onChange={(e) => setFilters({ ...filters, size: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="SMALL">Pequeño</option>
                <option value="MEDIUM">Mediano</option>
                <option value="LARGE">Grande</option>
              </select>
            </label>
          </div>
          <label className="form-label" style={{ margin: '0 0 0.75rem' }}>
            Ciudad
            <input
              className="form-input"
              type="text"
              placeholder="Ej: Bogotá"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            />
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={applyFilters}>Filtrar</button>
            <button className="btn" onClick={clearFilters}>Limpiar</button>
          </div>
        </div>

        {isLoading && <p style={{ color: 'var(--text-muted)' }}>Cargando animales...</p>}

        {!isLoading && pets.length === 0 && (
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No hay animales disponibles con estos filtros.</p>
          </div>
        )}

        <div className="list">
          {pets.map((pet) => (
            <Link
              key={pet.id}
              to={`/pets/${pet.id}`}
              className="list-item"
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {pet.images?.[0] ? (
                  <img
                    src={`${BACKEND_URL}${pet.images[0]}`}
                    alt={pet.name}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 8,
                      objectFit: 'cover',
                      flexShrink: 0,
                      border: '1px solid var(--border)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 8,
                      background: 'var(--surface-raised)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      border: '1px solid var(--border)',
                    }}
                  >
                    {pet.species === 'DOG' ? '🐶' : pet.species === 'CAT' ? '🐱' : pet.species === 'RABBIT' ? '🐰' : pet.species === 'BIRD' ? '🐦' : '🐾'}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: '1rem' }}>{pet.name}</strong>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {SPECIES_LABELS[pet.species] || pet.species}
                    {pet.breed ? ` • ${pet.breed}` : ''}
                    {pet.ageMonths != null ? ` • ${Math.floor(pet.ageMonths / 12)}a ${pet.ageMonths % 12}m` : ''}
                    {pet.size ? ` • ${SIZE_LABELS[pet.size] || pet.size}` : ''}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    {pet.partner.legalName}{pet.city ? ` — ${pet.city}` : ''}
                  </p>
                </div>
                <span className="badge" style={{ flexShrink: 0 }}>Ver</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </Layout>
  );
}
