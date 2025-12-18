
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export default async function handler(req: any, res: any) {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const metadata = session.metadata || {};
      const quantities = JSON.parse(metadata.quantities || '{}');
      const billableDays = parseInt(metadata.billableDays || '1');
      const totalPrice = (session.amount_total || 0) / 100;

      const booking = {
        quantities,
        dropOffDate: metadata.dropOffDate,
        dropOffTime: metadata.dropOffTime,
        pickUpDate: metadata.pickUpDate,
        pickUpTime: metadata.pickUpTime,
        customerName: metadata.customerName,
        customerEmail: session.customer_details?.email,
        customerPhone: metadata.customerPhone,
        billableDays: billableDays,
        totalPrice: totalPrice,
        perDaySubtotal: totalPrice / billableDays,
        stripePaymentId: session.id,
        status: 'success',
        timestamp: new Date().toISOString(),
      };

      return res.status(200).json({ status: 'paid', booking });
    } else {
      return res.status(200).json({ status: 'unpaid' });
    }
  } catch (err: any) {
    console.error('Stripe Verification Error:', err);
    return res.status(500).json({ error: 'Payment verification failed', message: err.message });
  }
}
