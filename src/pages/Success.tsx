import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SuccessView from '../components/SuccessView';
import { verifySession } from '../services/bookingService';
import { BookingDetails, PaymentStatus, Language } from '../types';
import { Loader2, AlertCircle } from 'lucide-react';

interface SuccessProps {
  language: Language;
}

const Success: React.FC<SuccessProps> = ({ language }) => {
  // CRITICAL: Get sessionId from path params (matches /success/:sessionId)
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If route matched but no sessionId (unlikely with required param), handle it
    if (!sessionId) {
      setLoading(false);
      setError("No session ID found.");
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
            customerPhone: data.customerPhone || '',
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
  }, [sessionId]);

  // Debug Header to confirm route matching
  const debugHeader = (
    <div className="bg-green-100 border-b border-green-200 text-green-900 px-4 py-2 font-mono text-center font-bold">
      DEBUG: SUCCESS ROUTE MATCHED (ID: {sessionId})
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {debugHeader}
        <div className="flex flex-col items-center justify-center pt-20">
          <Loader2 className="w-12 h-12 text-green-900 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Verifying Payment...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        {debugHeader}
        <div className="flex flex-col items-center justify-center pt-20 p-4">
          <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-green-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (booking) {
    return (
      <div className="min-h-screen bg-white">
        {debugHeader}
        <main className="max-w-7xl mx-auto px-4 py-8">
           <SuccessView booking={booking} onReset={() => navigate('/')} language={language} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {debugHeader}
      <div className="p-10 text-center">No booking data available.</div>
    </div>
  );
};

export default Success;