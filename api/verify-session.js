import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    const err = new Error('Missing STRIPE_SECRET_KEY environment variable');
    // @ts-ignore
    err.statusCode = 500;
    throw err;
  }
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

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
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Missing session ID' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const bagQuantities = session.metadata.bagQuantities 
        ? JSON.parse(session.metadata.bagQuantities) 
        : {};

      const verifiedBooking = {
        verified: true,
        id: session.metadata.bookingId,
        customerEmail: session.customer_details.email,
        customerName: session.customer_details.name || 'Valued Customer',
        amountTotal: session.amount_total / 100,
        dropOffDate: session.metadata.dropOffDate,
        pickUpDate: session.metadata.pickUpDate,
        bagQuantities: bagQuantities,
        billableDays: calculateBillableDays(session.metadata.dropOffDate, session.metadata.pickUpDate)
      };

      res.status(200).json(verifiedBooking);
    } else {
      res.status(200).json({ verified: false });
    }
  } catch (error) {
    console.error('Verify Session Error:', error);
    const status = error?.statusCode || 500;
    res.status(status).json({ error: error?.message || 'Internal Server Error' });
  }
}