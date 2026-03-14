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

  // Fallback if bookingRef is missing (should not happen for new bookings)
  const displayRef = result.bookingRef || result.stripePaymentId.substring(result.stripePaymentId.length - 8).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-fade-in mb-24 md:mb-0 w-full overflow-x-hidden">
      <div className="text-center print:hidden px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-green-900" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">{t.success.confirmed}</h2>
        <p className="text-gray-500 max-w-md mx-auto text-base">
          {t.success.subtitle} <strong className="break-all">{result.customerEmail}</strong>.
        </p>
      </div>

      <div id="receipt-card" className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl overflow-hidden print:hidden w-full mx-auto max-w-full">
        <div className="bg-green-900 p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <img 
                src="https://cdn.shopify.com/s/files/1/0753/8144/0861/files/cropped-Untitled-design-2025-09-11T094640.576_1.png?v=1765462614" 
                alt="Logo" 
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-black tracking-tight leading-none uppercase truncate">Luggage Deposit Rome</h3>
              <p className="text-[10px] sm:text-[11px] text-green-300 uppercase tracking-widest mt-1 font-bold">Booking Confirmation</p>
            </div>
          </div>
          <div className="text-left md:text-right min-w-0">
            <p className="text-[9px] sm:text-[10px] text-green-400 uppercase tracking-widest font-black">Booking Reference</p>
            <p className="text-xl sm:text-2xl font-mono font-black tracking-widest uppercase">#{displayRef}</p>
          </div>
        </div>
        
        <div className="p-6 sm:p-8 md:p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3 min-w-0">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] flex items-center">
                <User className="w-3.5 h-3.5 mr-2 text-green-900" /> {t.success.customerDetails}
              </h4>
              <div className="space-y-1.5">
                <p className="text-base font-bold text-gray-900 break-words">{result.customerName}</p>
                <div className="text-sm text-gray-500 flex items-center gap-2 overflow-wrap-anywhere break-all">
                  <Mail className="w-3 h-3 flex-shrink-0" /> {result.customerEmail}
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Phone className="w-3 h-3 flex-shrink-0" /> {result.customerPhone}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] flex items-center">
                <Clock className="w-3.5 h-3.5 mr-2 text-green-900" /> {t.success.bookedOn}
              </h4>
              <p className="text-base font-bold text-gray-900">{romeTime} <span className="text-xs font-normal text-gray-400 ml-1">(Rome)</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-50">
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-2 text-green-900" /> {t.success.schedule}
              </h4>
              <div className="space-y-5">
                <div className="flex items-start space-x-4">
                  <div className="mt-1 p-2 bg-green-50 rounded-xl flex-shrink-0">
                    <ArrowDownRight className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-0.5">{t.booking.from}</span>
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-base font-black text-gray-900 whitespace-nowrap">
                        {format(parseISO(result.dropOffDate), 'MMM d, yyyy', { locale: dateLocale })}
                      </span>
                      <span className="text-sm font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                        {result.dropOffTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="mt-1 p-2 bg-gray-50 rounded-xl flex-shrink-0">
                    <ArrowUpRight className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-0.5">{t.success.until}</span>
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-base font-black text-gray-900 whitespace-nowrap">
                        {format(parseISO(result.pickUpDate), 'MMM d, yyyy', { locale: dateLocale })}
                      </span>
                      <span className="text-sm font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        {result.pickUpTime}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-1">
                  <div className="inline-flex items-center space-x-2.5 px-4 py-2 bg-green-900 rounded-full text-white shadow-sm">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-black uppercase tracking-widest leading-none">
                      {result.billableDays} {result.billableDays === 1 ? t.booking.day : t.booking.days}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-2 text-green-900" /> {t.success.dropOffPoint}
              </h4>
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <div className="text-[13px] font-bold text-gray-900 leading-relaxed mb-3 break-words">
                  {LOCATION_ADDRESS}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed italic border-l-2 border-gray-200 pl-3">
                  {t.success.receptionInfo}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-gray-50">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">{t.verify.bags}</h4>
            <div className="flex flex-wrap gap-4">
              {(Object.entries(result.quantities) as [BagSize, number][]).map(([size, qty]) => {
                if (qty === 0) return null;
                return (
                  <div key={size} className="flex items-center space-x-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:border-green-200 transition-all group min-w-[140px] flex-grow sm:flex-grow-0">
                    <div className="text-2xl transform group-hover:scale-110 transition-transform">🧳</div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-gray-400 uppercase leading-none tracking-tight truncate">{bagSizeNames[size]}</div>
                      <div className="text-xl font-black text-gray-900 mt-1 whitespace-nowrap">× {qty}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-gray-50">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">{t.success.itemized}</h4>
            <div className="space-y-1">
              {/* Desktop Table Header */}
              <div className="hidden md:grid grid-cols-4 gap-4 px-2 pb-3 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <div>{t.success.description}</div>
                <div className="text-right">{t.success.qty}</div>
                <div className="text-right">Price/Day</div>
                <div className="text-right">Subtotal</div>
              </div>
              
              {/* Line Items - Stacking on mobile, Grid on desktop */}
              <div className="divide-y divide-gray-50/50">
                {(Object.entries(result.quantities) as [BagSize, number][]).map(([size, qty]) => {
                  if (qty === 0) return null;
                  const rule = PRICING_RULES[size];
                  return (
                    <div key={size} className="py-4 md:py-3 px-2 flex flex-col md:grid md:grid-cols-4 md:gap-4 gap-2">
                      <div className="text-xs font-bold md:font-medium text-gray-700 md:text-gray-600">
                        {t.success.bagStorage} ({bagSizeNames[size]})
                      </div>
                      <div className="flex justify-between md:justify-end text-xs items-center">
                        <span className="md:hidden text-[10px] text-gray-400 uppercase font-bold tracking-tight">{t.success.qty}:</span>
                        <span className="text-gray-500 font-bold">{qty}</span>
                      </div>
                      <div className="flex justify-between md:justify-end text-xs items-center">
                        <span className="md:hidden text-[10px] text-gray-400 uppercase font-bold tracking-tight">Price/Day:</span>
                        <span className="text-gray-500 font-medium">€{rule.pricePerDay.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between md:justify-end text-xs items-center">
                        <span className="md:hidden text-[10px] text-gray-400 uppercase font-bold tracking-tight">Subtotal:</span>
                        <span className="font-black text-gray-900">€{(qty * rule.pricePerDay).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals Section */}
              <div className="mt-4 space-y-2 border-t border-gray-50 pt-4 px-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.success.subtotalDaily}</span>
                  <span className="text-sm font-black text-gray-900">€{result.perDaySubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.booking.duration}:</span>
                  <span className="text-sm font-black text-gray-900">× {result.billableDays}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 pb-2 border-t-2 border-green-900 gap-2">
                  <span className="font-black text-green-900 uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[11px]">{t.success.totalPaid}</span>
                  <span className="text-3xl sm:text-4xl font-black text-gray-900 whitespace-nowrap">€{result.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100">
            <div className="flex flex-col md:flex-row md:items-end gap-6 w-full">
              {/* Wallet Section */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 md:pl-1 text-center md:text-left">Save your booking pass</p>
                <a 
                  href={walletUrl}
                  className="flex w-full bg-black text-white h-14 rounded-xl font-bold items-center justify-center space-x-3 hover:bg-gray-900 transition-all shadow-md transform active:scale-[0.98] px-4 min-w-0"
                >
                  <img 
                    src="https://booking.luggagedepositrome.com/assets/google-wallet/google-wallet-icon.png" 
                    alt="" 
                    className="h-6 w-auto flex-shrink-0"
                  />
                  <span className="text-sm uppercase tracking-widest whitespace-nowrap overflow-hidden">
                    {language === 'en' ? (
                      <>ADD TO <span className="hidden min-[380px]:inline">GOOGLE </span>WALLET</>
                    ) : (
                      <>AGGIUNGI A<span className="hidden min-[380px]:inline">L GOOGLE</span> WALLET</>
                    )}
                  </span>
                </a>
              </div>

              {/* PDF Download Section */}
              <div className="flex-1 min-w-0">
                <a 
                  href={downloadUrl}
                  className="flex w-full bg-green-900 text-white h-14 rounded-xl font-bold items-center justify-center space-x-2.5 hover:bg-black transition-all shadow-md group transform active:scale-[0.98] px-4 min-w-0"
                >
                  <FileDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform flex-shrink-0" />
                  <span className="text-sm uppercase tracking-widest whitespace-nowrap">{t.success.download}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-8 border-t border-gray-100 print:hidden px-4">
        <button 
          onClick={onReset}
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-green-900 font-bold transition-colors text-xs uppercase tracking-widest px-4 py-2 bg-gray-50 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.success.anotherBooking}</span>
        </button>
      </div>
    </div>
  );
};