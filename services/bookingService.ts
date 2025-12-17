import { BagSize, BookingDetails, BagQuantities } from '../types';
import { PRICES } from '../constants';

// Use relative path so it works on Vercel automatically (frontend and api on same origin)
const API_URL = '/api';

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

export const createCheckoutSession = async (data: any): Promise<{ url: string }> => {
  const response = await fetch(`${API_URL}/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create checkout session');
  }
  
  return response.json();
};

export const verifySession = async (sessionId: string): Promise<any> => {
  const response = await fetch(`${API_URL}/verify-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to verify session');
  }
  
  return response.json();
};

export const saveBooking = (booking: BookingDetails): void => {
  // Client-side save (optional, since data comes from verifySession)
  const existing = JSON.parse(localStorage.getItem('bookings') || '[]');
  existing.push(booking);
  localStorage.setItem('bookings', JSON.stringify(existing));
};