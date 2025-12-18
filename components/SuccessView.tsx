
import React from 'react';
import { CheckCircle, ArrowLeft, Printer, FileDown, MapPin, Calendar, Briefcase, User, Mail, Clock, Phone, ExternalLink } from 'lucide-react';
import { BookingResult, BagSize, Language } from '../types';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { it as itLocale } from 'date-fns/locale/it';
import { enGB as enLocale } from 'date-fns/locale/en-GB';
import { LOCATION_ADDRESS, PRICING_RULES } from '../constants';
import { TRANSLATIONS } from '../translations';

interface SuccessViewProps {
  result: BookingResult & { timestamp?: string };
  onReset: () => void;
  language: Language;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ result, onReset, language }) => {
  const t = TRANSLATIONS[language];
  const dateLocale = language === 'it' ? itLocale : enLocale;

  const pdfUrl = `/api/booking-pdf?session_id=${result.stripePaymentId}&lang=${language}`;

  const romeTime = result.timestamp 
    ? new Intl.DateTimeFormat(language === 'it' ? 'it-IT' : 'en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Europe/Rome',
      }).format(new Date(result.timestamp))
    : 'N/A';

  const bagSizeNames: Record<BagSize, string> = {
    [BagSize.SMALL]: t.booking.small,
    [BagSize.MEDIUM]: t.booking.medium,
    [BagSize.LARGE]: t.booking.large,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-fade-in mb-24 md:mb-0">
      {/* Screen Only Confirmation Status */}
      <div className="text-center print:hidden">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-green-900" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">{t.success.confirmed}</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          {t.success.subtitle} <strong>{result.customerEmail}</strong>.
        </p>
      </div>

      {/* Visual Representation of the Receipt (Screen Only) */}
      <div id="receipt-card" className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl overflow-hidden print:hidden">
        <div className="bg-green-900 p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <img 
                src="https://cdn.shopify.com/s/files/1/0753/8144/0861/files/cropped-Untitled-design-2025-09-11T094640.576_1.png?v=1765462614" 
                alt="Logo" 
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight leading-none uppercase">Luggage Deposit Rome</h3>
              <p className="text-[10px] text-green-300 uppercase tracking-widest mt-1 font-bold">Booking Confirmation</p>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[9px] text-green-400 uppercase tracking-widest font-black">{t.success.resId}</p>
            <p className="text-base font-mono font-bold">{result.stripePaymentId.substring(0, 15)}...</p>
          </div>
        </div>
        
        <div className="p-8 md:p-10 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                <User className="w-3 h-3 mr-1.5 text-green-900" /> {t.success.customerDetails}
              </h4>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900">{result.customerName}</p>
                <div className="text-[11px] text-gray-500 flex items-center gap-2">
                  <Mail className="w-2.5 h-2.5" /> {result.customerEmail}
                </div>
                <div className="text-[11px] text-gray-500 flex items-center gap-2">
                  <Phone className="w-2.5 h-2.5" /> {result.customerPhone}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                <Clock className="w-3 h-3 mr-1.5 text-green-900" /> {t.success.bookedOn}
              </h4>
              <p className="text-sm font-bold text-gray-900">{romeTime}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-50">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                <Calendar className="w-3 h-3 mr-1.5 text-green-900" /> {t.success.schedule}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-xs">
                  <span className="w-16 text-gray-400 font-bold uppercase text-[8px]">{t.booking.from}</span>
                  <span className="font-bold text-gray-900">{format(parseISO(result.dropOffDate), 'EEEE, MMM d, yyyy', { locale: dateLocale })}</span>
                </div>
                <div className="flex items-center text-xs">
                  <span className="w-16 text-gray-400 font-bold uppercase text-[8px]">{t.success.until}</span>
                  <span className="font-bold text-gray-900">{format(parseISO(result.pickUpDate), 'EEEE, MMM d, yyyy', { locale: dateLocale })}</span>
                </div>
                <div className="flex items-center text-xs pt-1">
                  <span className="w-16"></span>
                  <span className="bg-green-50 text-green-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-100">
                    {result.billableDays} {result.billableDays === 1 ? t.booking.day : t.booking.days}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                <MapPin className="w-3 h-3 mr-1.5 text-green-900" /> {t.success.dropOffPoint}
              </h4>
              <div className="text-[11px] font-bold text-gray-900 leading-relaxed max-w-[180px]">
                {LOCATION_ADDRESS}
              </div>
              <p className="text-[9px] text-gray-400 leading-relaxed italic border-l-2 border-gray-100 pl-2">
                {t.success.receptionInfo}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-gray-50">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.success.itemized}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-2 font-bold text-gray-400 uppercase text-[8px]">{t.success.description}</th>
                    <th className="pb-2 font-bold text-gray-400 uppercase text-[8px] text-right">{t.success.qty}</th>
                    <th className="pb-2 font-bold text-gray-400 uppercase text-[8px] text-right">Price/Day</th>
                    <th className="pb-2 font-bold text-gray-400 uppercase text-[8px] text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(Object.entries(result.quantities) as [BagSize, number][]).map(([size, qty]) => {
                    if (qty === 0) return null;
                    const rule = PRICING_RULES[size];
                    return (
                      <tr key={size}>
                        <td className="py-2.5 font-bold text-gray-900">{t.success.bagStorage} ({bagSizeNames[size]})</td>
                        <td className="py-2.5 text-right font-medium text-gray-600">{qty}</td>
                        <td className="py-2.5 text-right font-medium text-gray-600">€{rule.pricePerDay.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-bold text-gray-900">€{(qty * rule.pricePerDay).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-100">
                    <td colSpan={3} className="pt-3 pb-1 text-right text-gray-400 font-bold uppercase text-[9px]">{t.success.subtotalDaily}</td>
                    <td className="pt-3 pb-1 text-right font-bold text-gray-900">€{result.perDaySubtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-1 text-right text-gray-400 font-bold uppercase text-[9px]">{t.booking.duration}:</td>
                    <td className="py-1 text-right font-bold text-gray-900">× {result.billableDays} {result.billableDays === 1 ? t.booking.day : t.booking.days}</td>
                  </tr>
                  <tr className="border-t-2 border-green-900">
                    <td colSpan={3} className="py-4 text-right font-black text-green-900 uppercase tracking-[0.2em] text-[10px]">{t.success.totalPaid}</td>
                    <td className="py-4 text-right text-3xl font-black text-gray-900">€{result.totalPrice.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <a 
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-green-900 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-black transition-all shadow-xl group"
        >
          <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm uppercase tracking-widest">{t.success.print}</span>
        </a>
        <a 
          href={pdfUrl}
          download="booking-confirmation.pdf"
          className="flex-1 bg-white text-gray-900 border-2 border-gray-900 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-50 transition-all shadow-sm group"
        >
          <FileDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          <span className="text-sm uppercase tracking-widest">{t.success.download}</span>
        </a>
      </div>

      <div className="text-center pt-8 border-t border-gray-100">
        <button 
          onClick={onReset}
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-green-900 font-bold transition-colors text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>{t.success.anotherBooking}</span>
        </button>
      </div>
    </div>
  );
};
