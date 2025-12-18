
import Stripe from 'stripe';
import { differenceInDays, isValid, isBefore } from 'date-fns';
// Fix missing exported member by importing from specific subpath
import { parseISO } from 'date-fns/parseISO';
// Fix missing exported member by importing from specific subpath
import { startOfDay } from 'date-fns/startOfDay';

// Source of truth for pricing - mirrored from frontend but self-contained
const PRICING_RULES: Record<string, number> = {
  'Small': 5,
  'Medium': 6,
  'Large': 7
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    quantities, 
    dropOffDate, 
    pickUpDate, 
    customerName, 
    customerEmail, 
    customerPhone 
  } = req.body;

  try {
    // 1. Validate Input
    if (!customerEmail || !customerName || !dropOffDate || !pickUpDate) {
      return res.status(400).json({ error: 'Missing required customer information' });
    }

    // 2. Calculate Billable Days (Calendar days: (End - Start) + 1)
    const start = startOfDay(parseISO(dropOffDate));
    const end = startOfDay(parseISO(pickUpDate));
    
    if (!isValid(start) || !isValid(end) || isBefore(end, start)) {
      return res.status(400).json({ error: 'Invalid storage dates selected' });
    }
    
    const billableDays = differenceInDays(end, start) + 1;

    // 3. Calculate Total and Build Description
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

    // 4. Create Stripe Checkout Session
    // App.tsx uses URLSearchParams(window.location.search), so we redirect to root with query param
    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Luggage Storage - ${billableDays} Day(s)`,
              description: `Storage for ${bagDetails.join(', ')} from ${dropOffDate} to ${pickUpDate}`,
            },
            unit_amount: totalInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${siteUrl}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/`,
      metadata: {
        customerName,
        customerPhone,
        dropOffDate,
        pickUpDate,
        quantities: JSON.stringify(quantities),
        billableDays: billableDays.toString(),
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
