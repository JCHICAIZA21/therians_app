import { Layout } from '../shared/layout';

const cards = [
  {
    alias: 'Luna-Fox',
    age: 25,
    distance: '3 km',
    vibe: 'Nocturna · Arte · Senderismo',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  },
  {
    alias: 'Kiro-Wolf',
    age: 27,
    distance: '8 km',
    vibe: 'Gaming · Café · Naturaleza',
    image:
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80',
  },
  {
    alias: 'Nova-Cat',
    age: 24,
    distance: '12 km',
    vibe: 'Música · Lectura · Activismo animal',
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
  },
];

export function MatchingPage() {
  const [top, second, third] = cards;

  return (
    <Layout>
      <section className="tinder-wrap">
        <div className="tinder-stack">
          <div className="swipe-card card back-2" style={{ backgroundImage: `url(${third.image})` }} />
          <div className="swipe-card card back-1" style={{ backgroundImage: `url(${second.image})` }} />
          <article className="swipe-card" style={{ backgroundImage: `url(${top.image})` }}>
            <div className="meta">
              <h2>
                {top.alias}, {top.age}
              </h2>
              <p>{top.vibe}</p>
              <p>📍 {top.distance}</p>
            </div>
          </article>
        </div>
      </section>

      <div className="actions-row" aria-label="Acciones de swipe">
        <button className="circle-btn" title="Nope" aria-label="Nope">
          ✕
        </button>
        <button className="circle-btn primary" title="Like" aria-label="Like">
          ❤
        </button>
        <button className="circle-btn" title="Super like" aria-label="Super like">
          ★
        </button>
      </div>

      <section className="bottom-sheet">
        <div className="card">
          <h3 style={{ margin: '0 0 8px' }}>Filtros rápidos</h3>
          <div className="actions">
            <button className="btn">Distancia: 25 km</button>
            <button className="btn">Edad: 18–34</button>
            <button className="btn">Intereses</button>
            <button className="btn btn-primary">Aplicar</button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: '0 0 8px' }}>Trust & Safety</h3>
          <ul className="list">
            <li className="list-item">Reportar y bloquear accesible desde cada perfil.</li>
            <li className="list-item">Ubicación aproximada por defecto para mayor privacidad.</li>
          </ul>
        </div>
      </section>
    </Layout>
  );
}
