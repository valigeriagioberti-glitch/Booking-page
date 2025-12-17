import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import Header from './components/Header';
import BookingForm from './components/BookingForm';
import SummaryCard from './components/SummaryCard';
import SuccessView from './components/SuccessView';

import { BagSize, BookingDetails, BagQuantities } from './types';
import {
  calculateBillableDays,
  calculateTotal,
  startStripeCheckout,
  saveBooking,
  generateBookingId
} from './services/bookingService';

import { Loader2 } from 'lucide-react';

/** ----------------------------
 * Booking Page (your current UI)
 * ---------------------------- */
const BookingPage: React.FC = () => {
  const [formData, setFormData] = useState({
    bagQuantities: {
      [BagSize.Small]: 0,
      [BagSize.Medium]: 0,
      [BagSize.Large]: 0,
    } as BagQuantities,
    dropOffDate: '',
    pickUpDate: '',
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });

  const [status, setStatus] = useState<'input' | 'processing'>('input');

  const billableDays = useMemo(
    () => calculateBillableDays(formData.dropOffDate, formData.pickUpDate),
    [formData.dropOffDate, formData.pickUpDate]
  );

  const totalPrice = useMemo(
    () => calculateTotal(formData.bagQuantities, billableDays),
    [formData.bagQuantities, billableDays]
  );

  const totalBags = useMemo(
    () => (Object.values(formData.bagQuantities) as number[]).reduce((a, b) => a + b, 0),
    [formData.bagQuantities]
  );

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      // Pickup cannot be before dropoff
      if (field === 'dropOffDate') {
        if (prev.pickUpDate && new Date(value) > new Date(prev.pickUpDate)) {
          return { ...prev, [field]: value, pickUpDate: value };
        }
      }
      if (field === 'pickUpDate') {
        if (prev.dropOffDate && new Date(value) < new Date(prev.dropOffDate)) {
          return prev;
        }
      }
      return { ...prev, [field]: value };
    });
  };

  const handleQuantityChange = (size: BagSize, delta: number) => {
    setFormData(prev => {
      const currentQty = prev.bagQuantities[size];
      const newQty = Math.max(0, currentQty + delta);
      return {
        ...prev,
        bagQuantities: {
          ...prev.bagQuantities,
          [size]: newQty
        }
      };
    });
  };

  const handlePayAndReserve = async () => {
    try {
      if (!formData.dropOffDate || !formData.pickUpDate) {
        alert("Please select drop-off and pick-up dates.");
        return;
      }
      if (billableDays < 1) {
        alert("Please select valid dates.");
        return;
      }
      if (totalBags < 1) {
        alert("Please select at least 1 bag.");
        return;
      }

      setStatus('processing');

      const bookingId = generateBookingId();

      const booking: BookingDetails = {
        id: bookingId,
        bagQuantities: formData.bagQuantities,
        dropOffDate: formData.dropOffDate,
        pickUpDate: formData.pickUpDate,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        billableDays,
        totalPrice,
        timestamp: new Date().toISOString()
      } as any;

      // Save locally BEFORE redirect (Success page reads latestBooking)
      saveBooking(booking);

      // Redirect to Stripe Checkout
      await startStripeCheckout({
        bookingId,
        dropOffDate: formData.dropOffDate,
        pickUpDate: formData.pickUpDate,
        billableDays,
        bagQuantities: formData.bagQuantities
      });

      // Do not set success here—Stripe redirects back to /booking/success

    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Payment failed. Please try again.");
      setStatus('input');
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24 print:bg-white print:pb-0">
      {/* Hide header when printing */}
      <div className="print:hidden">
        <Header />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 print:p-0 print:max-w-none">
        {/* Header Text */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Secure Luggage Storage in <span className="text-green-900">Rome</span>
          </h1>
          <p className="text-lg text-gray-600">
            Book online in 2 minutes. Secure payment. Free cancellation up to 24h before.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Form Section */}
          <div className="lg:col-span-2">
            <BookingForm
              formData={formData}
              onChange={handleInputChange}
              onQuantityChange={handleQuantityChange}
            />
          </div>

          {/* Summary Section - Sticky Desktop */}
          <div className="hidden md:block lg:col-span-1">
            <SummaryCard
              {...formData}
              billableDays={billableDays}
              totalPrice={totalPrice}
              onPay={handlePayAndReserve}
              isProcessing={status === 'processing'}
            />
          </div>
        </div>
      </main>

      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium">Total Price</span>
            <span className="text-xl font-bold text-green-900">€{totalPrice.toFixed(2)}</span>
          </div>
          <button
            onClick={handlePayAndReserve}
            disabled={status === 'processing' || !formData.dropOffDate || !formData.pickUpDate || totalBags === 0}
            className={`flex-1 py-3 px-6 rounded-lg font-bold text-white shadow-md
              ${status === 'processing' || !formData.dropOffDate || !formData.pickUpDate || totalBags === 0
                ? 'bg-gray-300'
                : 'bg-green-900 active:bg-green-800'}`}
          >
            {status === 'processing' ? <Loader2 className="animate-spin mx-auto" /> : 'Pay & Reserve'}
          </button>
        </div>
      </div>

      {/* Overlay while processing */}
      {status === 'processing' && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[60] flex flex-col items-center justify-center print:hidden">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 flex flex-col items-center text-center max-w-sm mx-4">
            <div className="w-16 h-16 border-4 border-green-900 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Redirecting to Stripe</h3>
            <p className="text-gray-500">Please wait while we open secure checkout...</p>
          </div>
        </div>
      )}
    </div>
  );
};

/** ----------------------------
 * Success Page (Stripe redirect)
 * ---------------------------- */
const SuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetails | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');

    // Stripe success will include session_id. We load the saved booking from localStorage.
    if (sessionId) {
      const latest = localStorage.getItem('latestBooking');
      if (latest) {
        try {
          const parsed: BookingDetails = JSON.parse(latest);
          setBooking(parsed);
        } catch {
          setBooking(null);
        }
      }
    }
  }, [location.search]);

  const resetFlow = () => {
    // Optional: clear latest booking if you want
    // localStorage.removeItem('latestBooking');
    navigate('/');
  };

  // If booking isn't available, still show a friendly message
  if (!booking) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment received ✅</h1>
          <p className="text-gray-600 mb-6">
            We couldn’t load your booking details on this screen. Please return to the booking page.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-lg font-bold text-white bg-green-900"
          >
            Back to booking
          </button>
        </div>
      </div>
    );
  }

  return <SuccessView booking={booking} onReset={resetFlow} />;
};

/** ----------------------------
 * App Router
 * ---------------------------- */
const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<BookingPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/booking/success" element={<SuccessPage />} />
    </Routes>
  );
};

export default App;
