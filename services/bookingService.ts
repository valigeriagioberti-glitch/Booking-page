import { BagSize, BookingDetails, BagQuantities } from '../types';
import { PRICES } from '../constants';

export const calculateBillableDays = (start: string, end: string): number => {
  if (!start || !end) return 0;
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  // Reset hours to ensure pure date calculation
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  if (endDate < startDate) return 0;

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  // Drop-off day counts as 1 full day.
  // Example: Drop 1st, Pick 1st = 1 day.
  // Example: Drop 1st, Pick 2nd = 2 days.
  return diffDays + 1;
};

export const calculateDailySubtotal = (bagQuantities: BagQuantities): number => {
  let daily = 0;
  daily += bagQuantities[BagSize.Small] * PRICES[BagSize.Small].pricePerDay;
  daily += bagQuantities[BagSize.Medium] * PRICES[BagSize.Medium].pricePerDay;
  daily += bagQuantities[BagSize.Large] * PRICES[BagSize.Large].pricePerDay;
  return daily;
};

export const calculateTotal = (
  bagQuantities: BagQuantities, 
  days: number
): number => {
  const dailyTotal = calculateDailySubtotal(bagQuantities);
  return dailyTotal * days;
};

export const generateBookingId = (): string => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `LDR-${yyyy}${mm}${dd}-${random}`;
};

export const processMockStripePayment = async (amount: number): Promise<{ success: boolean; id: string }> => {
  // Simulate network delay for Stripe
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        id: `pi_${Math.random().toString(36).substr(2, 9)}`
      });
    }, 2000);
  });
};

export const saveBooking = (booking: BookingDetails): void => {
  // Simulate saving to database
  console.log("Saving booking to DB:", booking);
  const existing = JSON.parse(localStorage.getItem('bookings') || '[]');
  existing.push(booking);
  localStorage.setItem('bookings', JSON.stringify(existing));
};