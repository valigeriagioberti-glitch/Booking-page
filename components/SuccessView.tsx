
import React from 'react';
import { CheckCircle, ArrowLeft, Printer, FileDown, MapPin, Calendar, Briefcase, User, Mail, Clock, Phone, ExternalLink } from 'lucide-react';
import { BookingResult, BagSize, Language } from '../types';
import { format } from 'date-fns';
// Fix missing exported member by importing from specific subpath
import { parseISO } from 'date-fns/parseISO';
// Fix missing exported members by importing from specific subpaths
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

  const handlePrint = () => {
    window.print();
  };

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

      <div id="receipt-card" className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden print:shadow-none print:border-none print:m-0">
        <div className="bg-green-900 p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:bg-white print:text-gray-900 print:border-b-2 print:border-gray-100 print:px-0 print:py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-lg print:hidden">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight leading-none print:text-2xl">LUGGAGE DEPOSIT ROME</h3>
              <p className="text-xs text-green-200 uppercase tracking-widest mt-1 font-bold print:text-gray-500">luggagedepositrome.com</p>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[10px] text-green-300 uppercase tracking-widest font-black print:text-gray-400">{t.success.resId}</p>
            <p className="text-lg font-mono font-bold print:text-xl">{result.stripePaymentId}</p>
          </div>
        </div>
        
        <div className="p-8 md:p-12 space-y-10 print:px-0 print:py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                <User className="w-3 h-3 mr-1.5" /> {t.success.customerDetails}
              </h4>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900">{result.customerName}</p>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Mail className="w-3 h-3" /> {result.customerEmail}
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Phone className="w-3 h-3" /> {result.customerPhone}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                <Clock className="w-3 h-3 mr-1.5" /> {t.success.bookedOn}
              </h4>
              <p className="text-sm font-bold text-gray-900">{romeTime}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                <Calendar className="w-3 h-3 mr-1.5" /> {t.success.schedule}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <span className="w-20 text-gray-400 font-bold uppercase text-[9px]">{t.booking.from}</span>
                  <span className="font-bold text-gray-900">{format(parseISO(result.dropOffDate), 'EEEE, MMM d, yyyy', { locale: dateLocale })}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-20 text-gray-400 font-bold uppercase text-[9px]">{t.success.until}</span>
                  <span className="font-bold text-gray-900">{format(parseISO(result.pickUpDate), 'EEEE, MMM d, yyyy', { locale: dateLocale })}</span>
                </div>
                <div className="flex items-center text-sm pt-1">
                  <span className="w-20"></span>
                  <span className="bg-green-50 text-green-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider print:border print:border-green-100">
                    {result.billableDays} {result.billableDays === 1 ? t.booking.day : t.booking.days}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                <MapPin className="w-3 h-3 mr-1.5" /> {t.success.dropOffPoint}
              </h4>
              <div className="text-sm font-bold text-gray-900 leading-relaxed max-w-xs">
                {LOCATION_ADDRESS}
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(LOCATION_ADDRESS)}`}
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center text-[10px] text-green-700 font-bold uppercase tracking-wider hover:underline print:hidden"
              >
                <ExternalLink className="w-3 h-3 mr-1" /> View on Maps
              </a>
              <p className="text-[10px] text-gray-400 leading-relaxed italic">
                {t.success.receptionInfo}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-gray-50">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.success.itemized}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="py-3 font-bold text-gray-400 uppercase text-[9px]">{t.success.description}</th>
                    <th className="py-3 font-bold text-gray-400 uppercase text-[9px] text-right">{t.success.qty}</th>
                    <th className="py-3 font-bold text-gray-400 uppercase text-[9px] text-right">{t.success.priceDay}</th>
                    <th className="py-3 font-bold text-gray-400 uppercase text-[9px] text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(Object.entries(result.quantities) as [BagSize, number][]).map(([size, qty]) => {
                    if (qty === 0) return null;
                    const rule = PRICING_RULES[size];
                    return (
                      <tr key={size}>
                        <td className="py-4 font-bold text-gray-900">{t.success.bagStorage} ({bagSizeNames[size]})</td>
                        <td className="py-4 text-right font-medium text-gray-600">{qty}</td>
                        <td className="py-4 text-right font-medium text-gray-600">€{rule.pricePerDay.toFixed(2)}</td>
                        <td className="py-4 text-right font-bold text-gray-900">€{(qty * rule.pricePerDay).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-100">
                    <td colSpan={3} className="py-4 text-right text-gray-500 font-medium">{t.success.subtotalDaily}</td>
                    <td className="py-4 text-right font-bold text-gray-900">€{result.perDaySubtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-1 text-right text-gray-500 font-medium">{t.booking.duration}:</td>
                    <td className="py-1 text-right font-bold text-gray-900">× {result.billableDays} {result.billableDays === 1 ? t.booking.day : t.booking.days}</td>
                  </tr>
                  <tr className="border-t-2 border-gray-900 print:border-gray-200">
                    <td colSpan={3} className="py-6 text-right font-black text-gray-900 uppercase tracking-widest">{t.success.totalPaid}</td>
                    <td className="py-6 text-right text-3xl font-black text-gray-900">€{result.totalPrice.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="hidden print:block p-8 pt-0 text-center border-t border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{t.success.thankYou}</p>
          <p className="text-[9px] text-gray-300 mt-2 italic">{t.success.visitUs}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4 print:hidden">
        <button 
          onClick={handlePrint}
          className="flex-1 bg-green-900 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-black transition-all shadow-xl group"
        >
          <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm uppercase tracking-widest">{t.success.print}</span>
        </button>
        <button 
          onClick={handlePrint}
          className="flex-1 bg-white text-gray-900 border-2 border-gray-900 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-50 transition-all shadow-sm group"
        >
          <FileDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          <span className="text-sm uppercase tracking-widest">{t.success.download}</span>
        </button>
      </div>

      <div className="text-center print:hidden">
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
