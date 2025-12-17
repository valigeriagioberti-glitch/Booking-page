export type BagSize = 'Small' | 'Medium' | 'Large';

export type BagQuantities = Record<BagSize, number>;

export type BookingFormState = {
  bagQuantities: BagQuantities;
  dropOffDate: string; // YYYY-MM-DD
  pickUpDate: string;  // YYYY-MM-DD
  name: string;
  email: string;
  phone: string;
};
