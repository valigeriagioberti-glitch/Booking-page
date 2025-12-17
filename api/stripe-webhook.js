import Stripe from 'stripe';
import { Resend } from 'resend';
import { json, readRawBody, assertEnv } from './_utils.js';

export const config = { api: { bodyParser: false } };

function safeJsonParse(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

function formatBags(q) {
  const s = Number(q.Small || 0);
  const m = Number(q.Medium || 0);
  const l = Number(q.Large || 0);
  return `Small: ${s}, Medium: ${m}, Large: ${l}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

  const STRIPE_SECRET_KEY = assertEnv('STRIPE_SECRET_KEY');
  const STRIPE_WEBHOOK_SECRET = assertEnv('STRIPE_WEBHOOK_SECRET');
  const RESEND_API_KEY = assertEnv('RESEND_API_KEY');
  const EMAIL_FROM = assertEnv('EMAIL_FROM');
  const ADMIN_EMAIL = assertEnv('ADMIN_EMAIL');
  const CLIENT_URL = assertEnv('CLIENT_URL');

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  const resend = new Resend(RESEND_API_KEY);

  try {
    const rawBody = await readRawBody(req);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return json(res, 400, { ok: false, error: `Webhook signature verification failed.` });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const md = session.metadata || {};
      const bookingId = md.bookingId || '(unknown)';
      const dropOffDate = md.dropOffDate || '';
      const pickUpDate = md.pickUpDate || '';
      const days = md.days || '';
      const bagQuantities = safeJsonParse(md.bagQuantities || '{}', { Small: 0, Medium: 0, Large: 0 });
      const customerEmail = md.customerEmail || session.customer_details?.email || '';
      const customerName = md.customerName || '';
      const amountTotal = session.amount_total || 0;
      const sessionId = session.id;

      const successLink = `${CLIENT_URL}/#/success/${sessionId}`;

      const subject = `Booking confirmed • ${bookingId}`;

      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5">
          <h2 style="margin:0 0 8px">Booking Confirmed</h2>
          <p style="margin:0 0 12px">Thank you${customerName ? `, ${customerName}` : ''}. Your luggage storage booking is confirmed.</p>
          <table style="border-collapse:collapse;width:100%;max-width:520px">
            <tr><td style="padding:6px 0;color:#475569">Booking ID</td><td style="padding:6px 0;font-weight:700">${bookingId}</td></tr>
            <tr><td style="padding:6px 0;color:#475569">Drop-off</td><td style="padding:6px 0">${dropOffDate}</td></tr>
            <tr><td style="padding:6px 0;color:#475569">Pick-up</td><td style="padding:6px 0">${pickUpDate}</td></tr>
            <tr><td style="padding:6px 0;color:#475569">Billable days</td><td style="padding:6px 0">${days}</td></tr>
            <tr><td style="padding:6px 0;color:#475569">Bags</td><td style="padding:6px 0">${formatBags(bagQuantities)}</td></tr>
            <tr><td style="padding:6px 0;color:#475569">Total paid</td><td style="padding:6px 0;font-weight:700">€${(amountTotal/100).toFixed(2)}</td></tr>
          </table>
          <p style="margin:14px 0 0">View details / download PDF: <a href="${successLink}">${successLink}</a></p>
        </div>
      `;

      const toList = [customerEmail, ADMIN_EMAIL].filter(Boolean);

      await resend.emails.send({
        from: EMAIL_FROM,
        to: toList,
        subject,
        html,
      });
    }

    return json(res, 200, { ok: true });
  } catch (e) {
    return json(res, 500, { ok: false, error: e?.message || 'Server error' });
  }
}
