import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    const err = new Error('Missing STRIPE_SECRET_KEY environment variable');
    // @ts-ignore
    err.statusCode = 500;
    throw err;
  }

  // Set an explicit apiVersion for stability across Stripe SDK updates.
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

const PRICES = {
  'Small': 500, // 5.00 EUR
  'Medium': 600, // 6.00 EUR
  'Large': 700  // 7.00 EUR
};

const calculateBillableDays = (start, end) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  
  if (endDate < startDate) return 0;
  
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays + 1;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const stripe = getStripe();

    const { bagQuantities, dropOffDate, pickUpDate, customerEmail, customerName, customerPhone, bookingId } = req.body;
    
    // Ensure no trailing slash on clientUrl
    const origin = process.env.CLIENT_URL || req.headers.origin || 'https://luggagedepositrome.com';
    const clientUrl = origin.replace(/\/$/, '');

    // 1. Validate Inputs
    if (!bagQuantities || typeof bagQuantities !== 'object') {
      return res.status(400).json({ error: 'Invalid bag quantities' });
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (!bookingId) {
      return res.status(400).json({ error: 'Missing booking ID' });
    }

    // 2. Calculate Days Server-Side
    const days = calculateBillableDays(dropOffDate, pickUpDate);
    if (days <= 0) {
      return res.status(400).json({ error: 'Invalid date range' });
    }

    // 3. Construct Line Items & Validate Price
    const line_items = [];
    const description = `Booking ${bookingId} (${days} days)`;
    const validSizes = ['Small', 'Medium', 'Large'];

    for (const [size, qty] of Object.entries(bagQuantities)) {
      if (!validSizes.includes(size)) {
         return res.status(400).json({ error: `Invalid bag size: ${size}` });
      }
      
      const quantityInt = parseInt(qty, 10);
      
      if (isNaN(quantityInt) || quantityInt < 0 || quantityInt > 50) {
        return res.status(400).json({ error: `Invalid quantity for ${size}` });
      }

      if (quantityInt > 0) {
        // Safe Price lookup
        const unitAmountCents = PRICES[size] * days;

        line_items.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${size} Luggage Storage (${days} days)`,
              description: description,
            },
            unit_amount: unitAmountCents,
          },
          quantity: quantityInt,
        });
      }
    }

    if (line_items.length === 0) {
      return res.status(400).json({ error: 'Please select at least one bag' });
    }

    // 4. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: line_items,
      mode: 'payment',
      // CRITICAL: Path parameter for session ID
      success_url: `${clientUrl}/#/success/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/#/cancel`,
      metadata: {
        bookingId,
        dropOffDate,
        pickUpDate,
        customerEmail,
        customerName: customerName || '',
        customerPhone: customerPhone || '',
        bagQuantities: JSON.stringify(bagQuantities)
      }
    });

    res.status(200).json({ url: session.url });

  } catch (error) {
    const status = error?.statusCode || 500;
    console.error('Stripe Create Session Error:', error);
    // Return a helpful message so the frontend can show the real cause.
    res.status(status).json({ error: error?.message || 'Internal Server Error' });
  }
}