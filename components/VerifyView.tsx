import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, User, Calendar } from 'lucide-react';
import { BookingResult, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';

interface VerifyViewProps {
  bookingId: string;
  language: Language;
}

export const VerifyView: React.FC<VerifyViewProps> = ({ bookingId, language }) => {
  const sessionId = bookingId;
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/verify-session?session_id=${encodeURIComponent(sessionId)}`);
        if (!response.ok) throw new Error(t.verify.notFound);
        const data = await response.json();
        if (data.status === 'paid') {
          setBooking(data.booking);
        } else {
          setError(t.verify.invalid);
        }
      } catch (err: any) {
        setError(err.message || t.verify.notFound);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [sessionId, language]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-green-900 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t.verify.loading}</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto bg-white p-10 rounded-[2rem] border border-red-100 shadow-xl text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">{t.verify.notFound}</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-[2rem] border border-gray-100 shadow-2xl overflow-hidden animate-fade-in">
      <div className="bg-green-900 p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-4">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-white text-xl font-black uppercase tracking-tight">{t.verify.valid}</h2>
        <p className="text-green-300 text-[10px] font-bold uppercase tracking-widest mt-1">ID: {sessionId.substring(0, 12)}...</p>
      </div>

      <div className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <User className="w-5 h-5 text-green-900 mt-1" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.verify.customer}</p>
              <p className="font-bold text-gray-900">{booking.customerName}</p>
              <p className="text-sm text-gray-500">{booking.customerPhone}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Calendar className="w-5 h-5 text-green-900 mt-1" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.success.schedule}</p>
              <p className="text-sm font-bold text-gray-900">In: {format(parseISO(booking.dropOffDate), 'dd/MM/yy')} @ {booking.dropOffTime}</p>
              <p className="text-sm font-bold text-gray-900">Out: {format(parseISO(booking.pickUpDate), 'dd/MM/yy')} @ {booking.pickUpTime}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-5 h-5 text-green-900 mt-1 flex items-center justify-center">👜</div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.verify.bags}</p>
              <div className="flex gap-4 mt-1">
                {Object.entries(booking.quantities).map(([size, qty]) => (
                  qty > 0 && (
                    <div key={size} className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <span className="text-[10px] font-black text-gray-900">{size[0]}: {qty}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-dashed border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.success.totalPaid}</span>
            <span className="text-2xl font-black text-green-900">€{booking.totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};