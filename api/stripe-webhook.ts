import Stripe from "stripe";
import { resend, FROM_EMAIL, ADMIN_EMAIL } from "../lib/email";
import { bookingConfirmationEmail } from "../emails/bookingConfirmation";


export const config = {
  api: { bodyParser: false }, // IMPORTANT: raw body needed
};

// ✅ FIX: remove apiVersion to avoid TS literal mismatch
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function buffer(readable: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const bookingRef = session.metadata?.bookingRef;
    const bookingId = session.metadata?.bookingId;

    // TODO: mark booking as PAID in DB using bookingId/bookingRef
    // await db.bookings.update({ where: { id: bookingId }, data: { status: "PAID", stripeSessionId: session.id } });
  }

  return res.json({ received: true });
}

