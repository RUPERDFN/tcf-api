import { env } from '../config/env.js';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!env.SMTP_HOST) {
    console.log('Email service not configured, skipping:', options.subject);
    return false;
  }

  try {
    console.log(`Sending email to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: '¡Bienvenido a TheCookFlow!',
    html: `
      <h1>¡Hola ${name || 'Chef'}!</h1>
      <p>Gracias por unirte a TheCookFlow. Estamos emocionados de ayudarte a planificar tus comidas.</p>
      <p>Comienza creando tu perfil alimentario para recibir menús personalizados.</p>
    `
  });
}

export async function sendMenuReadyEmail(email: string, weekStart: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: '¡Tu menú semanal está listo!',
    html: `
      <h1>Tu menú para la semana del ${weekStart} está listo</h1>
      <p>Entra a la app para ver tus comidas planificadas y la lista de compras.</p>
    `
  });
}
