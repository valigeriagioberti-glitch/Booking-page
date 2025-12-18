
import Stripe from 'stripe';
import { differenceInDays, isValid, isBefore } from 'date-fns';
// Fix missing exported member by importing from specific subpath
import { parseISO } from 'date-fns/parseISO';
// Fix missing exported member by importing from specific subpath
import { startOfDay } from 'date-fns/startOfDay';
import { PRICING_RULES } from '../constants';
import { BagSize } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const { 
    quantities, 
    dropOffDate, 
    pickUpDate, 
    customerName, 
    customerEmail, 
    customerPhone,
    language 
  } = req.body;

  // Server-side calculation to prevent tampering
  const start = startOfDay(parseISO(dropOffDate));
  const end = startOfDay(parseISO(pickUpDate));
  
  if (!isValid(start) || !isValid(end) || isBefore(end, start)) {
    return res.status(400).json({ error: 'Invalid dates' });
  }
  
  const billableDays = differenceInDays(end, start) + 1;
  let totalInCents = 0;

  Object.entries(quantities).forEach(([size, qty]: [any, any]) => {
    const rule = PRICING_RULES[size as BagSize];
    if (rule && qty > 0) {
      totalInCents += (rule.pricePerDay * qty * billableDays * 100);
    }
  });

  if (totalInCents === 0) {
    return res.status(400).json({ error: 'No items selected' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Luggage Storage - ${billableDays} Day(s)`,
              description: `Storage for ${Object.entries(quantities).filter(([_, q]: [any, any]) => q > 0).map(([s, q]) => `${q}x ${s}`).join(', ')} from ${dropOffDate} to ${pickUpDate}`,
            },
            unit_amount: totalInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.SITE_URL}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/`,
      metadata: {
        customerName,
        customerPhone,
        dropOffDate,
        pickUpDate,
        quantities: JSON.stringify(quantities),
        billableDays: billableDays.toString(),
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
