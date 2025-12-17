import { BagSize, BookingDetails, BagQuantities } from "../types";
import { PRICES } from "../constants";

/* =========================
   DATE & PRICE CALCULATIONS
   ========================= */

export const calculateBillableDays = (start: string, end: string): number => {
  if (!start || !end) return 0;

  const startDate = new Date(start);
  const endDate = new Date(end);

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  if (endDate < startDate) return 0;

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1; // drop-off day always counts
};

export const calculateDailySubtotal = (bagQuantities: BagQuantities): number => {
  return (
    bagQuantities[BagSize.Small] * PRICES[BagSize.Small].pricePerDay +
    bagQuantities[BagSize.Medium] * PRICES[BagSize.Medium].pricePerDay +
    bagQuantities[BagSize.Large] * PRICES[BagSize.Large].pricePerDay
  );
};

export const calculateTotal = (
  bagQuantities: BagQuantities,
  days: number
): number => {
  return calculateDailySubtotal(bagQuantities) * days;
};

/* =========================
   BOOKING ID
   ========================= */

export const generateBookingId = (): string => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `LDR-${yyyy}${mm}${dd}-${random}`;
};

/* =========================
   LOCAL STORAGE (TEMP)
   ========================= */

export const saveBooking = (booking: BookingDetails): void => {
  const existing: BookingDetails[] = JSON.parse(
    localStorage.getItem("bookings") || "[]"
  );

  existing.push(booking);

  localStorage.setItem("bookings", JSON.stringify(existing));
  localStorage.setItem("latestBooking", JSON.stringify(booking));
};

/* =========================
   STRIPE CHECKOUT
   ========================= */

export const startStripeCheckout = async (params: {
  bookingId: string;
  dropOffDate: string;
  pickUpDate: string;
  billableDays: number;
  bagQuantities: BagQuantities;
  customerEmail?: string;
}): Promise<void> => {
  const {
    bookingId,
    dropOffDate,
    pickUpDate,
    billableDays,
    bagQuantities,
    customerEmail,
  } = params;

  if (!billableDays || billableDays < 1) {
    throw new Error("Invalid billable days");
  }

  const totalQty =
    bagQuantities[BagSize.Small] +
    bagQuantities[BagSize.Medium] +
    bagQuantities[BagSize.Large];

  if (totalQty < 1) {
    throw new Error("Please select at least 1 bag");
  }

  /* =========================
     BUILD STRIPE LINE ITEMS
     ========================= */

  const lineItems = [
    {
      name: "Small bag",
      qty: bagQuantities[BagSize.Small],
      unitAmount:
        PRICES[BagSize.Small].pricePerDay * billableDays * 100,
    },
    {
      name: "Medium bag",
      qty: bagQuantities[BagSize.Medium],
      unitAmount:
        PRICES[BagSize.Medium].pricePerDay * billableDays * 100,
    },
    {
      name: "Large bag",
      qty: bagQuantities[BagSize.Large],
      unitAmount:
        PRICES[BagSize.Large].pricePerDay * billableDays * 100,
    },
  ]
    .filter((item) => item.qty > 0)
    .map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: `${item.name} (${billableDays} day${
            billableDays > 1 ? "s" : ""
          })`,
        },
        unit_amount: Math.round(item.unitAmount),
      },
      quantity: item.qty,
    }));

  /* =========================
     BOOKING OBJECT (METADATA)
     ========================= */

  const total = calculateTotal(bagQuantities, billableDays);

  const booking: BookingDetails = {
    id: bookingId,
    bookingRef: bookingId,
    dropoffDate: dropOffDate,
    pickupDate: pickUpDate,
    days: billableDays,
    bagQuantities,
    total,
  };

  // Save locally for success page
  saveBooking(booking);

  /* =========================
     CALL BACKEND API
     ========================= */

  const res = await fetch(
    `${window.location.origin}/api/create-checkout-session`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineItems,      // ✅ REQUIRED
        booking,        // ✅ for webhook + emails
        customerEmail,  // optional
      }),
    }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.url) {
    throw new Error(
      data?.error || `Stripe checkout failed (HTTP ${res.status})`
    );
  }

  // ✅ Redirect to Stripe Checkout
  window.location.href = data.url;
};
