import { BagSize, PriceConfig } from './types';

export const PRICES: Record<BagSize, PriceConfig> = {
  [BagSize.Small]: {
    size: BagSize.Small,
    pricePerDay: 5,
    description: "Handbags, backpacks, laptop bags"
  },
  [BagSize.Medium]: {
    size: BagSize.Medium,
    pricePerDay: 6,
    description: "Cabin suitcase, carry-on (up to 10kg)"
  },
  [BagSize.Large]: {
    size: BagSize.Large,
    pricePerDay: 7,
    description: "Check-in suitcase, bulky items"
  }
};

export const MOCK_STRIPE_KEY = "pk_test_mock_12345";