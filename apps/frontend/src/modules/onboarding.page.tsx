import { Layout } from '../shared/layout';

export function OnboardingPage() {
  return (
    <Layout>
      <section className="grid two">
        <article className="card">
          <h2>Bienvenida personalizada</h2>
          <p className="muted">
            Configura tu perfil therian, define tus límites y preferencias, y controla qué
            información quieres mostrar.
          </p>
          <ul className="list">
            <li className="list-item">✅ Validación de edad (18+) y consentimiento explícito.</li>
            <li className="list-item">✅ Fotos con revisión automática y cola de moderación.</li>
            <li className="list-item">✅ Preferencias de matching por distancia e intereses.</li>
          </ul>
          <div className="actions">
            <button className="btn btn-primary">Crear cuenta</button>
            <button className="btn btn-ghost">Ver política de privacidad</button>
          </div>
        </article>

        <aside className="card">
          <h2>Checklist de onboarding</h2>
          <div className="kpis">
            <div className="kpi">
              <span className="muted">Progreso</span>
              <b>35%</b>
            </div>
            <div className="kpi">
              <span className="muted">Fotos</span>
              <b>2/6</b>
            </div>
            <div className="kpi">
              <span className="muted">Verificación</span>
              <b>Base</b>
            </div>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Completa el perfil para mejorar la calidad del match y reducir interacciones no deseadas.
          </p>
        </aside>
      </section>
    </Layout>
  );
}
