
import Stripe from 'stripe';
import { BagSize } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export default async function handler(req: any, res: any) {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const metadata = session.metadata || {};
      const quantities = JSON.parse(metadata.quantities || '{}');
      
      const booking = {
        quantities,
        dropOffDate: metadata.dropOffDate,
        pickUpDate: metadata.pickUpDate,
        customerName: metadata.customerName,
        customerEmail: session.customer_details?.email,
        customerPhone: metadata.customerPhone,
        billableDays: parseInt(metadata.billableDays || '1'),
        totalPrice: (session.amount_total || 0) / 100,
        perDaySubtotal: ((session.amount_total || 0) / 100) / parseInt(metadata.billableDays || '1'),
        stripePaymentId: session.id,
        status: 'success',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json({ status: 'paid', booking });
    } else {
      res.status(200).json({ status: 'unpaid' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
