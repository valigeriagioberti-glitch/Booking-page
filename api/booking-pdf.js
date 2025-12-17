import Stripe from 'stripe';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { json, assertEnv } from './_utils.js';

function safeJsonParse(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

function fmtDateTime() {
  return new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  try {
    const STRIPE_SECRET_KEY = assertEnv('STRIPE_SECRET_KEY');
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

    const sessionId = String(req.query.sessionId || '').trim();
    if (!sessionId) return json(res, 400, { error: 'Missing sessionId' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') return json(res, 400, { error: 'Payment not verified' });

    const md = session.metadata || {};
    const bookingId = md.bookingId || 'unknown';
    const dropOffDate = md.dropOffDate || '';
    const pickUpDate = md.pickUpDate || '';
    const days = md.days || '';
    const bagQuantities = safeJsonParse(md.bagQuantities || '{}', { Small: 0, Medium: 0, Large: 0 });

    const amountTotal = session.amount_total || 0;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 48;
    let y = height - margin;

    const drawText = (text, size = 12, bold = false, color = rgb(0.06, 0.09, 0.16)) => {
      page.drawText(String(text), { x: margin, y, size, font: bold ? fontBold : font, color });
      y -= size + 10;
    };

    drawText('Luggage Deposit Rome', 18, true);
    drawText('Booking Confirmation', 14, true, rgb(0.07, 0.45, 0.30));
    y -= 6;

    drawText(`Booking ID: ${bookingId}`, 12, true);
    drawText(`Drop-off: ${dropOffDate}`);
    drawText(`Pick-up: ${pickUpDate}`);
    drawText(`Billable days: ${days}`);
    drawText(`Bags: Small ${bagQuantities.Small || 0}, Medium ${bagQuantities.Medium || 0}, Large ${bagQuantities.Large || 0}`);
    drawText(`Total paid: €${(amountTotal / 100).toFixed(2)}`, 12, true);
    drawText(`Payment status: ${session.payment_status}`);
    drawText(`Issued: ${fmtDateTime()}`, 11, false, rgb(0.28, 0.33, 0.40));

    const bytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="booking-${bookingId}.pdf"`);
    res.statusCode = 200;
    res.end(Buffer.from(bytes));
  } catch (e) {
    return json(res, 500, { error: e?.message || 'Server error' });
  }
}
