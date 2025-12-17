import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
    }

    // ✅ req is only used INSIDE the handler
    const origin = req.headers.origin || "https://example.com";

    const { lineItems, booking, customerEmail } = req.body || {};

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: "lineItems missing or empty" });
    }

    const filteredItems = lineItems.filter((item) => Number(item?.quantity) > 0);

    if (filteredItems.length === 0) {
      return res.status(400).json({ error: "All quantities are zero" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: filteredItems,
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=1`,
      customer_email: customerEmail || undefined,
      metadata: booking
        ? {
            bookingRef: booking.bookingRef || "",
            bookingId: booking.id || "",
            dropoff: booking.dropoffDate || "",
            pickup: booking.pickupDate || "",
          }
        : undefined,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}
