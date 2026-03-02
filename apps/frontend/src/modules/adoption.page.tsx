import { Layout } from '../shared/layout';

const pets = [
  { name: 'Milo', detail: 'Perro · 2 años · Vacunado', status: 'screening' },
  { name: 'Nina', detail: 'Gata · 1 año · Esterilizada', status: 'interview' },
  { name: 'Toby', detail: 'Perro · 4 años · Energía media', status: 'approved' },
];

export function AdoptionPage() {
  return (
    <Layout>
      <section className="grid two">
        <article className="card">
          <h2>Adopción responsable</h2>
          <p className="muted">
            Explora mascotas de refugios y veterinarias aliadas. Cada solicitud sigue un flujo
            auditable para proteger a la mascota y al adoptante.
          </p>
          <ul className="list">
            {pets.map((pet) => (
              <li key={pet.name} className="list-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <b>{pet.name}</b>
                  <span className="muted">{pet.status}</span>
                </div>
                <div className="muted">{pet.detail}</div>
              </li>
            ))}
          </ul>
          <div className="actions">
            <button className="btn btn-primary">Ver mascotas</button>
            <button className="btn btn-ghost">Mis solicitudes</button>
          </div>
        </article>

        <aside className="card">
          <h2>Pipeline partner</h2>
          <div className="kpis">
            <div className="kpi">
              <span className="muted">Submitted</span>
              <b>14</b>
            </div>
            <div className="kpi">
              <span className="muted">Screening</span>
              <b>6</b>
            </div>
            <div className="kpi">
              <span className="muted">Approved</span>
              <b>3</b>
            </div>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Estados recomendados: draft → submitted → screening → interview/visit → approved/rejected → contract → delivered → closed.
          </p>
        </aside>
      </section>
    </Layout>
  );
}
