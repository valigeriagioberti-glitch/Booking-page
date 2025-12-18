
import { BagSize, PricingRule } from './types';

export const PRICING_RULES: Record<BagSize, PricingRule> = {
  [BagSize.SMALL]: {
    size: BagSize.SMALL,
    pricePerDay: 5,
    description: 'Small suitcase or backpack. Max height: 55cm / 20 inches.'
  },
  [BagSize.MEDIUM]: {
    size: BagSize.MEDIUM,
    pricePerDay: 6,
    description: 'A medium suitcase. Max height: 70cm / 27 inches.'
  },
  [BagSize.LARGE]: {
    size: BagSize.LARGE,
    pricePerDay: 7,
    description: 'Anything larger than 70cm / 27 inches.'
  }
};

export const CONTACT_EMAIL = "valigeriagioberti@gmail.com";
export const LOCATION_ADDRESS = "V. Gioberti, 42, 00185 Roma RM, Italy";

// This will be used if you implement client-side Stripe elements, 
// but for Checkout redirect it's handled via the session URL.
export const STRIPE_PUBLISHABLE_KEY = "pk_live_your_key_here";
