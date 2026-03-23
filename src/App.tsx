const checks = [
  'Electron main process wired',
  'React renderer mounted',
  'Preload bridge available',
  'Ready for drone control spike',
];

function App() {
  const runtime = window.electronAPI;

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Electron + React + TypeScript</p>
        <h1>FreeDrive Jumping</h1>
        <p className="intro">
          The desktop shell is ready. The next milestone is connecting this app
          to a real Jumping drone and routing keyboard commands safely through
          the Electron backend.
        </p>

        <div className="runtime-grid">
          <article>
            <span className="label">Platform</span>
            <strong>{runtime?.platform ?? 'browser preview'}</strong>
          </article>
          <article>
            <span className="label">Electron</span>
            <strong>{runtime?.versions.electron ?? 'not loaded'}</strong>
          </article>
          <article>
            <span className="label">Node</span>
            <strong>{runtime?.versions.node ?? 'not loaded'}</strong>
          </article>
          <article>
            <span className="label">Chrome</span>
            <strong>{runtime?.versions.chrome ?? 'not loaded'}</strong>
          </article>
        </div>
      </section>

      <section className="status-card">
        <h2>Initialization Checklist</h2>
        <ul className="checklist">
          {checks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default App;
