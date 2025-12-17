import Stripe from 'stripe';
import { json, readJson, assertEnv } from './_utils.js';

function safeJsonParse(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { verified: false, error: 'Method not allowed' });

  try {
    const STRIPE_SECRET_KEY = assertEnv('STRIPE_SECRET_KEY');
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

    const body = await readJson(req);
    const sessionId = String(body.sessionId || '').trim();
    if (!sessionId) return json(res, 400, { verified: false, error: 'Missing sessionId' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid = session.payment_status === 'paid';

    const md = session.metadata || {};
    const bagQuantities = safeJsonParse(md.bagQuantities || '{}', { Small: 0, Medium: 0, Large: 0 });

    const booking = {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total ?? 0, // cents
      currency: session.currency,
      bookingId: md.bookingId,
      dropOffDate: md.dropOffDate,
      pickUpDate: md.pickUpDate,
      days: Number(md.days || 0),
      bagQuantities,
      perDaySubtotal: Number(md.perDaySubtotal || 0),
      customerEmail: md.customerEmail || session.customer_details?.email || '',
      customerName: md.customerName || '',
      customerPhone: md.customerPhone || '',
    };

    return json(res, 200, { verified: !!paid, booking });
  } catch (e) {
    return json(res, 500, { verified: false, error: e?.message || 'Server error' });
  }
}
