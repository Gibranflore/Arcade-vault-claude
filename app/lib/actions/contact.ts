'use server';

import { Resend } from 'resend';

export type ContactPayload = {
  name: string;
  email: string;
  msg: string;
  honeypot: string;
};

export type ContactResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContactMessage(payload: ContactPayload): Promise<ContactResult> {
  if (payload.honeypot) {
    return { ok: true };
  }

  if (!payload.name.trim() || !payload.email.trim() || !payload.msg.trim()) {
    return { ok: false, error: 'Faltan campos requeridos.' };
  }

  if (!EMAIL_RE.test(payload.email.trim())) {
    return { ok: false, error: 'Correo electrónico inválido.' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: 'Arcade Vault <onboarding@resend.dev>',
      to: process.env.CONTACT_EMAIL_TO!,
      replyTo: payload.email.trim(),
      subject: `Nuevo mensaje de contacto de ${payload.name.trim()}`,
      text: `De: ${payload.name.trim()} <${payload.email.trim()}>\n\n${payload.msg.trim()}`,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Error desconocido al enviar el correo.' };
  }
}
