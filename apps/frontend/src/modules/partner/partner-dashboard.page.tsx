import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Layout } from '../../shared/layout';
import api from '../../shared/api';
import { useAuthStore } from '../../shared/auth.store';

const SPECIES_LABELS: Record<string, string> = {
  DOG: 'Perro', CAT: 'Gato', RABBIT: 'Conejo', BIRD: 'Ave', OTHER: 'Otro',
};
const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible', IN_PROCESS: 'En proceso', ADOPTED: 'Adoptado', PAUSED: 'Pausado',
};

interface InboxItem {
  userId: string;
  userEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  body: string;
  createdAt: string;
  status: string;
  sender: { id: string; email: string };
}

type Tab = 'pets' | 'profile' | 'messages';

export function PartnerDashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('pets');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ['my-pets'],
    queryFn: async () => {
      const { data } = await api.get('/pets/my');
      return data;
    },
    enabled: tab === 'pets',
  });

  const { data: profile } = useQuery({
    queryKey: ['partner-profile'],
    queryFn: async () => {
      const { data } = await api.get('/partners/me');
      return data;
    },
    enabled: tab === 'profile',
  });

  const { data: inbox = [], isLoading: msgsLoading } = useQuery<InboxItem[]>({
    queryKey: ['partner-inbox'],
    queryFn: async () => {
      const { data } = await api.get('/messages/partner-inbox');
      return data;
    },
    enabled: tab === 'messages',
  });

  const { data: thread = [] } = useQuery<Message[]>({
    queryKey: ['partner-thread', selectedUserId],
    queryFn: async () => {
      const { data } = await api.get(`/messages/partner-thread/${selectedUserId}`);
      return data;
    },
    enabled: !!selectedUserId,
    refetchInterval: 10_000,
  });

  const replyMutation = useMutation({
    mutationFn: async (body: string) => {
      await api.post('/messages/partner-reply', { receiverId: selectedUserId, body });
    },
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['partner-thread', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['partner-inbox'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (petId: string) => {
      await api.delete(`/pets/${petId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-pets'] }),
  });

  const handleDelete = (petId: string, name: string) => {
    if (confirm(`¿Eliminar a ${name} del listado?`)) {
      deleteMutation.mutate(petId);
    }
  };

  const selectedInbox = inbox.find((i) => i.userId === selectedUserId);

  return (
    <Layout>
      <main className="main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Panel de veterinaria</h2>
          {tab === 'pets' && (
            <Link to="/partner/pets/new" className="btn btn-primary">+ Agregar animal</Link>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {(['pets', 'messages', 'profile'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`btn ${tab === t ? 'btn-primary' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'pets' ? 'Mis animales' : t === 'messages' ? 'Mensajes' : 'Mi perfil'}
            </button>
          ))}
        </div>

        {/* Pestaña: Animales */}
        {tab === 'pets' && (
          <>
            {petsLoading && <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>}
            {!petsLoading && pets.length === 0 && (
              <div className="card" style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Aún no has registrado animales en adopción.
                </p>
                <Link to="/partner/pets/new" className="btn btn-primary">Agregar primer animal</Link>
              </div>
            )}
            <div className="list">
              {pets.map((pet: any) => (
                <div key={pet.id} className="list-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <strong>{pet.name}</strong>
                      <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {SPECIES_LABELS[pet.species] || pet.species}
                        {pet.breed ? ` • ${pet.breed}` : ''}
                        {pet.city ? ` • ${pet.city}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="badge">{STATUS_LABELS[pet.status] || pet.status}</span>
                      <Link to={`/partner/pets/${pet.id}/edit`} className="btn">Editar</Link>
                      <button
                        className="btn"
                        style={{ color: 'var(--primary)' }}
                        onClick={() => handleDelete(pet.id, pet.name)}
                        disabled={deleteMutation.isPending}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pestaña: Mensajes */}
        {tab === 'messages' && (
          <div style={{ display: 'grid', gridTemplateColumns: selectedUserId ? '280px 1fr' : '1fr', gap: '1rem', alignItems: 'start' }}>
            {/* Lista de conversaciones */}
            <div>
              {msgsLoading && <p style={{ color: 'var(--text-muted)' }}>Cargando mensajes...</p>}
              {!msgsLoading && inbox.length === 0 && (
                <div className="card">
                  <p style={{ color: 'var(--text-muted)' }}>No has recibido mensajes aún.</p>
                </div>
              )}
              <div className="list">
                {inbox.map((conv) => (
                  <div
                    key={conv.userId}
                    className="list-item"
                    style={{
                      cursor: 'pointer',
                      borderLeft: selectedUserId === conv.userId ? '3px solid var(--primary)' : '3px solid transparent',
                    }}
                    onClick={() => setSelectedUserId(conv.userId)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.userEmail}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.lastMessage}
                        </p>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        {conv.unreadCount > 0 && (
                          <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                            {conv.unreadCount}
                          </span>
                        )}
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(conv.lastMessageAt).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hilo de conversación */}
            {selectedUserId && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>
                  Conversación con {selectedInbox?.userEmail}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                  {thread.map((msg) => {
                    const isOwn = msg.sender.id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isOwn ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '75%',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.75rem',
                            backgroundColor: isOwn ? 'var(--primary)' : 'var(--surface-raised)',
                            color: isOwn ? '#fff' : 'var(--text)',
                            fontSize: '0.875rem',
                          }}
                        >
                          {msg.body}
                        </div>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(msg.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          {' · '}
                          {new Date(msg.createdAt).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Input de respuesta */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Escribe tu respuesta..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && replyText.trim()) {
                        e.preventDefault();
                        replyMutation.mutate(replyText.trim());
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!replyText.trim() || replyMutation.isPending}
                    onClick={() => replyMutation.mutate(replyText.trim())}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pestaña: Perfil */}
        {tab === 'profile' && profile && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>{profile.legalName}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Tipo:</span> {profile.type}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>NIT:</span> {profile.taxId}</div>
              {profile.phone && <div><span style={{ color: 'var(--text-muted)' }}>Tel:</span> {profile.phone}</div>}
              {profile.email && <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> {profile.email}</div>}
              {profile.address && <div><span style={{ color: 'var(--text-muted)' }}>Dir:</span> {profile.address}</div>}
              {profile.city && <div><span style={{ color: 'var(--text-muted)' }}>Ciudad:</span> {profile.city}</div>}
              {profile.description && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Descripción</p>
                  <p style={{ margin: 0 }}>{profile.description}</p>
                </div>
              )}
            </div>
            <div style={{ marginTop: '1rem' }}>
              <span
                className="badge"
                style={{
                  backgroundColor: profile.verificationStatus === 'VERIFIED' ? 'var(--success)' : undefined,
                  color: profile.verificationStatus === 'VERIFIED' ? '#000' : undefined,
                }}
              >
                {profile.verificationStatus === 'VERIFIED' ? 'Verificado'
                  : profile.verificationStatus === 'REJECTED' ? 'Rechazado' : 'Pendiente verificación'}
              </span>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
