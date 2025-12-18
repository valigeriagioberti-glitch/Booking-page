
import Stripe from 'stripe';
import { Resend } from 'resend';
import { Buffer } from 'buffer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';

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

const PRICING_RULES: Record<string, number> = {
  'Small': 5,
  'Medium': 6,
  'Large': 7
};

// Helper to generate PDF Buffer for attachments
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
  const pickUpDate = metadata.pickUpDate || new Date().toISOString();

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

  page.drawText('RESERVATION ID', { x: width - 210, y: height - 55, size: 8, font: fontBold, color: rgb(0.7, 0.9, 0.8) });
  page.drawText(session.id.substring(0, 24), { x: width - 210, y: height - 72, size: 9, font: fontRegular, color: rgb(1, 1, 1) });

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
  page.drawText(`FROM: ${format(parseISO(dropOffDate), 'PPP')}`, { x: 40, y: cursorY, size: 10, font: fontBold });
  page.drawText('Via Gioberti, 42', { x: width / 2, y: cursorY, size: 10, font: fontBold });
  cursorY -= 15;
  page.drawText(`UNTIL: ${format(parseISO(pickUpDate), 'PPP')}`, { x: 40, y: cursorY, size: 10, font: fontBold });
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

  page.drawText('Please show this PDF at check-in. Valid only with payment confirmation.', { x: 40, y: 40, size: 8, font: fontRegular, color: textGray });
  page.drawText('luggagedepositrome.com', { x: width - 140, y: 40, size: 8, font: fontBold, color: primaryGreen });

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

  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateBookingPdfBuffer(session);
  } catch (err) {
    console.error('Failed to generate PDF for attachment:', err);
  }

  const bagListRows = Object.entries(quantities)
    .filter(([_, qty]) => (qty as number) > 0)
    .map(([size, qty]) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #4b5563; font-size: 14px;">Luggage Storage (${size})</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; text-align: right; font-weight: bold;">x ${qty}</td>
      </tr>
    `).join('');

  const commonStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: #111827;
  `;

  const customerHtml = `
    <div style="${commonStyles} background-color: #f9fafb; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #064e3b; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Booking Confirmed!</h1>
          <p style="color: #a7f3d0; margin: 8px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; font-weight: 700;">Luggage Deposit Rome</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; margin-top: 0;">Hi <strong>${customerName}</strong>,</p>
          <p style="color: #4b5563; font-size: 15px;">Your luggage storage has been successfully reserved. We look forward to seeing you in Rome!</p>
          
          <div style="margin: 30px 0; padding: 25px; background-color: #fdfdfd; border: 1px solid #f3f4f6; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
              <div>
                <p style="margin: 0; font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Reference</p>
                <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #064e3b;">#${bookingRef}</p>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Drop-off</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${dropOffDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Pick-up</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px; text-align: right; font-weight: 600;">${pickUpDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Duration</td>
                <td style="padding: 8px 0; color: #064e3b; font-size: 13px; text-align: right; font-weight: 800;">${billableDays} Day(s)</td>
              </tr>
            </table>

            <div style="margin: 20px 0; border-top: 2px dashed #f3f4f6;"></div>
            
            <table style="width: 100%; border-collapse: collapse;">
              ${bagListRows}
              <tr>
                <td style="padding: 20px 0 0 0; color: #064e3b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Total Paid</td>
                <td style="padding: 20px 0 0 0; color: #111827; font-size: 24px; font-weight: 900; text-align: right;">€${totalPrice.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Where to find us:</h3>
            <p style="margin: 0; font-size: 15px; font-weight: 700;">Via Gioberti, 42</p>
            <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 14px;">00185 Roma RM, Italy (near Roma Termini)</p>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: #064e3b; font-weight: 600;">Open Daily: 09:00 - 19:00</p>
          </div>

          <div style="text-align: center; margin-top: 40px;">
            <a href="${pdfUrl}" style="background-color: #064e3b; color: #ffffff; padding: 18px 32px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(6, 78, 59, 0.2);">Download Confirmation PDF</a>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">A copy of your confirmation is also attached to this email.</p>
          </div>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 30px; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">&copy; Luggage Deposit Rome &bull; luggagedepositrome.com</p>
        </div>
      </div>
    </div>
  `;

  const ownerHtml = `
    <div style="${commonStyles} padding: 20px;">
      <h2 style="color: #064e3b; font-weight: 900;">New Paid Booking!</h2>
      <div style="background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Phone:</strong> ${metadata.customerPhone}</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;">
        <p><strong>Ref:</strong> #${bookingRef}</p>
        <p><strong>Dates:</strong> ${dropOffDate} to ${pickUpDate}</p>
        <p><strong>Duration:</strong> ${billableDays} days</p>
        <p><strong>Paid:</strong> €${totalPrice.toFixed(2)}</p>
      </div>
      <p style="margin-top: 20px;"><a href="${pdfUrl}">View PDF</a></p>
    </div>
  `;

  try {
    const attachments = pdfBuffer ? [
      {
        filename: `booking-confirmation-${bookingRef}.pdf`,
        content: pdfBuffer,
      }
    ] : [];

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

    console.log(`Emails successfully sent for session ${session.id} with PDF attachment.`);
  } catch (error) {
    console.error('Error sending emails via Resend:', error);
  }
}
