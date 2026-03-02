import { Layout } from '../shared/layout';

const conversations = [
  { name: 'Luna-Fox', preview: '¿Te gustaría hablar mañana?', time: '09:24', unread: true },
  { name: 'Kiro-Wolf', preview: 'Gracias por compartir tu historia ✨', time: 'Ayer', unread: false },
  { name: 'Nova-Cat', preview: 'Vi tu perfil de adopción, está genial.', time: 'Ayer', unread: false },
];

export function ChatPage() {
  return (
    <Layout>
      <section className="grid two">
        <article className="card">
          <h2>Conversaciones</h2>
          <p className="muted">Mensajería en tiempo real habilitada solo con match activo.</p>
          <ul className="list">
            {conversations.map((item) => (
              <li className="list-item" key={item.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <b>{item.name}</b>
                  <span className="muted">{item.time}</span>
                </div>
                <div className="muted">{item.preview}</div>
                {item.unread ? <span className="status warn">Nuevo</span> : null}
              </li>
            ))}
          </ul>
        </article>

        <aside className="card">
          <h2>Buenas prácticas</h2>
          <ul className="list">
            <li className="list-item">No compartas datos personales sensibles.</li>
            <li className="list-item">Usa reportar/bloquear ante comportamiento abusivo.</li>
            <li className="list-item">Se aplican límites de frecuencia para prevenir spam.</li>
          </ul>
          <div className="actions">
            <button className="btn btn-ghost">Centro de ayuda</button>
          </div>
        </aside>
      </section>
    </Layout>
  );
}
