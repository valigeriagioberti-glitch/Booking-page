const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Disable Vercel's default body parsing to handle the raw stream for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Log success (In a real app with a DB, you would update the order status here)
    console.log(`✅ [Webhook] Booking Paid: ${session.metadata.bookingId}`);
    console.log(`   Email: ${session.customer_details.email}`);
    console.log(`   Amount: ${session.amount_total / 100} ${session.currency.toUpperCase()}`);
    console.log(`   Dates: ${session.metadata.dropOffDate} to ${session.metadata.pickUpDate}`);
  }

  res.status(200).json({ received: true });
}