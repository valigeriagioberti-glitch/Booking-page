import React from 'react';
import { CheckCircle, ArrowLeft, FileDown, MapPin, Calendar, User, Mail, Clock, Phone, ArrowDownRight, ArrowUpRight } from 'lucide-react';
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

  const downloadUrl = `/api/booking-pdf?session_id=${result.stripePaymentId}&lang=${language}&mode=download`;
  const walletUrl = `/api/google-wallet?session_id=${result.stripePaymentId}`;

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
      <div className="text-center print:hidden">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-green-900" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">{t.success.confirmed}</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          {t.success.subtitle} <strong>{result.customerEmail}</strong>.
        </p>
      </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-50">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                <Calendar className="w-3 h-3 mr-1.5 text-green-900" /> {t.success.schedule}
              </h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 p-1.5 bg-green-50 rounded-lg">
                    <ArrowDownRight className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-tight mb-0.5">{t.booking.from}</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-sm font-black text-gray-900">
                        {format(parseISO(result.dropOffDate), 'MMM d, yyyy', { locale: dateLocale })}
                      </span>
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                        {result.dropOffTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="mt-1 p-1.5 bg-gray-50 rounded-lg">
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-tight mb-0.5">{t.success.until}</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-sm font-black text-gray-900">
                        {format(parseISO(result.pickUpDate), 'MMM d, yyyy', { locale: dateLocale })}
                      </span>
                      <span className="text-xs font-bold text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        {result.pickUpTime}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-1">
                  <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-green-900 rounded-full text-white">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                      {result.billableDays} {result.billableDays === 1 ? t.booking.day : t.booking.days}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                <MapPin className="w-3 h-3 mr-1.5 text-green-900" /> {t.success.dropOffPoint}
              </h4>
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="text-[11px] font-bold text-gray-900 leading-relaxed mb-2">
                  {LOCATION_ADDRESS}
                </div>
                <p className="text-[9px] text-gray-400 leading-relaxed italic border-l-2 border-gray-200 pl-2">
                  {t.success.receptionInfo}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-gray-50">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.verify.bags}</h4>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(result.quantities) as [BagSize, number][]).map(([size, qty]) => {
                if (qty === 0) return null;
                return (
                  <div key={size} className="flex items-center space-x-3 bg-white border border-gray-100 p-3 rounded-2xl shadow-sm hover:border-green-200 transition-all group">
                    <div className="text-xl transform group-hover:scale-110 transition-transform">🧳</div>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase leading-none tracking-tight">{bagSizeNames[size]}</div>
                      <div className="text-sm font-black text-gray-900 mt-0.5">× {qty}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-gray-50">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.success.itemized}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-left border-b border-gray-50">
                    <th className="pb-2 font-bold text-gray-400 uppercase text-[8px]">{t.success.description}</th>
                    <th className="pb-2 font-bold text-gray-400 uppercase text-[8px] text-right">{t.success.qty}</th>
                    <th className="pb-2 font-bold text-gray-400 uppercase text-[8px] text-right">Price/Day</th>
                    <th className="pb-2 font-bold text-gray-400 uppercase text-[8px] text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {(Object.entries(result.quantities) as [BagSize, number][]).map(([size, qty]) => {
                    if (qty === 0) return null;
                    const rule = PRICING_RULES[size];
                    return (
                      <tr key={size}>
                        <td className="py-2 text-gray-600">{t.success.bagStorage} ({bagSizeNames[size]})</td>
                        <td className="py-2 text-right text-gray-500 font-medium">{qty}</td>
                        <td className="py-2 text-right text-gray-500 font-medium">€{rule.pricePerDay.toFixed(2)}</td>
                        <td className="py-2 text-right font-bold text-gray-900">€{(qty * rule.pricePerDay).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-50">
                    <td colSpan={3} className="pt-3 pb-1 text-right text-gray-400 font-bold uppercase text-[8px]">{t.success.subtotalDaily}</td>
                    <td className="pt-3 pb-1 text-right font-bold text-gray-900">€{result.perDaySubtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-1 text-right text-gray-400 font-bold uppercase text-[8px]">{t.booking.duration}:</td>
                    <td className="py-1 text-right font-bold text-gray-900">× {result.billableDays}</td>
                  </tr>
                  <tr className="border-t border-green-900">
                    <td colSpan={3} className="py-4 text-right font-black text-green-900 uppercase tracking-[0.2em] text-[10px]">{t.success.totalPaid}</td>
                    <td className="py-4 text-right text-3xl font-black text-gray-900">€{result.totalPrice.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100">
            <div className="flex flex-col md:flex-row md:items-end gap-6 w-full">
              {/* Wallet Section */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 md:pl-1">Save your booking pass</p>
                <div className="h-14 flex items-center justify-center md:justify-start">
                  <a 
                    href={walletUrl}
                    className="inline-block transition-all hover:opacity-90 active:opacity-85 transform hover:scale-[1.02]"
                  >
                    <img 
                      src="https://booking.luggagedepositrome.com/assets/google-wallet/add_to_google_wallet_black.png" 
                      alt="Add to Google Wallet" 
                      className="h-10 md:h-12 w-auto"
                    />
                  </a>
                </div>
              </div>

              {/* PDF Download Section */}
              <div className="flex-1">
                <a 
                  href={downloadUrl}
                  className="flex w-full bg-green-900 text-white h-14 rounded-xl font-bold items-center justify-center space-x-2 hover:bg-black transition-all shadow-sm group"
                >
                  <FileDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  <span className="text-sm uppercase tracking-widest">{t.success.download}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-8 border-t border-gray-100 print:hidden">
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