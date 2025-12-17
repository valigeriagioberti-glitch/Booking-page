import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
        // Prefer metadata details as they match the form, fallback to Stripe customer details
        customerEmail: session.metadata.customerEmail || session.customer_details.email,
        customerName: session.metadata.customerName || session.customer_details.name || 'Valued Customer',
        customerPhone: session.metadata.customerPhone || '',
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
    res.status(500).json({ error: error.message });
  }
}