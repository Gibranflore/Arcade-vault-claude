# Spec 02 — Página "Acerca de" (`/about`)

- **Estado:** Aprobado
- **Dependencias:** Spec 01 (pantallas visuales del MVP — Navbar, Background, layout ya portados)
- **Fecha:** 2026-07-18

**Objetivo:** Portar la pantalla "Acerca de" de la referencia (`app/src/home-about/about.jsx`) como una nueva ruta `/about` en Next.js, con su sección de misión/highlights y su formulario de contacto simulado, integrada a la Navbar existente.

## Scope

**Dentro del alcance:**
- Nueva ruta `/about` (`app/about/page.tsx`) portando el contenido de `about.jsx`:
  - Sección "Acerca de": kicker, título, texto de misión, fila de 3 highlights (HEART, BROWSER, PLANT) con sus iconos SVG pixel.
  - Divisor animado entre secciones (`about-divider`).
  - Sección "Contacto": intro + tips, y formulario (nombre, email, mensaje) con validación básica (shake si falta algún campo) y estado de éxito simulado (animación tipo terminal), igual que la referencia.
- Se agrega el link "Acerca de" a `Navbar.tsx` (desktop y panel mobile), apuntando a `/about`, con el mismo patrón de estado activo (`usePathname`) que los links existentes.
- La página usa el `Background.tsx` y layout global ya montados (sin fondo/wrapper nuevo).
- Estilos adaptados a Tailwind v4 / los tokens de color ya existentes en el proyecto (`neon-cyan`, `neon-magenta`, `neon-yellow`, etc. de `globals.css`), no se copia `styles.css` de la referencia tal cual.
- Verificación visual con el MCP de Playwright durante `/spec-impl`: abrir `/about` en navegador y comparar contra la referencia (`about.jsx` / `arcade-vault-standalone.html`) antes de dar el paso por terminado.

**Fuera de alcance (explícitamente NO se hace):**
- Cambios a la ruta `/` (sigue siendo la Biblioteca, sin modificaciones).
- Portar `home.jsx` (landing) — no se crea ninguna ruta nueva a partir de ese archivo.
- Envío real del formulario de contacto (email, API, base de datos) — el "éxito" es puramente visual/simulado, sin persistencia ni red.
- Portar `nav.jsx` como componente — se reutiliza `Navbar.tsx` existente.
- Auditoría de accesibilidad/responsive más allá de lo heredado de la referencia.

## Modelo de datos

No se introduce ningún modelo de datos nuevo ni persistencia. El formulario de contacto usa únicamente estado local de React (`form: { name, email, msg }`, `sent`, `shake`) dentro del componente de la página, igual que en la referencia — no hay tipos, mocks ni `lib/*.ts` nuevos que agregar.

## Plan de implementación

1. **Ruta `/about`.** Crear `app/about/page.tsx` portando la estructura de `about.jsx`: sección "Acerca de" (kicker, título, misión, 3 highlights con sus iconos SVG pixel), divisor animado, y sección "Contacto" (intro + tips + formulario). Convertir JSX de referencia (React global, `useEffectAb`/`useStateAb`) a un client component estándar de Next (`'use client'`, `useState`/`useEffect` de `react`). El sistema sigue funcional (resto de rutas no se tocan).

2. **Estilos.** Adaptar las clases de `styles.css` (`.about-hero`, `.highlight-row`, `.about-contact`, `.contact-form`, `.terminal-success`, animación `.reveal`/`IntersectionObserver`, `.shake`, etc.) a Tailwind v4 usando los tokens de color ya existentes (`neon-cyan`, `neon-magenta`, `neon-yellow`, `vault-*`) en vez de copiar el CSS tal cual.

3. **Formulario de contacto.** Implementar validación básica (campos no vacíos → si falta alguno, activar `shake` por 400ms) y estado de éxito simulado (panel "terminal" con líneas animadas y botón "Enviar otro mensaje" que resetea el formulario), sin llamadas de red.

4. **Navbar.** Agregar `{ href: '/about', label: 'Acerca de', icon: Info, active: pathname === '/about' }` (o icono equivalente de `lucide-react`) al arreglo `navItems` en `app/components/Navbar.tsx`, visible en desktop y en el panel mobile.

5. **Verificación visual con Playwright.** Levantar `npm run dev`, navegar a `/about` con el MCP de Playwright, tomar snapshot/screenshot y comparar visualmente contra `about.jsx` / `arcade-vault-standalone.html` (colores, layout de highlights, comportamiento del formulario) antes de cerrar el paso.

## Criterios de aceptación

- [ ] `npm run dev` levanta la app y `/about` renderiza sin errores.
- [ ] `/about` muestra: kicker + título + texto de misión, y los 3 highlights (HEART, BROWSER, PLANT) con su icono correspondiente.
- [ ] El divisor animado aparece entre la sección "Acerca de" y "Contacto".
- [ ] La sección "Contacto" muestra la intro, los 3 tips y el formulario (Nombre, Correo electrónico, Mensaje).
- [ ] Enviar el formulario con algún campo vacío dispara la animación `shake` y no muestra el estado de éxito.
- [ ] Enviar el formulario con los 3 campos completos muestra el panel de éxito tipo terminal, incluyendo el nombre ingresado en mayúsculas.
- [ ] El botón "Enviar otro mensaje" del panel de éxito resetea el formulario a su estado inicial (vacío, sin éxito mostrado).
- [ ] La Navbar (desktop y mobile) muestra un link "Acerca de" que navega a `/about` y se marca como activo (estilo `neon-cyan` + subrayado) cuando la ruta actual es `/about`.
- [ ] Navegar desde `/about` a `/` (Biblioteca) o `/salon-de-la-fama` y volver funciona sin romper el estado de la Navbar.
- [ ] `npm run lint` pasa sin errores nuevos.
- [ ] Verificación visual con Playwright MCP realizada: captura de `/about` revisada contra la referencia antes de cerrar el spec.

## Decisiones tomadas y descartadas

- **Solo `/about`, sin tocar `/`.** Justificación: decisión explícita del usuario — `/` sigue siendo la Biblioteca (spec 01); portar `home.jsx` como landing queda fuera de este spec.
- **Se reutiliza `Navbar.tsx` existente en vez de portar `nav.jsx`.** Justificación: mantiene una sola fuente de verdad para la navegación del sitio y evita duplicar lógica de estado activo/mobile que ya funciona.
- **Formulario de contacto simulado, sin backend.** Justificación: consistente con el resto del MVP (spec 01, auth mock) — no hay servicio de email ni API disponible todavía.
- **Estilos migrados a Tailwind con tokens existentes, no se copia `styles.css`.** Justificación: evita duplicar/diverger definiciones de color y mantiene consistencia con el resto de `app/` ya portado en spec 01.
- **Verificación visual con Playwright MCP como parte del plan de implementación.** Justificación: pedido explícito del usuario — cada vez que se crea una pantalla nueva, se valida visualmente contra la referencia antes de darla por terminada.

## Riesgos identificados

- **Uso de `IntersectionObserver` para animaciones `.reveal`.** Si se porta tal cual, hay que implementarlo como efecto propio del client component (no existe utilidad compartida para esto en `app/` todavía). Mitigación: mantenerlo local a `app/about/page.tsx`, sin crear un hook compartido no solicitado por este spec.
