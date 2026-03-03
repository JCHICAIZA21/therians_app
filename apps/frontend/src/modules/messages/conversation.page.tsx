import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../../shared/layout';
import api from '../../shared/api';

interface InboxItem {
  partnerId: string;
  partnerName: string;
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

export function ConversationPage() {
  const queryClient = useQueryClient();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: inbox = [], isLoading } = useQuery<InboxItem[]>({
    queryKey: ['inbox'],
    queryFn: async () => {
      const { data } = await api.get('/messages/inbox');
      return data;
    },
  });

  const { data: thread = [] } = useQuery<Message[]>({
    queryKey: ['thread', selectedPartnerId],
    queryFn: async () => {
      const { data } = await api.get(`/messages/conversation/${selectedPartnerId}`);
      return data;
    },
    enabled: !!selectedPartnerId,
    refetchInterval: 10_000,
  });

  const replyMutation = useMutation({
    mutationFn: async (body: string) => {
      await api.post('/messages', { partnerId: selectedPartnerId, body });
    },
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['thread', selectedPartnerId] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });

  const selectedInbox = inbox.find((i) => i.partnerId === selectedPartnerId);

  return (
    <Layout>
      <main className="main">
        <h2 style={{ marginBottom: '1rem' }}>Mis mensajes</h2>

        {isLoading && <p style={{ color: 'var(--text-muted)' }}>Cargando conversaciones...</p>}
        {!isLoading && inbox.length === 0 && (
          <div className="card">
            <p style={{ color: 'var(--text-muted)' }}>
              No tienes conversaciones aún. Encuentra un animal en adopción y contacta a la veterinaria.
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: selectedPartnerId ? '1fr 2fr' : '1fr', gap: '1rem' }}>
          {/* Lista de conversaciones */}
          <div className="list">
            {inbox.map((item) => (
              <button
                key={item.partnerId}
                className="list-item"
                onClick={() => setSelectedPartnerId(item.partnerId)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: selectedPartnerId === item.partnerId ? 'var(--surface-raised, #2a3444)' : undefined,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>{item.partnerName}</p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.lastMessage}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: '0.75rem', textAlign: 'right' }}>
                    {item.unreadCount > 0 && (
                      <span className="badge" style={{ backgroundColor: 'var(--primary)', color: '#fff' }}>
                        {item.unreadCount}
                      </span>
                    )}
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(item.lastMessageAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Hilo de mensajes */}
          {selectedPartnerId && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ margin: '0 0 0.5rem' }}>{selectedInbox?.partnerName}</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 400, overflowY: 'auto' }}>
                {thread.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 8,
                      backgroundColor: 'var(--surface)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <p style={{ margin: '0 0 0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {msg.sender.email} · {new Date(msg.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p style={{ margin: 0 }}>{msg.body}</p>
                  </div>
                ))}
                {thread.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin mensajes en este hilo.</p>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (replyText.trim()) replyMutation.mutate(replyText.trim());
                }}
                style={{ display: 'flex', gap: '0.5rem' }}
              >
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  type="text"
                  placeholder="Escribe una respuesta..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={replyMutation.isPending || !replyText.trim()}
                >
                  Enviar
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
