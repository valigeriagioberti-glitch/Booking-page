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
<<<<<<< HEAD
  // CRITICAL: Get sessionId from path params (matches /success/:sessionId)
=======
  // CRITICAL: Get sessionId from path params
>>>>>>> 51eada675b9bcb87df31da1cc061248226969ca3
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

<<<<<<< HEAD
  useEffect(() => {
    // If route matched but no sessionId (unlikely with required param), handle it
    if (!sessionId) {
      setLoading(false);
      setError("No session ID found.");
=======
  // Debug indicator to confirm route loading
  const debugHeader = (
    <div className="bg-yellow-200 text-black text-center py-2 font-mono font-bold text-sm border-b border-yellow-300">
      DEBUG: SUCCESS PAGE LOADED (ID: {sessionId || 'MISSING'})
    </div>
  );

  useEffect(() => {
    // CRITICAL: Do NOT redirect automatically.
    // If sessionId is missing, we simply stop loading and show the "No Payment Session" UI below.
    if (!sessionId) {
      setLoading(false);
>>>>>>> 51eada675b9bcb87df31da1cc061248226969ca3
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

<<<<<<< HEAD
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
=======
  if (loading) {
    return (
      <>
        {debugHeader}
        <div className="min-h-screen bg-white flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-green-900 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Verifying Payment...</h2>
        </div>
      </>
    );
  }

  // Explicitly handle missing session ID without redirecting
  if (!sessionId) {
    return (
      <>
        {debugHeader}
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
          <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Payment Session</h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            We couldn't find a payment session ID. This page should be accessed after a successful payment.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="bg-green-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors"
          >
            Return Home
          </button>
        </div>
      </>
>>>>>>> 51eada675b9bcb87df31da1cc061248226969ca3
    );
  }

  if (error) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen bg-white">
        {debugHeader}
        <div className="flex flex-col items-center justify-center pt-20 p-4">
=======
      <>
        {debugHeader}
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
>>>>>>> 51eada675b9bcb87df31da1cc061248226969ca3
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
<<<<<<< HEAD
      </div>
=======
      </>
>>>>>>> 51eada675b9bcb87df31da1cc061248226969ca3
    );
  }

  if (booking) {
    return (
<<<<<<< HEAD
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
=======
      <main className="max-w-7xl mx-auto px-4 py-8">
         {debugHeader}
         <SuccessView booking={booking} onReset={() => navigate('/')} language={language} />
      </main>
    );
  }

  return <div>{debugHeader}</div>;
>>>>>>> 51eada675b9bcb87df31da1cc061248226969ca3
};

export default Success;