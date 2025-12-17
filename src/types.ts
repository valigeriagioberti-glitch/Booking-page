export enum BagSize {
  Small = 'Small',
  Medium = 'Medium',
  Large = 'Large'
}

export enum PaymentStatus {
  Pending = 'pending',
  Processing = 'processing',
  Paid = 'paid',
  Failed = 'failed'
}

export type BagQuantities = {
  [key in BagSize]: number;
};

export interface BookingDetails {
  id?: string;
  bagQuantities: BagQuantities;
  dropOffDate: string; // YYYY-MM-DD
  pickUpDate: string; // YYYY-MM-DD
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billableDays: number;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  stripePaymentId?: string;
  timestamp: string; // ISO string
}

export interface PriceConfig {
  size: BagSize;
  pricePerDay: number;
  description: string;
}

export type Language = 'en' | 'it';