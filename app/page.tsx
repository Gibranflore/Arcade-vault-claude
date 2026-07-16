export default function Home() {
  return (
    <div className="min-h-screen relative flex flex-1 flex-col items-center justify-center bg-vault-bg overflow-hidden">
      {/* Radial glow */}
      <div
        className="fixed inset-0 z-[-2] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,245,255,0.08), transparent 70%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(255,0,110,0.06), transparent 70%)",
        }}
      />
      {/* Perspective grid + scanlines */}
      <div className="perspective-grid" />
      <div className="scanlines" />
      <div className="scanline-sweep" />

      <main className="relative z-10 flex flex-col items-center gap-8 px-6 text-center page-enter">
        <h1 className="font-pixel text-2xl sm:text-4xl text-neon-cyan leading-relaxed">
          ARCADE
          <br />
          VAULT
        </h1>
        <p className="font-mono text-sm sm:text-base text-gray-400 max-w-md">
          Plataforma para jugar online y competir por la mayor cantidad de puntos.
        </p>

        <div className="neon-border-magenta bg-vault-panel px-6 py-4">
          <p className="font-pixel text-xs text-neon-yellow">INSERTA UNA MONEDA PARA JUGAR</p>
        </div>

        <button className="btn-pixel neon-border-cyan text-neon-cyan bg-vault-panel">
          Empezar
        </button>
      </main>

      <footer className="relative z-10 mt-16 border-t border-vault-border py-6 px-4 w-full">
        <div className="max-w-7xl mx-auto text-center">
          <p className="font-pixel text-[10px] text-neon-cyan/50 mb-2">ARCADE VAULT</p>
          <p className="font-mono text-xs text-gray-600">
            © {new Date().getFullYear()} · Inserta una moneda para jugar
          </p>
        </div>
      </footer>
    </div>
  );
}
