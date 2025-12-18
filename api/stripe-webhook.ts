
import Stripe from 'stripe';
import { Resend } from 'resend';
// Fix: Import Buffer to ensure it is available and not confused with the local function name
import { Buffer } from 'buffer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Webhook configuration to ensure we get the raw body needed for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Fix: Renamed function from 'buffer' to 'readRawBody' to avoid shadowing the global Buffer class
async function readRawBody(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    // Fix: Using Buffer.from which was previously causing a "Cannot find name 'Buffer'" error
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  // Fix: Using Buffer.concat which was previously causing a "Cannot find name 'Buffer'" error
  return Buffer.concat(chunks);
}

const PRICING_RULES: Record<string, number> = {
  'Small': 5,
  'Medium': 6,
  'Large': 7
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  // Fix: Call the renamed function to get the raw body
  const buf = await readRawBody(req);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error(`Webhook Signature Verification Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Failsafe check
    if (session.payment_status === 'paid') {
      await handleSuccessfulPayment(session);
    }
  }

  res.status(200).json({ received: true });
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const customerEmail = session.customer_details?.email;
  const customerName = metadata.customerName || 'Customer';
  const dropOffDate = metadata.dropOffDate;
  const pickUpDate = metadata.pickUpDate;
  const billableDays = metadata.billableDays;
  const siteUrl = metadata.siteUrl || 'https://luggagedepositrome.com';
  const quantities = JSON.parse(metadata.quantities || '{}');
  const totalPrice = (session.amount_total || 0) / 100;
  const bookingRef = session.id.substring(session.id.length - 8).toUpperCase();

  const pdfUrl = `${siteUrl}/api/booking-pdf?session_id=${session.id}&mode=download`;

  const bagListItems = Object.entries(quantities)
    .filter(([_, qty]) => (qty as number) > 0)
    .map(([size, qty]) => `<li><strong>${qty}x</strong> ${size} Bag(s)</li>`)
    .join('');

  const emailStyle = `
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    line-height: 1.6;
  `;

  // --- CUSTOMER EMAIL ---
  const customerHtml = `
    <div style="${emailStyle} max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #064e3b; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Booking Confirmed!</h1>
        <p style="color: #a7f3d0; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 2px; font-size: 10px; font-weight: bold;">Luggage Deposit Rome</p>
      </div>
      <div style="padding: 40px;">
        <p>Hi ${customerName},</p>
        <p>Your luggage storage reservation has been confirmed. Below are your booking details:</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 5px 0; font-size: 12px; color: #6b7280;">REFERENCE</td><td style="padding: 5px 0; text-align: right; font-weight: bold;">#${bookingRef}</td></tr>
            <tr><td style="padding: 5px 0; font-size: 12px; color: #6b7280;">DROP-OFF</td><td style="padding: 5px 0; text-align: right; font-weight: bold;">${dropOffDate}</td></tr>
            <tr><td style="padding: 5px 0; font-size: 12px; color: #6b7280;">PICK-UP</td><td style="padding: 5px 0; text-align: right; font-weight: bold;">${pickUpDate}</td></tr>
            <tr><td style="padding: 5px 0; font-size: 12px; color: #6b7280;">DURATION</td><td style="padding: 5px 0; text-align: right; font-weight: bold;">${billableDays} Day(s)</td></tr>
          </table>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">ITEMS:</p>
          <ul style="margin: 0; padding-left: 18px; font-size: 14px;">${bagListItems}</ul>
          <p style="text-align: right; font-size: 20px; font-weight: bold; margin-top: 15px;">Total Paid: €${totalPrice.toFixed(2)}</p>
        </div>

        <h3 style="font-size: 16px; margin-bottom: 10px;">Drop-off Point:</h3>
        <p style="margin: 0; font-weight: bold;">Via Gioberti, 42</p>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">00185 Roma RM, Italy (Near Termini Station)</p>
        <p style="margin: 10px 0 0 0; font-size: 13px; font-style: italic;">Opening Hours: 09:00 - 19:00 Daily</p>

        <div style="margin-top: 40px; text-align: center;">
          <a href="${pdfUrl}" style="background-color: #064e3b; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Download PDF Confirmation</a>
        </div>
      </div>
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
        <p style="margin: 0;">&copy; Luggage Deposit Rome &bull; luggagedepositrome.com</p>
      </div>
    </div>
  `;

  // --- OWNER EMAIL ---
  const ownerHtml = `
    <div style="${emailStyle}">
      <h2>New Paid Booking Received!</h2>
      <p>A new luggage storage booking has been completed.</p>
      <ul>
        <li><strong>Customer:</strong> ${customerName}</li>
        <li><strong>Email:</strong> ${customerEmail}</li>
        <li><strong>Phone:</strong> ${metadata.customerPhone}</li>
        <li><strong>Dates:</strong> ${dropOffDate} to ${pickUpDate}</li>
        <li><strong>Duration:</strong> ${billableDays} days</li>
        <li><strong>Amount Paid:</strong> €${totalPrice.toFixed(2)}</li>
      </ul>
      <p>Items booked:</p>
      <ul>${bagListItems}</ul>
      <p><a href="${pdfUrl}">Click here to view/download the PDF receipt</a></p>
    </div>
  `;

  try {
    // Send to Customer
    if (customerEmail) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: customerEmail,
        subject: `Booking Confirmed – Luggage Deposit Rome (Ref: #${bookingRef})`,
        html: customerHtml,
      });
    }

    // Send to Owner
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: process.env.EMAIL_TO_OWNER || 'valigeriagioberti@gmail.com',
      subject: `New Paid Booking – Ref: #${bookingRef} (${customerName})`,
      html: ownerHtml,
    });

    console.log(`Emails successfully sent for session ${session.id}`);
  } catch (error) {
    console.error('Error sending emails via Resend:', error);
  }
}
