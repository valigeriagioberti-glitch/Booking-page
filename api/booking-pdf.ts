
import Stripe from 'stripe';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const PRICING_RULES: Record<string, number> = {
  'Small': 5,
  'Medium': 6,
  'Large': 7
};

export default async function handler(req: any, res: any) {
  const { session_id, mode = 'download' } = req.query;

  if (!session_id) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(400).end('Session ID is required');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(404).end('Session not found');
    }

    if (session.payment_status !== 'paid') {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(403).end('Payment not confirmed');
    }

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

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Brand Colors
    const primaryGreen = rgb(6/255, 78/255, 59/255);
    const textGray = rgb(107/255, 114/255, 128/255);
    const borderGray = rgb(229/255, 231/255, 235/255);
    const lightGray = rgb(249/255, 250/255, 251/255);

    // Header
    page.drawRectangle({ x: 0, y: height - 100, width, height: 100, color: primaryGreen });
    page.drawText('LUGGAGE DEPOSIT ROME', { x: 40, y: height - 55, size: 18, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('BOOKING CONFIRMATION', { x: 40, y: height - 75, size: 10, font: fontBold, color: rgb(0.7, 0.9, 0.8) });

    // Reservation ID
    page.drawText('RESERVATION ID', { x: width - 210, y: height - 55, size: 8, font: fontBold, color: rgb(0.7, 0.9, 0.8) });
    page.drawText(session.id.substring(0, 24), { x: width - 210, y: height - 72, size: 9, font: fontRegular, color: rgb(1, 1, 1) });

    let cursorY = height - 150;

    // Customer Info
    page.drawText('CUSTOMER DETAILS', { x: 40, y: cursorY, size: 8, font: fontBold, color: textGray });
    cursorY -= 20;
    page.drawText(customerName, { x: 40, y: cursorY, size: 12, font: fontBold });
    cursorY -= 15;
    page.drawText(`${customerEmail} | ${customerPhone}`, { x: 40, y: cursorY, size: 10, font: fontRegular, color: textGray });

    cursorY -= 50;

    // Dates
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

    // Table
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

    // Footer
    page.drawText('Please show this PDF at check-in. Valid only with payment confirmation.', { x: 40, y: 40, size: 8, font: fontRegular, color: textGray });
    page.drawText('luggagedepositrome.com', { x: width - 140, y: 40, size: 8, font: fontBold, color: primaryGreen });

    const pdfBytes = await pdfDoc.save();

    const disposition = mode === 'print' ? 'inline' : 'attachment';

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="booking-confirmation.pdf"`,
      'Content-Length': pdfBytes.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff'
    });
    
    res.end(pdfBytes);

  } catch (err: any) {
    console.error('PDF Error:', err);
    res.setHeader('Content-Type', 'text/plain');
    res.status(500).end('Failed to generate PDF. Details: ' + err.message);
  }
}
