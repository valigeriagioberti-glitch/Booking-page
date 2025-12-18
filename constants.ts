
import { BagSize, PricingRule } from './types';

export const PRICING_RULES: Record<BagSize, PricingRule> = {
  [BagSize.SMALL]: {
    size: BagSize.SMALL,
    pricePerDay: 5,
    description: 'Up to 10kg (Hand luggage style)'
  },
  [BagSize.MEDIUM]: {
    size: BagSize.MEDIUM,
    pricePerDay: 6,
    description: '10kg - 23kg (Standard suitcase)'
  },
  [BagSize.LARGE]: {
    size: BagSize.LARGE,
    pricePerDay: 7,
    description: 'Over 23kg (Large or oversized)'
  }
};

export const CONTACT_EMAIL = "valigeriagioberti@gmail.com";
export const LOCATION_ADDRESS = "V. Gioberti, 42, 00185 Roma RM, Italy";

// This will be used if you implement client-side Stripe elements, 
// but for Checkout redirect it's handled via the session URL.
export const STRIPE_PUBLISHABLE_KEY = "pk_live_your_key_here";
