'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

type HighlightKind = 'HEART' | 'BROWSER' | 'PLANT';

const HIGHLIGHTS: { icon: HighlightKind; text: string; color: string }[] = [
  { icon: 'HEART', text: 'HECHO CON ❤️ PARA JUGADORES', color: 'text-neon-magenta' },
  { icon: 'BROWSER', text: 'JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR', color: 'text-neon-cyan' },
  { icon: 'PLANT', text: 'PROYECTO EN CONSTANTE CRECIMIENTO', color: 'text-neon-green' },
];

function HighlightIcon({ kind }: { kind: HighlightKind }) {
  const C = 'currentColor';
  const common = 'w-9 h-9 shrink-0';
  const style = { filter: 'drop-shadow(0 0 6px currentColor)', imageRendering: 'pixelated' as const };

  if (kind === 'HEART') {
    return (
      <svg className={common} style={style} viewBox="0 0 16 16">
        <g fill={C}>
          <rect x="2" y="3" width="4" height="2" />
          <rect x="10" y="3" width="4" height="2" />
          <rect x="1" y="4" width="2" height="4" />
          <rect x="13" y="4" width="2" height="4" />
          <rect x="2" y="8" width="2" height="2" />
          <rect x="12" y="8" width="2" height="2" />
          <rect x="3" y="9" width="10" height="2" />
          <rect x="4" y="11" width="8" height="2" />
          <rect x="5" y="12" width="6" height="2" />
          <rect x="6" y="13" width="4" height="1" />
          <rect x="7" y="14" width="2" height="1" />
        </g>
      </svg>
    );
  }
  if (kind === 'BROWSER') {
    return (
      <svg className={common} style={style} viewBox="0 0 16 16">
        <g fill={C}>
          <rect x="1" y="2" width="14" height="12" fill="none" stroke={C} strokeWidth="1.4" />
          <rect x="1" y="2" width="14" height="3" />
          <rect x="3" y="3" width="1" height="1" fill="#0a0a0f" />
          <rect x="5" y="3" width="1" height="1" fill="#0a0a0f" />
          <rect x="7" y="3" width="1" height="1" fill="#0a0a0f" />
          <rect x="3" y="7" width="4" height="1" />
          <rect x="3" y="9" width="6" height="1" />
          <rect x="3" y="11" width="3" height="1" />
        </g>
      </svg>
    );
  }
  return (
    <svg className={common} style={style} viewBox="0 0 16 16">
      <g fill={C}>
        <rect x="7" y="2" width="2" height="10" />
        <rect x="4" y="4" width="3" height="2" />
        <rect x="9" y="6" width="3" height="2" />
        <rect x="3" y="3" width="2" height="2" />
        <rect x="11" y="5" width="2" height="2" />
        <rect x="3" y="12" width="10" height="2" />
        <rect x="4" y="14" width="8" height="1" />
      </g>
    </svg>
  );
}

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
    >
      {children}
    </div>
  );
}

