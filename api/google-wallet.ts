import * as jwt from 'jsonwebtoken';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { 
    bookingId, 
    small, 
    medium, 
    large, 
    dropOffDate, 
    pickUpDate, 
    customerEmail, 
    verifyUrl 
  } = req.body;

  if (!bookingId) {
    return res.status(400).json({ error: 'bookingId is required.' });
  }

  const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
  const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
  const PRIVATE_KEY = process.env.GOOGLE_WALLET_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!ISSUER_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    const missing = [];
    if (!ISSUER_ID) missing.push('GOOGLE_WALLET_ISSUER_ID');
    if (!SERVICE_ACCOUNT_EMAIL) missing.push('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL');
    if (!PRIVATE_KEY) missing.push('GOOGLE_WALLET_PRIVATE_KEY');
    return res.status(500).json({ 
      error: 'Google Wallet configuration missing.',
      details: `Missing environment variables: ${missing.join(', ')}`
    });
  }

  try {
    // 1. Authenticate with Google
    const accessToken = await getGoogleAccessToken(SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY);

    // 2. Prepare Luggage Summary
    const luggageParts = [];
    if (small > 0) luggageParts.push(`S:${small}`);
    if (medium > 0) luggageParts.push(`M:${medium}`);
    if (large > 0) luggageParts.push(`L:${large}`);
    const bagsSummary = luggageParts.join(' ') || 'No bags selected';

    // 3. Define Object Identity
    const safeBookingId = bookingId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const objectId = `${ISSUER_ID}.${safeBookingId}`;
    const objectIdEncoded = encodeURIComponent(objectId);
    const classId = `${ISSUER_ID}.luggage_deposit_rome_booking`;

    // 4. Construct the Generic Object
    const genericObject = {
      id: objectId,
      classId: classId,
      genericType: 'GENERIC_TYPE_UNSPECIFIED',
      state: 'ACTIVE',
      cardTitle: { defaultValue: { language: 'en', value: 'LUGGAGE DEPOSIT ROME' } },
      header: { defaultValue: { language: 'en', value: 'Luggage Storage' } },
      subheader: { defaultValue: { language: 'en', value: customerEmail || 'Guest' } },
      logo: {
        sourceUri: {
          uri: 'https://cdn.shopify.com/s/files/1/0753/8144/0861/files/cropped-Untitled-design-2025-09-11T094640.576_1.png?v=1765462614'
        }
      },
      hexBackgroundColor: '#064e3b',
      barcode: {
        type: 'QR_CODE',
        value: verifyUrl || bookingId,
        alternateText: bookingId
      },
      textModulesData: [
        { header: 'Booking Ref', body: bookingId.substring(0, 16), id: 'booking_id' },
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
      // Exists -> PATCH
      const patchResponse = await fetch(getUrl, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(genericObject)
      });
      if (!patchResponse.ok) {
        const errData = await patchResponse.json();
        throw new Error(`Failed to update Wallet object: ${JSON.stringify(errData)}`);
      }
    } else if (getResponse.status === 404) {
      // Doesn't exist -> POST
      const postUrl = `https://walletobjects.googleapis.com/walletobjects/v1/genericObject`;
      const postResponse = await fetch(postUrl, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(genericObject)
      });
      if (!postResponse.ok) {
        const errData = await postResponse.json();
        throw new Error(`Failed to create Wallet object: ${JSON.stringify(errData)}`);
      }
    } else {
      const errData = await getResponse.json();
      throw new Error(`Error checking Wallet object existence: ${JSON.stringify(errData)}`);
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

    return res.status(200).json({ saveUrl, objectId });

  } catch (err: any) {
    console.error('Google Wallet API Error:', err);
    return res.status(500).json({ 
      error: 'Failed to generate Wallet link', 
      details: err.message 
    });
  }
}