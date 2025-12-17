import React from 'react';
import { BagSize, BagQuantities, Language } from '../types';
import { PRICES } from '../constants';
import { Loader2 } from 'lucide-react';
import { calculateDailySubtotal } from '../services/bookingService';
import { translations } from '../translations';

interface SummaryCardProps {
  bagQuantities: BagQuantities;
  dropOffDate: string;
  pickUpDate: string;
  billableDays: number;
  totalPrice: number;
  onPay: () => void;
  isProcessing: boolean;
  language: Language;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  bagQuantities,
  dropOffDate,
  pickUpDate,
  billableDays,
  totalPrice,
  onPay,
  isProcessing,
  language
}) => {
  const t = translations[language].summary;
  const dailySubtotal = calculateDailySubtotal(bagQuantities);
  const totalBags = Object.values(bagQuantities).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
      <div className="bg-gray-50 p-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800">{t.title}</h3>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Dates */}
        <div className="space-y-2 text-sm border-b border-gray-100 pb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">{t.dropOff}</span>
            <span className="font-medium text-gray-900">{dropOffDate || '--'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t.pickUp}</span>
            <span className="font-medium text-gray-900">{pickUpDate || '--'}</span>
          </div>
          <div className="flex justify-between text-green-900 font-medium">
            <span>{t.duration}</span>
            <span>{billableDays} {billableDays !== 1 ? t.days : t.day}</span>
          </div>
        </div>

        {/* Bag Breakdown */}
        <div className="space-y-2 text-sm">
           {Object.values(BagSize).map(size => {
             const qty = bagQuantities[size];
             const price = PRICES[size].pricePerDay;
             return (
               <div key={size} className="flex justify-between items-center">
                 <span className={`text-gray-600 ${qty === 0 ? 'opacity-50' : ''}`}>
                    {size} <span className="text-xs">(@€{price}/d)</span>
                 </span>
                 <span className={`font-medium ${qty > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                   {qty}
                 </span>
               </div>
             )
           })}
        </div>

        <hr className="border-gray-100" />
        
        {/* Subtotals */}
        <div className="space-y-2 text-sm">
           <div className="flex justify-between items-center">
             <span className="text-gray-600">{t.perDaySubtotal}</span>
             <span className="font-semibold text-gray-900">€{dailySubtotal.toFixed(2)}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-gray-600">{t.billableDays}</span>
             <span className="font-semibold text-gray-900">x {billableDays}</span>
           </div>
        </div>

        <hr className="border-gray-100" />

        {/* Total */}
        <div className="flex justify-between items-end pt-2">
          <span className="text-lg font-bold text-gray-800">{t.total}</span>
          <span className="text-2xl font-bold text-green-900">€{totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Button - Desktop */}
      <div className="p-6 bg-gray-50 border-t border-gray-100 hidden md:block">
        <button
          onClick={onPay}
          disabled={isProcessing || !dropOffDate || !pickUpDate || totalBags === 0}
          className={`w-full py-4 px-6 rounded-lg font-bold text-lg text-white shadow-md transition-all transform hover:-translate-y-0.5
            ${isProcessing || !dropOffDate || !pickUpDate || totalBags === 0
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-green-900 hover:bg-green-800 hover:shadow-lg'}`}
        >
          {isProcessing ? (
             <span className="flex items-center justify-center gap-2">
               <Loader2 className="animate-spin" size={20}/> {t.processing}
             </span>
          ) : (
             totalBags === 0 ? t.selectBags : t.payReserve
          )}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/></svg>
          {t.securePayment}
        </p>
      </div>
    </div>
  );
};

export default SummaryCard;