import { Layout } from '../shared/layout';

const candidates = [
  { alias: 'Luna-Fox', distance: '3.2 km', vibe: 'Nocturna · Arte · Caminatas' },
  { alias: 'Kiro-Wolf', distance: '7.8 km', vibe: 'Gaming · Naturaleza · Café' },
  { alias: 'Nova-Cat', distance: '12 km', vibe: 'Lectura · Música · Activismo animal' },
];

export function MatchingPage() {
  return (
    <Layout>
      <section className="grid two">
        <article className="card">
          <h2>Descubre perfiles afines</h2>
          <p className="muted">Ajusta tus filtros y desliza con intención. Las coincidencias son mutuas.</p>
          <div className="actions">
            <button className="btn btn-ghost">Distancia: 25 km</button>
            <button className="btn btn-ghost">Edad: 18–34</button>
            <button className="btn btn-ghost">Intereses: 4</button>
          </div>
          <ul className="list" style={{ marginTop: 14 }}>
            {candidates.map((c) => (
              <li className="list-item" key={c.alias}>
                <b>{c.alias}</b>
                <div className="muted">{c.vibe}</div>
                <div className="muted">📍 {c.distance}</div>
              </li>
            ))}
          </ul>
        </article>

        <aside className="card">
          <h2>Seguridad activa</h2>
          <ul className="list">
            <li className="list-item">Bloqueo y reporte visibles en cada interacción.</li>
            <li className="list-item">Rate limits y anti-spam para proteger conversaciones.</li>
            <li className="list-item">Ubicación aproximada por defecto para mayor privacidad.</li>
          </ul>
          <div className="actions">
            <button className="btn btn-primary">Empezar a deslizar</button>
          </div>
        </aside>
      </section>
    </Layout>
  );
}
