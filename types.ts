
export enum BagSize {
  SMALL = 'Small',
  MEDIUM = 'Medium',
  LARGE = 'Large'
}

export type Language = 'en' | 'it';

export interface BookingData {
  quantities: Record<BagSize, number>;
  dropOffDate: string;
  pickUpDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface PricingRule {
  size: BagSize;
  pricePerDay: number;
  description: string;
}

export interface BookingResult extends BookingData {
  billableDays: number;
  perDaySubtotal: number;
  totalPrice: number;
  stripePaymentId: string;
  status: 'pending' | 'success' | 'failed';
  timestamp?: string;
}
