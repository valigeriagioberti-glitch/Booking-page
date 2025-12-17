require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 4242;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const DB_FILE = path.join(__dirname, 'bookings.json');

// Ensure DB file exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Middleware
app.use(cors({
  origin: CLIENT_URL
}));

// Webhook route MUST use raw body for signature verification
// We define this BEFORE the global express.json() middleware
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Extract booking details from metadata
    const bookingData = {
      stripeSessionId: session.id,
      bookingId: session.metadata.bookingId,
      customerEmail: session.customer_details.email || session.metadata.customerEmail,
      dropOffDate: session.metadata.dropOffDate,
      pickUpDate: session.metadata.pickUpDate,
      amountTotal: session.amount_total / 100,
      currency: session.currency,
      paymentStatus: 'paid',
      timestamp: new Date().toISOString()
    };

    console.log('💰 Payment received for booking:', bookingData.bookingId);

    // Persist to JSON file
    try {
      const currentData = JSON.parse(fs.readFileSync(DB_FILE));
      currentData.push(bookingData);
      fs.writeFileSync(DB_FILE, JSON.stringify(currentData, null, 2));
    } catch (err) {
      console.error('Error saving booking:', err);
    }
  }

  res.send();
});

// Global JSON middleware for other routes
app.use(express.json());

// --- CONSTANTS & HELPERS ---

const PRICES = {
  'Small': 500, // 5.00 EUR
  'Medium': 600, // 6.00 EUR
  'Large': 700  // 7.00 EUR
};

const calculateBillableDays = (start, end) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  // Validation: Invalid dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  
  if (endDate < startDate) return 0;
  
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays + 1;
};

// --- ENDPOINTS ---

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { bagQuantities, dropOffDate, pickUpDate, customerEmail, bookingId } = req.body;

    // 1. Validate Inputs
    if (!bagQuantities || typeof bagQuantities !== 'object') {
      return res.status(400).json({ error: 'Invalid bag quantities' });
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (!bookingId) {
      return res.status(400).json({ error: 'Missing booking ID' });
    }

    // 2. Calculate Days Server-Side
    const days = calculateBillableDays(dropOffDate, pickUpDate);
    if (days <= 0) {
      return res.status(400).json({ error: 'Invalid date range' });
    }

    // 3. Construct Line Items & Validate Price
    const line_items = [];
    const description = `Booking ${bookingId} (${days} days)`;
    const validSizes = ['Small', 'Medium', 'Large'];

    for (const [size, qty] of Object.entries(bagQuantities)) {
      if (!validSizes.includes(size)) {
         return res.status(400).json({ error: `Invalid bag size: ${size}` });
      }
      
      const quantityInt = parseInt(qty, 10);
      
      if (isNaN(quantityInt) || quantityInt < 0 || quantityInt > 50) {
        return res.status(400).json({ error: `Invalid quantity for ${size}` });
      }

      if (quantityInt > 0) {
        // Safe Price lookup
        const unitAmountCents = PRICES[size] * days;

        line_items.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${size} Luggage Storage (${days} days)`,
              description: description,
            },
            unit_amount: unitAmountCents,
          },
          quantity: quantityInt,
        });
      }
    }

    if (line_items.length === 0) {
      return res.status(400).json({ error: 'Please select at least one bag' });
    }

    // 4. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: line_items,
      mode: 'payment',
      success_url: `${CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/cancel`,
      metadata: {
        bookingId,
        dropOffDate,
        pickUpDate,
        customerEmail,
        // Store bag quantities as JSON string in metadata if needed for recovery
        bagQuantities: JSON.stringify(bagQuantities)
      }
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error('Stripe Create Session Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/verify-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Missing session ID' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Reconstruct booking details from Stripe session to show on Success Page
      const bagQuantities = session.metadata.bagQuantities 
        ? JSON.parse(session.metadata.bagQuantities) 
        : {};

      const verifiedBooking = {
        verified: true,
        id: session.metadata.bookingId,
        customerEmail: session.customer_details.email,
        customerName: session.customer_details.name || 'Valued Customer',
        amountTotal: session.amount_total / 100,
        dropOffDate: session.metadata.dropOffDate,
        pickUpDate: session.metadata.pickUpDate,
        bagQuantities: bagQuantities,
        billableDays: calculateBillableDays(session.metadata.dropOffDate, session.metadata.pickUpDate)
      };

      res.json(verifiedBooking);
    } else {
      res.json({ verified: false });
    }
  } catch (error) {
    console.error('Verify Session Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
