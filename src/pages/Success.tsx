import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SuccessView from '../components/SuccessView';
import { verifySession } from '../services/bookingService';
import { BookingDetails, PaymentStatus, Language } from '../types';
import { Loader2, AlertCircle } from 'lucide-react';

interface SuccessProps {
  language: Language;
}

const Success: React.FC<SuccessProps> = ({ language }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    const verify = async () => {
      try {
        const data = await verifySession(sessionId);
        if (data.verified) {
           const bookingDetails: BookingDetails = {
            id: data.id,
            bagQuantities: data.bagQuantities,
            dropOffDate: data.dropOffDate,
            pickUpDate: data.pickUpDate,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: '', // Phone is not always returned by Stripe metadata unless explicitly added
            billableDays: data.billableDays,
            totalPrice: data.amountTotal,
            paymentStatus: PaymentStatus.Paid,
            stripePaymentId: sessionId,
            timestamp: new Date().toISOString()
          };
          setBooking(bookingDetails);
        } else {
          setError('Payment verification failed.');
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred while verifying the booking.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-green-900 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Verifying Payment...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-green-900 text-white px-6 py-3 rounded-lg font-bold"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (booking) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
         <SuccessView booking={booking} onReset={() => navigate('/')} language={language} />
      </main>
    );
  }

  return null;
};

export default Success;