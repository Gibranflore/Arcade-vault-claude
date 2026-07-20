# Spec 03 — Envío real de correo en el formulario de contacto (Resend)

- **Estado:** Implementado
- **Dependencias:** Spec 02 (página `/about` con formulario de contacto simulado)
- **Fecha:** 2026-07-20

**Objetivo:** Reemplazar el envío simulado del formulario de contacto de `/about` por un envío real de correo electrónico usando Resend, manteniendo la misma UI de éxito y agregando un estado de error.

## Scope

**Dentro del alcance:**
- Instalar el paquete `resend` (SDK oficial) como dependencia de producción.
- Server Action (`'use server'`) que recibe `{ name, email, msg }` del formulario de `/about` y envía el correo vía Resend, en vez de solo simular el estado `sent` en el cliente.
- Variables de entorno nuevas (`.env.local`, no committeadas): `RESEND_API_KEY` y `CONTACT_EMAIL_TO` (dirección fija de destino, pendiente de valor exacto por parte del usuario). Se agrega `.env.example` con ambas claves vacías/de ejemplo.
- Remitente (`from`) usando el sandbox de Resend (`onboarding@resend.dev`) — sin dominio propio verificado por ahora.
- Validación de formato básico del campo "Correo electrónico" (regex simple `algo@algo.algo`) antes de intentar el envío, reutilizando la misma animación `shake` que ya existe para campos vacíos.
- Campo honeypot oculto (invisible para humanos, ej. `input` con `tabIndex={-1}`, fuera de la vista, `autoComplete="off"`) en el formulario: si llega con contenido, la Server Action descarta el envío silenciosamente y responde como si hubiera tenido éxito (para no darle señal al bot).
- Estado de carga: mientras la Server Action está en curso, el botón de envío se deshabilita y muestra "Enviando…".
- Nuevo estado visual de error (panel tipo terminal en rojo, análogo al panel de éxito existente) cuando Resend falla o responde con error, con opción de reintentar sin perder lo escrito en el formulario.
- El panel de éxito actual (terminal verde con el nombre en mayúsculas) se mantiene igual, ahora disparado solo tras una respuesta exitosa real de la Server Action.

**Fuera de alcance (explícitamente NO se hace):**
- Dominio propio verificado en Resend — se usa el sandbox `onboarding@resend.dev`, con la limitación conocida de que solo entrega a la dirección verificada de la cuenta de Resend.
- Correo de confirmación automático al remitente (a la dirección que la persona escribió en el formulario) — solo se envía el correo al equipo.
- Persistencia de los mensajes de contacto (base de datos, tabla de mensajes, panel de administración) — el correo es el único registro.
- Rate limiting por IP/usuario más allá del honeypot (ej. Upstash, reCAPTCHA) — queda fuera de este spec.
- Cambios a cualquier otra sección de `/about` (misión, highlights, divisor) o a cualquier otra ruta.
- Reintentos automáticos o cola de envíos ante fallos de Resend — el reintento es manual (el usuario vuelve a pulsar "Enviar mensaje").

## Modelo de datos

No se introduce persistencia ni base de datos. Se agrega una forma de datos para el payload que viaja del formulario a la Server Action:

```ts
type ContactPayload = {
  name: string;
  email: string;
  msg: string;
  honeypot: string; // debe llegar vacío; si no, se descarta el envío
};

type ContactResult =
  | { ok: true }
  | { ok: false; error: string };
```

`ContactPayload` no se guarda en ningún lado: se lee, se valida, se usa para armar el cuerpo del correo vía `resend.emails.send(...)` y se descarta. `ContactResult` es el valor de retorno de la Server Action, que el cliente usa para decidir entre el panel de éxito o el nuevo panel de error.

Variables de entorno (no son datos de la app, pero se documentan aquí por ser nuevas):
- `RESEND_API_KEY` — clave secreta de Resend, solo server-side.
- `CONTACT_EMAIL_TO` — dirección fija de destino del correo, solo server-side.

## Plan de implementación

1. **Dependencia y variables de entorno.** Instalar `resend` (`npm install resend`). Crear `.env.example` con `RESEND_API_KEY=` y `CONTACT_EMAIL_TO=` vacíos, y documentar en él que `.env.local` (gitignored) debe tener los valores reales. El sistema sigue funcional (nada usa estas variables todavía).

2. **Server Action de envío.** Crear `app/lib/actions/contact.ts` con `'use server'`, exportando `sendContactMessage(payload: ContactPayload): Promise<ContactResult>`: valida que `honeypot` esté vacío (si no, retorna `{ ok: true }` sin llamar a Resend), valida formato básico de `email`, y llama a `resend.emails.send({ from: 'onboarding@resend.dev', to: process.env.CONTACT_EMAIL_TO, ... })` dentro de un `try/catch`, retornando `{ ok: false, error }` si falla.

3. **Wiring del formulario.** Modificar `app/components/About.tsx`: agregar el campo honeypot oculto al formulario, agregar validación de formato de email antes de invocar la acción (dispara `shake` si es inválido), reemplazar el `setSent` inmediato del `onSubmit` actual por una llamada a `sendContactMessage`, con un estado `pending` (botón deshabilitado + "Enviando…") mientras se resuelve la promesa.

