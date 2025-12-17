const SuccessView: React.FC<SuccessViewProps> = ({ booking, onReset }) => {
  if (!booking) {
    return null;
  }

  const dailySubtotal = calculateDailySubtotal(booking.bagQuantities);


import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SuccessView from './SuccessView';
import { BookingDetails } from '../types';

const SuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      setError(true);
      setLoading(false);
      return;
    }

    const raw = localStorage.getItem('latestBooking');

    if (!raw) {
      setError(true);
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as BookingDetails;
      setBooking(parsed);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  const handleReset = () => {
    localStorage.removeItem('latestBooking');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading booking…</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border rounded-xl p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Payment successful ✅</h2>
          <p className="text-gray-600 mb-6">
            Your payment was received, but the booking details could not be loaded on this device.
          </p>

          <a
            href="https://wa.me/393664530323"
            className="block bg-green-900 text-white py-3 rounded-lg font-bold mb-3"
          >
            Contact us on WhatsApp
          </a>

          <button
            onClick={() => navigate('/')}
            className="block w-full border py-3 rounded-lg font-bold"
          >
            Back to booking
          </button>
        </div>
      </div>
    );
  }

  return <SuccessView booking={booking} onReset={handleReset} />;
};

export default SuccessPage;
