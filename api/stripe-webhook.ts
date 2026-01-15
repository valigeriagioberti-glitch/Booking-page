import Stripe from 'stripe';
import { Resend } from 'resend';
import { Buffer } from 'buffer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import * as admin from 'firebase-admin';

// 1. Initialize Firebase Admin (Singleton Pattern)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Ensure private key handles newlines correctly from environment variables
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[FIREBASE] Admin SDK Initialized successfully.');
  } catch (e) {
    console.error('[FIREBASE] Initialization error:', e);
  }
}

const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});
const resend = new Resend(process.env.RESEND_API_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Helper to safely parse the quantities JSON string from Stripe metadata
 */
function safeParseQuantities(jsonString: string | undefined) {
  const defaultQty = { Small: 0, Medium: 0, Large: 0 };
  if (!jsonString) return defaultQty;
  try {
    return { ...defaultQty, ...JSON.parse(jsonString) };
  } catch (e) {
    console.error('[WEBHOOK] Quantities JSON parse failed:', jsonString);
    return defaultQty;
  }
}

/**
 * STEP 2: Write booking to Firestore for Admin Dashboard
 */
async function saveBookingToFirestore(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const bookingRef = metadata.bookingRef || session.id.substring(session.id.length - 8).toUpperCase();
  const quantities = safeParseQuantities(metadata.quantities);

  // Construct document strictly following dashboard schema
  const bookingData = {
    bookingRef,
    stripeSessionId: session.id,
    paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || '—',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    customer: {
      name: metadata.customerName || '—',
      email: session.customer_details?.email || '—',
      phone: metadata.customerPhone || '—',
    },
    dropOff: {
      date: metadata.dropOffDate || '—',
      time: metadata.dropOffTime || '—',
    },
    pickUp: {
      date: metadata.pickUpDate || '—',
      time: metadata.pickUpTime || '—',
    },
    billableDays: parseInt(metadata.billableDays || '1', 10),
    bags: {
      small: quantities.Small || 0,
      medium: quantities.Medium || 0,
      large: quantities.Large || 0,
    },
    totalPaid: (session.amount_total || 0) / 100,
    currency: session.currency?.toUpperCase() || 'EUR',
    status: 'paid',
    notes: '',
  };

  try {
    // Write to "bookings" collection using bookingRef as ID
    // { merge: true } ensures safety on Stripe retries
    await db.collection('bookings').doc(bookingRef).set(bookingData, { merge: true });
    console.log(`[FIRESTORE] Sync Success: Booking #${bookingRef}`);
  } catch (error) {
    console.error(`[FIRESTORE] Sync Failure for #${bookingRef}:`, error);
    // We do NOT throw here so that email sending can still proceed
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const buf = await readRawBody(req);
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error(`[WEBHOOK] Sig verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[WEBHOOK] Received event: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.payment_status === 'paid') {
      const bookingRef = session.metadata?.bookingRef || 'UNKNOWN';
      console.log(`[WEBHOOK] Processing paid session: ${session.id} (Ref: ${bookingRef})`);

      // Execute Firestore sync and Email notifications in parallel but independently caught
      await Promise.allSettled([
        saveBookingToFirestore(session),
        handleSuccessfulPayment(session)
      ]);
    }
  }

  // Always return 200 to Stripe after signature is verified
  res.status(200).json({ received: true });
}

// ... helper logic for handleSuccessfulPayment and PDF generation remains robust and unchanged ...

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const customerEmail = session.customer_details?.email;
  const bookingRef = metadata.bookingRef || session.id.substring(session.id.length - 8).toUpperCase();

  try {
    // Generate PDF Buffer
    const pdfBuffer = await generateBookingPdfBuffer(session).catch(err => {
      console.error('[EMAIL] PDF generation failed:', err);
      return null;
    });

    const attachments = pdfBuffer ? [{ filename: `booking-${bookingRef}.pdf`, content: pdfBuffer }] : [];
    
    // Send Customer Email
    if (customerEmail) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: customerEmail,
        subject: `Booking Confirmed: Luggage Deposit Rome (#${bookingRef})`,
        html: `<h1>Booking Confirmed</h1><p>Your reference is #${bookingRef}. See attached PDF for details.</p>`,
        attachments
      });
      console.log(`[EMAIL] Customer notification sent to ${customerEmail}`);
    }

    // Send Owner Email
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: process.env.EMAIL_TO_OWNER || 'valigeriagioberti@gmail.com',
      subject: `New Paid Booking (#${bookingRef})`,
      html: `<p>New booking for ${metadata.customerName || 'Customer'}. Reference: #${bookingRef}</p>`,
      attachments
    });
    console.log(`[EMAIL] Owner notification sent.`);

  } catch (err) {
    console.error('[EMAIL] Resend service failure:', err);
  }
}

async function generateBookingPdfBuffer(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const quantities = safeParseQuantities(metadata.quantities);
  const bookingRef = metadata.bookingRef || session.id.substring(session.id.length - 8).toUpperCase();
  const customerName = metadata.customerName || 'Customer';
  const totalPrice = (session.amount_total || 0) / 100;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText('LUGGAGE DEPOSIT ROME', { x: 50, y: 780, size: 20, font: fontBold });
  page.drawText(`Booking Reference: #${bookingRef}`, { x: 50, y: 750, size: 12, font: fontBold });
  page.drawText(`Customer: ${customerName}`, { x: 50, y: 730, size: 10, font: fontRegular });
  page.drawText(`Total Paid: €${totalPrice.toFixed(2)}`, { x: 50, y: 710, size: 10, font: fontBold });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}