export function About() {
  const [form, setForm] = useState({ name: '', email: '', msg: '' });
  const [sent, setSent] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setSent(form.name.trim());
  };

  return (
    <div className="page-enter relative">
      {/* ACERCA DE */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-10 text-center">
        <div className="font-pixel text-[11px] tracking-[0.24em] text-neon-yellow mb-4">▸ ACERCA DE</div>
        <h1
          className="font-pixel uppercase tracking-wide text-3xl sm:text-5xl bg-clip-text text-transparent"
          style={{
            backgroundImage: 'linear-gradient(180deg, #fff, #00f5ff 80%)',
            filter: 'drop-shadow(0 0 14px rgba(0,245,255,0.4))',
          }}
        >
          Acerca de Arcade Vault
        </h1>
        <p className="max-w-2xl mx-auto mt-7 text-[15px] leading-[1.8] tracking-wide text-gray-400">
          ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra misión es preservar y celebrar
          los arcades que definieron una generación, haciéndolos accesibles para todos, en cualquier lugar
          y sin costo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 text-left">
          {HIGHLIGHTS.map((h, i) => (
            <div
              key={h.icon}
              className={`flex items-center gap-4 p-5 bg-vault-panel border border-vault-border transition-all duration-200 hover:-translate-y-1 hover:border-current ${h.color}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <HighlightIcon kind={h.icon} />
              <div className="font-pixel text-[10px] leading-relaxed tracking-wide text-white">{h.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <Reveal className="max-w-6xl mx-auto px-4 sm:px-6 my-16">
        <div className="flex items-center gap-4" aria-hidden="true">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #ff006e, transparent)' }} />
          <div className="flex gap-1">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 animate-pulse"
                style={{
                  animationDelay: `${i * 80}ms`,
                  backgroundColor: i % 5 === 0 ? '#f5ff00' : i % 3 === 0 ? '#ff006e' : '#00f5ff',
                  boxShadow: `0 0 6px ${i % 5 === 0 ? '#f5ff00' : i % 3 === 0 ? '#ff006e' : '#00f5ff'}`,
                }}
              />
            ))}
          </div>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #ff006e, transparent)' }} />
        </div>
      </Reveal>

      {/* CONTACTO */}
      <Reveal className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-10 items-start">
          <div>
            <div className="font-pixel text-[11px] tracking-[0.24em] text-neon-cyan mb-4">▸ CONTACTO</div>
            <h2
              className="font-pixel text-2xl sm:text-4xl tracking-wide text-neon-cyan"
              style={{ textShadow: '0 0 12px rgba(0,245,255,0.4)' }}
            >
              Contáctanos
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mt-5 mb-6">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o simplemente quieres saludar?
              Escríbenos.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 font-pixel text-[9px] tracking-wide text-gray-400">
                <span className="w-2 h-2 rounded-full bg-neon-green" style={{ boxShadow: '0 0 6px #39ff14' }} />
                RESPUESTA EN 24-48H
              </div>
              <div className="flex items-center gap-3 font-pixel text-[9px] tracking-wide text-gray-400">
                <span className="w-2 h-2 rounded-full bg-neon-yellow" style={{ boxShadow: '0 0 6px #f5ff00' }} />
                SUGERENCIAS BIENVENIDAS
              </div>
              <div className="flex items-center gap-3 font-pixel text-[9px] tracking-wide text-gray-400">
                <span className="w-2 h-2 rounded-full bg-neon-magenta" style={{ boxShadow: '0 0 6px #ff006e' }} />
                SIN SPAM, JAMÁS
              </div>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className={`relative bg-vault-panel border border-vault-border p-7 ${shake ? 'animate-shake' : ''}`}
          >
            {!sent ? (
              <>
                <div className="flex flex-col gap-1.5 mb-4">
                  <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">Nombre</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="px_kai"
                    className="h-11 bg-vault-bg border border-vault-border px-3 outline-none font-mono text-sm text-white transition-all focus:border-neon-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.35)]"
                  />
                </div>
                <div className="flex flex-col gap-1.5 mb-4">
                  <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">Correo electrónico</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jugador@vault.gg"
                    className="h-11 bg-vault-bg border border-vault-border px-3 outline-none font-mono text-sm text-white transition-all focus:border-neon-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.35)]"
                  />
                </div>
                <div className="flex flex-col gap-1.5 mb-5">
                  <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">Mensaje</label>
                  <textarea
                    rows={5}
                    value={form.msg}
                    onChange={(e) => setForm({ ...form, msg: e.target.value })}
                    placeholder="Cuéntanos qué tienes en mente…"
                    className="bg-vault-bg border border-vault-border p-3 outline-none font-mono text-sm text-white resize-y min-h-[110px] transition-all focus:border-neon-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.35)]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 font-pixel text-xs tracking-[0.2em] uppercase text-neon-cyan border border-neon-cyan transition-all hover:shadow-[0_0_15px_rgba(0,245,255,0.4)] active:scale-[0.99]"
                >
                  ▶ Enviar mensaje
                </button>
              </>
            ) : (
              <div className="bg-black border border-neon-green overflow-hidden" style={{ boxShadow: '0 0 22px rgba(57,255,20,0.25)' }}>
                <div className="flex items-center gap-2 px-3 py-2 bg-vault-bg border-b border-vault-border">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f56' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ffbd2e' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#27c93f' }} />
                  <span className="ml-2 font-pixel text-[9px] tracking-[0.14em] text-gray-500">VAULT-OS // TERMINAL</span>
                </div>
                <div className="p-5 font-mono text-sm leading-[1.8] text-neon-green">
                  <div>
                    <span className="text-neon-cyan mr-2">vault@arcade:~$</span>./send_message --to=team
                  </div>
                  <div className="text-gray-500">[OK] Conectando con servidor…</div>
                  <div className="text-gray-500">[OK] Validando contenido…</div>
                  <div className="text-gray-500">[OK] Transmitiendo paquete…</div>
                  <div className="mt-3 font-bold" style={{ textShadow: '0 0 6px rgba(57,255,20,0.45)' }}>
                    &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {sent.toUpperCase()}.
                    <span className="animate-pulse">_</span>
                  </div>
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => {
                        setSent(null);
                        setForm({ name: '', email: '', msg: '' });
                      }}
                      className="px-4 py-2.5 font-pixel text-[10px] uppercase tracking-wide text-gray-400 border border-gray-600 transition-colors hover:text-white"
                    >
                      Enviar otro mensaje
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </Reveal>
    </div>
  );
}
