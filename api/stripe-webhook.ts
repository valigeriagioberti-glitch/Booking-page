import Stripe from 'stripe';
import { Resend } from 'resend';
import { Buffer } from 'buffer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import admin from 'firebase-admin';

// Initialize Firebase Admin (Singleton Guard)
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('[Firebase] Admin initialized successfully');
    } catch (e) {
      console.error('[Firebase] Initialization error:', e);
    }
  } else {
    console.warn('[Firebase] Credentials missing. Firestore writes will be skipped.');
  }
}

// Helper to access Firestore safely
const getDb = () => (admin.apps.length > 0 ? admin.firestore() : null);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const resend = new Resend(process.env.RESEND_API_KEY || '');

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

const PRICING_RULES: Record<string, number> = {
  'Small': 5,
  'Medium': 6,
  'Large': 7
};

async function generateBookingPdfBuffer(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  let quantities = {};
  try {
    quantities = JSON.parse(metadata.quantities || '{}');
  } catch (e) {
    console.error('Metadata parsing error:', e);
  }
  
  const billableDays = parseInt(metadata.billableDays || '1', 10);
  const totalPrice = (session.amount_total || 0) / 100;
  const customerName = metadata.customerName || 'Customer';
  const customerEmail = session.customer_details?.email || '';
  const customerPhone = metadata.customerPhone || '';
  const dropOffDate = metadata.dropOffDate || new Date().toISOString();
  const dropOffTime = metadata.dropOffTime || '09:00';
  const pickUpDate = metadata.pickUpDate || new Date().toISOString();
  const pickUpTime = metadata.pickUpTime || '18:00';
  const bookingRef = metadata.bookingRef || session.id.substring(session.id.length - 8).toUpperCase();

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); 
  const { width, height } = page.getSize();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const primaryGreen = rgb(6/255, 78/255, 59/255);
  const textGray = rgb(107/255, 114/255, 128/255);
  const borderGray = rgb(229/255, 231/255, 235/255);
  const lightGray = rgb(249/255, 250/255, 251/255);

  page.drawRectangle({ x: 0, y: height - 100, width, height: 100, color: primaryGreen });
  page.drawText('LUGGAGE DEPOSIT ROME', { x: 40, y: height - 55, size: 18, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('BOOKING CONFIRMATION', { x: 40, y: height - 75, size: 10, font: fontBold, color: rgb(0.7, 0.9, 0.8) });

  page.drawText('BOOKING REFERENCE', { x: width - 210, y: height - 55, size: 8, font: fontBold, color: rgb(0.7, 0.9, 0.8) });
  page.drawText(`#${bookingRef}`, { x: width - 210, y: height - 72, size: 12, font: fontBold, color: rgb(1, 1, 1) });

  let cursorY = height - 150;
  page.drawText('CUSTOMER DETAILS', { x: 40, y: cursorY, size: 8, font: fontBold, color: textGray });
  cursorY -= 20;
  page.drawText(customerName, { x: 40, y: cursorY, size: 12, font: fontBold });
  cursorY -= 15;
  page.drawText(`${customerEmail} | ${customerPhone}`, { x: 40, y: cursorY, size: 10, font: fontRegular, color: textGray });

  cursorY -= 50;
  page.drawText('STORAGE SCHEDULE', { x: 40, y: cursorY, size: 8, font: fontBold, color: textGray });
  page.drawText('LOCATION', { x: width / 2, y: cursorY, size: 8, font: fontBold, color: textGray });
  cursorY -= 20;
  page.drawText(`FROM: ${format(parseISO(dropOffDate), 'PPP')} @ ${dropOffTime}`, { x: 40, y: cursorY, size: 10, font: fontBold });
  page.drawText('Via Gioberti, 42', { x: width / 2, y: cursorY, size: 10, font: fontBold });
  cursorY -= 15;
  page.drawText(`UNTIL: ${format(parseISO(pickUpDate), 'PPP')} @ ${pickUpTime}`, { x: 40, y: cursorY, size: 10, font: fontBold });
  page.drawText('00185 Roma RM, Italy', { x: width / 2, y: cursorY, size: 10, font: fontRegular, color: textGray });
  cursorY -= 15;
  page.drawText(`DURATION: ${billableDays} Day(s)`, { x: 40, y: cursorY, size: 9, font: fontBold, color: primaryGreen });

  cursorY -= 60;
  page.drawText('ITEMIZED BREAKDOWN', { x: 40, y: cursorY, size: 8, font: fontBold, color: textGray });
  cursorY -= 15;
  page.drawRectangle({ x: 40, y: cursorY - 5, width: width - 80, height: 25, color: lightGray });
  page.drawText('DESCRIPTION', { x: 50, y: cursorY + 5, size: 8, font: fontBold, color: textGray });
  page.drawText('QTY', { x: width - 200, y: cursorY + 5, size: 8, font: fontBold, color: textGray });
  page.drawText('PRICE/DAY', { x: width - 140, y: cursorY + 5, size: 8, font: fontBold, color: textGray });
  page.drawText('SUBTOTAL', { x: width - 80, y: cursorY + 5, size: 8, font: fontBold, color: textGray });
  cursorY -= 30;

  Object.entries(quantities).forEach(([size, qty]: [any, any]) => {
    if (qty > 0) {
      const rate = PRICING_RULES[size] || 0;
      page.drawText(`Luggage Storage (${size})`, { x: 50, y: cursorY, size: 10, font: fontBold });
      page.drawText(qty.toString(), { x: width - 195, y: cursorY, size: 10, font: fontRegular });
      page.drawText(`€${rate.toFixed(2)}`, { x: width - 135, y: cursorY, size: 10, font: fontRegular });
      page.drawText(`€${(qty * rate).toFixed(2)}`, { x: width - 75, y: cursorY, size: 10, font: fontBold });
      cursorY -= 20;
      page.drawLine({ start: { x: 40, y: cursorY + 10 }, end: { x: width - 40, y: cursorY + 10 }, thickness: 0.5, color: borderGray });
    }
  });

  cursorY -= 20;
  const subtotalDaily = billableDays > 0 ? totalPrice / billableDays : 0;
  page.drawText('DAILY SUBTOTAL', { x: width - 200, y: cursorY, size: 9, font: fontBold, color: textGray });
  page.drawText(`€${subtotalDaily.toFixed(2)}`, { x: width - 80, y: cursorY, size: 10, font: fontBold });
  cursorY -= 15;
  page.drawText(`DURATION (DAYS)`, { x: width - 200, y: cursorY, size: 9, font: fontBold, color: textGray });
  page.drawText(`x ${billableDays}`, { x: width - 80, y: cursorY, size: 10, font: fontBold });

  cursorY -= 45;
  page.drawRectangle({ x: width - 220, y: cursorY - 15, width: 180, height: 45, color: primaryGreen });
  page.drawText('TOTAL PAID', { x: width - 210, y: cursorY + 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`€${totalPrice.toFixed(2)}`, { x: width - 210, y: cursorY - 5, size: 18, font: fontBold, color: rgb(1, 1, 1) });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const buf = await readRawBody(req);

  let event;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret || '');
  } catch (err: any) {
    console.error(`Webhook Signature Verification Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === 'paid') {
      await handleSuccessfulPayment(session);
    }
  }

  res.status(200).json({ received: true });
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const customerEmail = session.customer_details?.email;
  const customerName = metadata.customerName || '—';
  const customerPhone = metadata.customerPhone || '—';
  const dropOffDate = metadata.dropOffDate || '—';
  const dropOffTime = metadata.dropOffTime || '—';
  const pickUpDate = metadata.pickUpDate || '—';
  const pickUpTime = metadata.pickUpTime || '—';
  const billableDaysRaw = metadata.billableDays || '1';
  const siteUrl = metadata.siteUrl || 'https://booking.luggagedepositrome.com';
  
  let quantities: Record<string, number> = {};
  try {
    const raw = metadata.quantities || '{}';
    quantities = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse metadata.quantities:", metadata.quantities, e);
    quantities = {};
  }

  const totalPrice = (session.amount_total || 0) / 100;
  const bookingRef = metadata.bookingRef || session.id.substring(session.id.length - 8).toUpperCase();

  console.log("Processing successful payment for bookingRef", bookingRef, "session", session.id);

  // 1. Generate Check-in QR (Using bookingRef, NOT JWT)
  const scanUrl = `https://dashboard.luggagedepositrome.com/#/scan?ref=${encodeURIComponent(bookingRef)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(scanUrl)}&color=064e3b`;

  // 2. Firestore Sync (Isolated Task)
  const db = getDb();
  if (db) {
    try {
      const bookingData = {
        bookingRef,
        stripeSessionId: session.id,
        paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || '—',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        customer: {
          name: customerName,
          email: customerEmail || '—',
          phone: customerPhone,
        },
        dropOff: {
          date: dropOffDate,
          time: dropOffTime,
        },
        pickUp: {
          date: pickUpDate,
          time: pickUpTime,
        },
        billableDays: parseInt(String(billableDaysRaw), 10) || 1,
        bags: {
          small: quantities.Small || 0,
          medium: quantities.Medium || 0,
          large: quantities.Large || 0,
        },
        totalPaid: totalPrice,
        currency: session.currency?.toUpperCase() || 'EUR',
        status: "paid",
        notes: "",
        checkinUrl: scanUrl
      };

      await db.collection('bookings').doc(bookingRef).set(bookingData, { merge: true });
      console.log(`Firestore write success bookingRef=${bookingRef}`);
    } catch (err: any) {
      console.error(`Firestore write failed bookingRef=${bookingRef}`, err.message);
    }
  }

  // 3. Email Notification Task
  const walletUrl = `${siteUrl}/api/google-wallet?session_id=${session.id}`;
  const desktopRedirectUrl = `${siteUrl}/api/r?session_id=${session.id}`;
  const viewUrl = `${siteUrl}/#/success?session_id=${session.id}`;
  const pdfUrl = `${siteUrl}/api/booking-pdf?session_id=${session.id}&mode=download`;

  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateBookingPdfBuffer(session);
  } catch (err) {
    console.error('Failed to generate PDF for attachment:', err);
  }

  const commonStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: #111827;
  `;

  const formatEmailDate = (dateStr: string) => {
    if (!dateStr || dateStr === '—') return '—';
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  const formattedDropOffDate = formatEmailDate(dropOffDate);
  const formattedPickUpDate = formatEmailDate(pickUpDate);

  const renderOwnerBags = () => {
    return Object.entries(quantities)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([size, qty]) => {
        return `
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; color: #064e3b; font-size: 14px;">${size.toUpperCase()} (Bags)</span>
            <span style="background-color: #064e3b; color: #ffffff; width: 32px; height: 32px; border-radius: 16px; display: inline-block; line-height: 32px; text-align: center; font-weight: 900; font-size: 14px;">${qty}</span>
          </div>
        `;
      }).join('');
  };

  const renderCustomerLuggageCards = () => {
    return Object.entries(quantities)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([size, qty]) => {
        return `
          <div style="display: inline-block; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px 14px; margin: 0 8px 8px 0; min-width: 100px;">
            <span style="font-size: 16px; margin-right: 6px;">🧳</span>
            <span style="font-size: 12px; font-weight: 800; color: #111827; text-transform: uppercase;">${size} &times; ${qty}</span>
          </div>
        `;
      }).join('');
  };

  const qrSection = `
    <div style="margin: 24px 0; padding: 24px; border: 2px solid #064e3b; border-radius: 20px; text-align: center; background-color: #ffffff;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 800; color: #064e3b; text-transform: uppercase; letter-spacing: 0.05em;">Show this QR code at drop-off</h3>
      <p style="margin: 0 0 20px 0; font-size: 13px; color: #4b5563;">Our staff will scan this code to check you in quickly.</p>
      <div style="display: inline-block; padding: 12px; background-color: #f9fafb; border-radius: 16px; border: 1px solid #e5e7eb;">
        <img src="${qrUrl}" alt="Check-in QR Code" width="180" height="180" style="display: block; border: 0;" />
      </div>
    </div>
  `;

  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @media screen and (max-width: 480px) {
          .show-on-mobile { display: block !important; max-height: none !important; overflow: visible !important; mso-hide: none !important; }
          .hide-on-mobile { display: none !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb;">
      <div style="${commonStyles} background-color: #f9fafb; padding: 40px 16px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #064e3b; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Booking Confirmed!</h1>
            <p style="color: #a7f3d0; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; font-weight: 700;">Luggage Deposit Rome</p>
          </div>
          <div style="padding: 30px 24px;">
            <p style="font-size: 16px; margin: 0 0 8px 0;">Hi <strong>${customerName}</strong>,</p>
            <p style="color: #4b5563; font-size: 15px; margin: 0;">Your reservation is confirmed. We look forward to seeing you!</p>
            
            ${qrSection}

            <div style="margin: 24px 0; padding: 24px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 20px;">
              <div style="margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 15px;">
                <p style="margin: 0; font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Reference</p>
                <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #064e3b;">#${bookingRef}</p>
              </div>
              <h3 style="margin: 0 0 15px 0; font-size: 12px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 0.05em;">Storage Schedule</h3>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                <tr>
                  <td style="padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="36" valign="middle"><div style="width: 28px; height: 28px; background-color: #ecfdf5; border-radius: 14px; text-align: center; line-height: 28px; color: #059669; font-size: 14px;">↓</div></td>
                        <td valign="middle">
                          <span style="font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; display: block; line-height: 1;">FROM</span>
                          <span style="font-size: 14px; font-weight: 700; color: #111827;">${formattedDropOffDate}</span>
                        </td>
                        <td align="right" valign="middle"><span style="background-color: #064e3b; color: #ffffff; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: 800;">${dropOffTime}</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="36" valign="middle"><div style="width: 28px; height: 28px; background-color: #fff1f2; border-radius: 14px; text-align: center; line-height: 28px; color: #e11d48; font-size: 14px;">↑</div></td>
                        <td valign="middle">
                          <span style="font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; display: block; line-height: 1;">UNTIL</span>
                          <span style="font-size: 14px; font-weight: 700; color: #111827;">${formattedPickUpDate}</span>
                        </td>
                        <td align="right" valign="middle"><span style="background-color: #374151; color: #ffffff; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: 800;">${pickUpTime}</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div style="display: inline-block; background-color: #064e3b; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 24px;">${billableDaysRaw} ${billableDaysRaw === '1' ? 'DAY' : 'DAYS'}</div>
              <h3 style="margin: 0 0 12px 0; font-size: 11px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Luggage Details</h3>
              <div style="line-height: 1;">${renderCustomerLuggageCards()}</div>
              <div style="margin-top: 25px; padding-top: 20px; border-top: 2px dashed #e5e7eb; text-align: right;">
                <p style="margin: 0; font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Total Paid</p>
                <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: 900; color: #064e3b;">€${totalPrice.toFixed(2)}</p>
                <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 700; color: #059669;">✅ Payment Verified</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 32px;">
              <div class="hide-on-mobile" style="margin-bottom: 16px;">
                <p style="font-size: 13px; color: #6b7280; margin: 0;">
                  Want a Wallet pass? <a href="${desktopRedirectUrl}" style="color: #0f766e; text-decoration: underline; font-weight: 600;">Open the booking link</a> on mobile.
                </p>
              </div>

              <div class="show-on-mobile" style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
                <a href="${walletUrl}" style="text-decoration: none; display: block; width: 100%; max-width: 320px; margin: 0 auto;">
                  <img src="https://booking.luggagedepositrome.com/assets/google-wallet/add_to_google_wallet_black.png" alt="Add to Google Wallet" width="320" style="max-width: 100%; height: auto; display: block; border: 0;">
                </a>
              </div>
            </div>

            <div style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
              <h3 style="font-size: 13px; font-weight: 800; color: #111827; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.05em;">Where to find us:</h3>
              <p style="margin: 0; font-size: 15px; font-weight: 700;">Via Gioberti, 42</p>
              <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 14px;">00185 Roma RM, Italy (near Roma Termini)</p>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #064e3b; font-weight: 600;">Open Daily: 08:30 - 21:30</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const ownerHtml = `
    <div style="${commonStyles} background-color: #f3f4f6; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #064e3b; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em;">New Booking Received</h1>
          <p style="color: #a7f3d0; margin: 8px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; font-weight: 700;">Payment Confirmed via Stripe</p>
        </div>
        <div style="padding: 40px 30px;">
          <div style="background-color: #f9fafb; padding: 25px; border-radius: 20px; border: 1px solid #e5e7eb; margin-bottom: 30px;">
            <h3 style="margin: 0 0 20px 0; font-size: 14px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Booking Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Drop-off time</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 700;">${dropOffTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Pick-up time</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 700;">${pickUpTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Total Duration</td>
                <td style="padding: 8px 0; color: #064e3b; font-size: 14px; text-align: right; font-weight: 800;">${billableDaysRaw} Day(s)</td>
              </tr>
            </table>
            <div style="background-color: #064e3b; border-radius: 12px; padding: 16px; color: #ffffff; text-align: center; margin-bottom: 25px;">
              <p style="margin: 0; font-size: 14px; font-weight: 800;">Drop-off: ${formattedDropOffDate} – ${dropOffTime}</p>
              <p style="margin: 6px 0 0 0; font-size: 14px; font-weight: 800;">Pick-up: ${formattedPickUpDate} – ${pickUpTime}</p>
            </div>
            <h3 style="margin: 20px 0 15px 0; font-size: 12px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Luggage Breakdown</h3>
            ${renderOwnerBags()}
            <div style="margin-top: 25px; padding-top: 20px; border-top: 2px dashed #e5e7eb; text-align: right;">
              <p style="margin: 0; font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Total Paid</p>
              <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: 900; color: #064e3b;">€${totalPrice.toFixed(2)}</p>
              <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: 700; color: #059669;">✅ Payment Verified (Ref: #${bookingRef})</p>
            </div>
          </div>
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 12px; font-weight: 800; color: #9ca3af; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.05em;">Customer Details</h3>
            <div style="padding-left: 10px; border-left: 4px solid #064e3b;">
              <p style="margin: 0; font-size: 16px; font-weight: 800;">${customerName}</p>
              <p style="margin: 2px 0 0 0; font-size: 14px; color: #4b5563;">${customerEmail}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #064e3b;">${customerPhone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const attachments = pdfBuffer ? [{ filename: `booking-confirmation-${bookingRef}.pdf`, content: pdfBuffer }] : [];
    if (customerEmail) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: customerEmail,
        subject: `Booking Confirmed – Luggage Deposit Rome (Ref: #${bookingRef})`,
        html: customerHtml,
        attachments,
      });
    }
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: process.env.EMAIL_TO_OWNER || 'valigeriagioberti@gmail.com',
      subject: `New Paid Booking – Ref: #${bookingRef} (${customerName})`,
      html: ownerHtml,
      attachments,
    });
  } catch (error) {
    console.error('Error sending emails via Resend:', error);
  }
}