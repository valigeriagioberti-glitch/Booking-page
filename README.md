# Luggage Deposit Rome — Booking (Standalone)

## Run locally
```bash
npm install
npm run dev
```

## Deploy on Vercel
1. Push this folder to GitHub
2. Import the repo in Vercel
3. Add env vars from `ENV_EXAMPLE.txt`
4. Deploy

## Stripe webhook
In Stripe Dashboard:
- Add an endpoint: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/stripe-webhook`
- Events: `checkout.session.completed`
- Copy the signing secret into `STRIPE_WEBHOOK_SECRET`
