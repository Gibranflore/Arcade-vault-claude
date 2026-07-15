export function Background() {
  return (
    <>
      {/* Base dark background */}
      <div className="fixed inset-0 bg-vault-bg z-[-3]" />

      {/* Radial glow at top */}
      <div
        className="fixed inset-0 z-[-2] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,245,255,0.08), transparent 70%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(255,0,110,0.06), transparent 70%)',
        }}
      />

      {/* Perspective grid at bottom */}
      <div className="perspective-grid" />

      {/* Scanlines overlay */}
      <div className="scanlines" />

      {/* Animated scanline sweep */}
      <div className="scanline-sweep" />

      {/* Subtle noise texture */}
      <div
        className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </>
  );
}
