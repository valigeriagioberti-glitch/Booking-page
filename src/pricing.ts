import type { BagQuantities, BagSize } from './types';

export const PRICES_EUR: Record<BagSize, number> = {
  Small: 5,
  Medium: 6,
  Large: 7,
};

export function billableDays(dropOffDate: string, pickUpDate: string): number {
  if (!dropOffDate || !pickUpDate) return 0;
  const start = new Date(dropOffDate);
  const end = new Date(pickUpDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  if (end < start) return 0;
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export function perDaySubtotalEUR(q: BagQuantities): number {
  return (q.Small || 0) * PRICES_EUR.Small + (q.Medium || 0) * PRICES_EUR.Medium + (q.Large || 0) * PRICES_EUR.Large;
}

export function calcTotalEUR(q: BagQuantities, days: number): number {
  if (!days || days <= 0) return 0;
  const perDay = perDaySubtotalEUR(q);
  return perDay * days;
}

export function totalBags(q: BagQuantities): number {
  return (q.Small || 0) + (q.Medium || 0) + (q.Large || 0);
}
