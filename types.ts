/* =========================
   BAG SIZES
   ========================= */

export enum BagSize {
  Small = "Small",
  Medium = "Medium",
  Large = "Large",
}

/* =========================
   PAYMENT STATUS
   ========================= */

export enum PaymentStatus {
  Pending = "pending",
  Processing = "processing",
  Paid = "paid",
  Failed = "failed",
}

/* =========================
   BAG QUANTITIES
   ========================= */

export type BagQuantities = {
  [key in BagSize]: number;
};

/* =========================
   BOOKING DETAILS (SINGLE SOURCE)
   ========================= */

export interface BookingDetails {
  /** Internal UUID / reference */
  id: string;

  /** Human-readable reference (LDR-YYYYMMDD-XXXX) */
  bookingRef: string;

  /** Dates */
  dropoffDate: string; // YYYY-MM-DD
  pickupDate: string;  // YYYY-MM-DD
  days: number;

  /** Bags */
  bagQuantities: BagQuantities;

  /** Pricing */
  total: number;

  /** Customer info (optional for now) */
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  /** Payment */
  paymentStatus?: PaymentStatus;
  stripePaymentId?: string;

  /** Metadata */
  timestamp?: string; // ISO string
}

/* =========================
   PRICE CONFIG
   ========================= */

export interface PriceConfig {
  size: BagSize;
  pricePerDay: number;
  description: string;
}