4. **Estado de error visual.** Agregar un nuevo estado `error: string | null` en `About.tsx` y el panel de error (terminal en rojo, mismo patrón visual que el panel de éxito existente) que se muestra cuando `sendContactMessage` retorna `{ ok: false }`, con un botón para volver al formulario sin perder `name`/`email`/`msg` ya escritos.

5. **Verificación funcional con Playwright.** Levantar `npm run dev`, llenar y enviar el formulario en `/about` con Playwright MCP, confirmar visualmente el estado "Enviando…", luego el panel de éxito, y validar en la bandeja de Resend/destino que el correo llegó realmente. Adicionalmente, forzar un caso de error (ej. `RESEND_API_KEY` inválida temporalmente) para verificar que el panel de error aparece y permite reintentar.

## Criterios de aceptación

- [x] `npm run dev` levanta la app y `/about` renderiza sin errores.
- [x] Enviar el formulario con `name`, `email` o `msg` vacíos dispara `shake` y no invoca la Server Action.
- [x] Enviar el formulario con un email de formato inválido (ej. `sinarroba.com`) dispara `shake` y no invoca la Server Action.
- [x] Enviar el formulario con los 3 campos válidos deshabilita el botón y muestra "Enviando…" mientras se espera la respuesta.
- [x] Un envío exitoso muestra el panel de éxito (terminal verde) existente, y el correo llega realmente a `CONTACT_EMAIL_TO` con el nombre, email y mensaje ingresados.
- [x] Si la Server Action retorna `{ ok: false }` (ej. API key inválida), se muestra el nuevo panel de error (terminal rojo) en vez del panel de éxito, sin perder lo escrito en el formulario.
- [x] Desde el panel de error, el usuario puede volver a intentar el envío sin recargar la página.
- [x] Si el campo honeypot llega con contenido (simulado manualmente), la Server Action retorna `{ ok: true }` pero no se envía ningún correo real vía Resend.
- [x] `RESEND_API_KEY` y `CONTACT_EMAIL_TO` no aparecen en ningún archivo committeado (solo en `.env.local`, gitignored); `.env.example` documenta ambas claves vacías.
- [x] `npm run lint` pasa sin errores nuevos.
- [x] Verificación funcional con Playwright realizada: envío real observado end-to-end (carga → éxito y/o error) antes de cerrar el spec.

## Decisiones tomadas y descartadas

- **Server Action en vez de Route Handler.** Justificación: es el patrón nativo de Next.js App Router para mutaciones desde un formulario cliente, sin necesidad de definir ni mantener un endpoint HTTP aparte.
- **Sandbox de Resend (`onboarding@resend.dev`) en vez de dominio propio verificado.** Justificación: decisión explícita del usuario para no bloquear este spec en configuración de DNS; se acepta la limitación de que solo entrega al correo verificado de la cuenta de Resend. Verificar un dominio propio queda para un spec futuro si el proyecto pasa a producción pública real.
- **Sin correo de confirmación al remitente.** Justificación: decisión explícita del usuario — mantiene el alcance a un solo envío (equipo), evitando duplicar lógica de plantillas de correo en este spec.
- **Honeypot como única protección anti-spam, sin reCAPTCHA ni rate limiting.** Justificación: decisión explícita del usuario — es gratis, no agrega dependencias ni fricción al formulario, y cubre el caso más común de bots simples. Protecciones más robustas quedan fuera de alcance si el volumen de spam lo justifica más adelante.
- **Estado de error explícito (panel terminal rojo) en vez de solo un mensaje inline.** Justificación: decisión explícita del usuario — consistente visualmente con el panel de éxito ya existente, y le da al usuario una acción clara (reintentar).
- **Reintento manual, sin cola ni reintentos automáticos.** Justificación: mantiene el alcance simple; un formulario de contacto de bajo volumen no justifica infraestructura de reintentos.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Sandbox de Resend solo entrega al correo verificado de la cuenta, no a cualquier destinatario. | Aceptado explícitamente por el usuario; documentado en Scope y Decisiones. Si se necesita recibir de verdad en producción pública, requiere verificar un dominio propio en un spec futuro. |
| `RESEND_API_KEY` expuesta accidentalmente en el cliente. | La llamada a Resend vive únicamente en la Server Action (`app/lib/actions/contact.ts`, sin `'use client'`); la key nunca se pasa como prop ni se referencia con prefijo `NEXT_PUBLIC_`. |
| Fallos silenciosos si Resend cambia su forma de reportar errores (ej. HTTP 200 con `error` en el body en vez de excepción). | El `try/catch` de la Server Action revisa explícitamente el campo `error` de la respuesta del SDK, no solo excepciones de red. |
| Honeypot inspeccionable en el HTML (bots avanzados pueden detectarlo). | Aceptado como riesgo conocido — es una mitigación básica, no antispam robusto; suficiente para el volumen esperado de este MVP. |
