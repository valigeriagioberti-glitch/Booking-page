
import Stripe from 'stripe';
import { differenceInDays, isValid, isBefore } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { startOfDay } from 'date-fns/startOfDay';

const PRICING_RULES: Record<string, number> = {
  'Small': 5,
  'Medium': 6,
  'Large': 7
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    quantities, 
    dropOffDate, 
    dropOffTime,
    pickUpDate, 
    pickUpTime,
    customerName, 
    customerEmail, 
    customerPhone 
  } = req.body;

  try {
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const siteUrl = `${protocol}://${host}`;

    if (!customerEmail || !customerName || !dropOffDate || !pickUpDate) {
      return res.status(400).json({ error: 'Missing required customer information' });
    }

    const start = startOfDay(parseISO(dropOffDate));
    const end = startOfDay(parseISO(pickUpDate));
    
    if (!isValid(start) || !isValid(end) || isBefore(end, start)) {
      return res.status(400).json({ error: 'Invalid storage dates selected' });
    }
    
    const billableDays = differenceInDays(end, start) + 1;

    let totalInCents = 0;
    const bagDetails: string[] = [];

    Object.entries(quantities).forEach(([size, qty]: [string, any]) => {
      const pricePerDay = PRICING_RULES[size];
      if (pricePerDay && qty > 0) {
        totalInCents += (pricePerDay * qty * billableDays * 100);
        bagDetails.push(`${qty}x ${size}`);
      }
    });

    if (totalInCents === 0) {
      return res.status(400).json({ error: 'No bags selected for storage' });
    }

    // Generate shared booking reference
    const bookingRef = Math.random().toString(36).substring(2, 10).toUpperCase();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Luggage Storage - ${billableDays} Day(s)`,
              description: `Storage for ${bagDetails.join(', ')} from ${dropOffDate} ${dropOffTime} to ${pickUpDate} ${pickUpTime}`,
            },
            unit_amount: totalInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${siteUrl}/#/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/#/`,
      metadata: {
        bookingRef, // Store the generated ref
        customerName,
        customerPhone,
        dropOffDate,
        dropOffTime,
        pickUpDate,
        pickUpTime,
        quantities: JSON.stringify(quantities),
        billableDays: billableDays.toString(),
        siteUrl
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Session Error:', err);
    return res.status(500).json({ 
      error: 'Failed to create payment session', 
      message: err.message 
    });
  }
}