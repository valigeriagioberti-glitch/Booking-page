import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

/**
 * Gets a Google OAuth2 Access Token using the Service Account credentials.
 */
async function getGoogleAccessToken(email: string, key: string) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
    aud: 'https://oauth2.googleapis.com/token',
    iat,
    exp,
  };

  const token = jwt.sign(payload, key, { algorithm: 'RS256' });
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Google Auth Error: ${data.error_description || data.error || 'Unknown error'}`);
  }
  return data.access_token;
}

export default async function handler(req: any, res: any) {
  let bookingId, bookingReference, small, medium, large, dropOffDate, pickUpDate, customerEmail;

  try {
    if (req.method === 'GET') {
      const { session_id } = req.query;
      if (!session_id) return res.status(400).json({ error: 'session_id is required' });

      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status !== 'paid') {
        return res.status(403).json({ error: 'Payment not confirmed' });
      }

      const metadata = session.metadata || {};
      const quantities = JSON.parse(metadata.quantities || '{}');
      
      bookingId = session.id;
      bookingReference = session.id.substring(session.id.length - 8).toUpperCase();
      small = quantities.Small || 0;
      medium = quantities.Medium || 0;
      large = quantities.Large || 0;
      dropOffDate = metadata.dropOffDate;
      pickUpDate = metadata.pickUpDate;
      customerEmail = session.customer_details?.email;
    } else if (req.method === 'POST') {
      ({ 
        bookingId, 
        bookingReference,
        small, 
        medium, 
        large, 
        dropOffDate, 
        pickUpDate, 
        customerEmail 
      } = req.body);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required.' });
    }

    const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
    const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
    const PRIVATE_KEY = process.env.GOOGLE_WALLET_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!ISSUER_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
      return res.status(500).json({ error: 'Google Wallet configuration missing.' });
    }

    // 1. Authenticate with Google
    const accessToken = await getGoogleAccessToken(SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY);

    // 2. Prepare Luggage Summary and Date Formatting
    const luggageParts = [];
    if (small > 0) luggageParts.push(`S:${small}`);
    if (medium > 0) luggageParts.push(`M:${medium}`);
    if (large > 0) luggageParts.push(`L:${large}`);
    const bagsSummary = luggageParts.join(' ') || 'No bags';

    const formatDate = (dateStr: string) => {
      if (!dateStr || dateStr === '—') return '—';
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    const dropDateFormatted = formatDate(dropOffDate);
    const pickDateFormatted = formatDate(pickUpDate);

    // 3. Define Object Identity (Deterministic based on bookingId/session_id)
    const safeBookingId = bookingId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const objectId = `${ISSUER_ID}.${safeBookingId}`;
    const objectIdEncoded = encodeURIComponent(objectId);
    const classId = `${ISSUER_ID}.luggage_deposit_rome_booking`;

    // 4. Construct the Generic Object
    const refToShow = bookingReference || (bookingId.length >= 8 ? bookingId.substring(bookingId.length - 8).toUpperCase() : bookingId.toUpperCase());
    
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const qrRedirectUrl = `${protocol}://${host}/api/r?session_id=${encodeURIComponent(bookingId)}`;
    const luggageSubheader = `Luggage: S×${small || 0} · M×${medium || 0} · L×${large || 0}`;

    const genericObject = {
      id: objectId,
      classId: classId,
      genericType: 'GENERIC_TYPE_UNSPECIFIED',
      state: 'ACTIVE',
      cardTitle: { defaultValue: { language: 'en', value: 'LUGGAGE DEPOSIT ROME' } },
      header: { defaultValue: { language: 'en', value: `${dropDateFormatted} → ${pickDateFormatted}` } },
      subheader: { defaultValue: { language: 'en', value: luggageSubheader } },
      logo: {
        sourceUri: {
          uri: 'https://cdn.shopify.com/s/files/1/0753/8144/0861/files/cropped-Untitled-design-2025-09-11T094640.576_1.png?v=1765462614'
        }
      },
      hexBackgroundColor: '#064e3b',
      barcode: {
        type: 'QR_CODE',
        value: qrRedirectUrl,
        alternateText: `Ref: ${refToShow}`
      },
      textModulesData: [
        { header: 'Booking Ref', body: refToShow, id: 'booking_id' },
        { header: 'Drop-off', body: dropOffDate || '—', id: 'drop_off' },
        { header: 'Pick-up', body: pickUpDate || '—', id: 'pick_up' },
        { header: 'Luggage', body: bagsSummary, id: 'bags' }
      ],
      linksModuleData: {
        uris: [
          { uri: 'https://maps.app.goo.gl/HxdE3NVp8KmcVcjt8', description: 'V. Gioberti, 42, Rome' },
          { uri: 'tel:+39064467843', description: 'Call Support' }
        ]
      }
    };

    // 5. Check if object exists, then Create or Patch
    const getUrl = `https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectIdEncoded}`;
    const getResponse = await fetch(getUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (getResponse.ok) {
      const mask = 'barcode,textModulesData,linksModuleData,cardTitle,header,subheader,hexBackgroundColor,logo,state';
      const patchUrl = `${getUrl}?updateMask=${mask}`;
      await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(genericObject)
      });
    } else if (getResponse.status === 404) {
      const postUrl = `https://walletobjects.googleapis.com/walletobjects/v1/genericObject`;
      await fetch(postUrl, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(genericObject)
      });
    }

    // 6. Generate the signed Save-to-Wallet JWT
    const claims = {
      iss: SERVICE_ACCOUNT_EMAIL,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      payload: {
        genericObjects: [{ id: objectId }]
      }
    };

    const token = jwt.sign(claims, PRIVATE_KEY, { algorithm: 'RS256' });
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    if (req.method === 'GET') {
      return res.redirect(302, saveUrl);
    }
    return res.status(200).json({ saveUrl, objectId });

  } catch (err: any) {
    console.error('Google Wallet API Error:', err);
    return res.status(500).json({ 
      error: 'Failed to generate Wallet link', 
      details: err.message 
    });
  }
}