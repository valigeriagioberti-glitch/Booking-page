import Stripe from 'stripe';
import { json, readJson, assertEnv, safeParseInt, daysBetweenInclusive, randomBookingId } from './_utils.js';

const PRICES_EUR = { Small: 5, Medium: 6, Large: 7 };

function normalizeBagQuantities(input) {
  const q = input && typeof input === 'object' ? input : {};
  const Small = safeParseInt(q.Small, 0);
  const Medium = safeParseInt(q.Medium, 0);
  const Large = safeParseInt(q.Large, 0);
  const out = {
    Small: Math.max(0, Small),
    Medium: Math.max(0, Medium),
    Large: Math.max(0, Large),
  };
  return out;
}

function totalBags(q) {
  return (q.Small || 0) + (q.Medium || 0) + (q.Large || 0);
}

function perDaySubtotal(q) {
  return (q.Small || 0) * PRICES_EUR.Small + (q.Medium || 0) * PRICES_EUR.Medium + (q.Large || 0) * PRICES_EUR.Large;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const STRIPE_SECRET_KEY = assertEnv('STRIPE_SECRET_KEY');
    const CLIENT_URL = assertEnv('CLIENT_URL');

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

    const body = await readJson(req);

    const bagQuantities = normalizeBagQuantities(body.bagQuantities);
    const dropOffDate = body.dropOffDate;
    const pickUpDate = body.pickUpDate;

    const customerEmail = String(body.customerEmail || '').trim();
    const customerName = String(body.customerName || '').trim();
    const customerPhone = String(body.customerPhone || '').trim();

    if (!customerEmail || !/.+@.+\..+/.test(customerEmail)) return json(res, 400, { error: 'Invalid email.' });
    if (!dropOffDate || !pickUpDate) return json(res, 400, { error: 'Missing dates.' });

    const days = daysBetweenInclusive(dropOffDate, pickUpDate);
    if (!days || days <= 0) return json(res, 400, { error: 'Invalid date range.' });

    if (totalBags(bagQuantities) <= 0) return json(res, 400, { error: 'Select at least 1 bag.' });

    const perDay = perDaySubtotal(bagQuantities);
    const total = perDay * days;
    const amountTotal = Math.round(total * 100); // cents

    const bookingId = randomBookingId();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Luggage storage reservation' },
            unit_amount: amountTotal,
          },
          quantity: 1,
        },
      ],
      success_url: `${CLIENT_URL}/#/success/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/#/cancel`,
      metadata: {
        bookingId,
        dropOffDate,
        pickUpDate,
        days: String(days),
        bagQuantities: JSON.stringify(bagQuantities),
        perDaySubtotal: String(perDay),
        totalAmountEUR: String(total),
        customerEmail,
        customerName,
        customerPhone,
      },
    });

    return json(res, 200, { url: session.url });
  } catch (e) {
    return json(res, 500, { error: e?.message || 'Server error' });
  }
}
