import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import BookingForm from '../components/BookingForm';
import SummaryCard from '../components/SummaryCard';
import PaymentModal from '../components/PaymentModal';
import { BagSize, BagQuantities, Language } from '../types';
import { calculateBillableDays, calculateTotal, generateBookingId } from '../services/bookingService';
import { translations } from '../translations';

const Home: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [formData, setFormData] = useState({
    bagQuantities: {
      [BagSize.Small]: 0,
      [BagSize.Medium]: 0,
      [BagSize.Large]: 0,
    } as BagQuantities,
    dropOffDate: '',
    pickUpDate: '',
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });

  const [billableDays, setBillableDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // --- CALCULATIONS ---
  useEffect(() => {
    const days = calculateBillableDays(formData.dropOffDate, formData.pickUpDate);
    const total = calculateTotal(formData.bagQuantities, days);
    
    setBillableDays(days);
    setTotalPrice(total);
  }, [formData]);

  // --- HANDLERS ---
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      if (field === 'dropOffDate') {
         if (prev.pickUpDate && new Date(value) > new Date(prev.pickUpDate)) {
            return { ...prev, [field]: value, pickUpDate: value };
         }
      }
      if (field === 'pickUpDate') {
         if (prev.dropOffDate && new Date(value) < new Date(prev.dropOffDate)) {
            return prev;
         }
      }
      return { ...prev, [field]: value };
    });
  };

  const handleQuantityChange = (size: BagSize, delta: number) => {
    setFormData(prev => {
      const currentQty = prev.bagQuantities[size];
      const newQty = Math.max(0, currentQty + delta);
      return { ...prev, bagQuantities: { ...prev.bagQuantities, [size]: newQty } };
    });
  };

  const handleReserveClick = () => {
    const t = translations[language].alerts;
    const totalBags = Object.values(formData.bagQuantities).reduce((a: number, b: number) => a + b, 0);

    if (totalBags === 0) return alert(t.selectBag);
    if (!formData.customerName.trim() || !formData.customerEmail.trim() || !formData.customerPhone.trim()) {
      return alert(t.enterDetails);
    }
    if (billableDays <= 0) return alert(t.validDates);

    setIsPaymentModalOpen(true);
  };

  const tHero = translations[language].hero;
  const tSummary = translations[language].summary;
  const totalBags = Object.values(formData.bagQuantities).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="min-h-screen bg-white pb-24 print:bg-white print:pb-0">
      <div className="print:hidden">
        <Header language={language} setLanguage={setLanguage} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 print:p-0 print:max-w-none">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            {tHero.title} <span className="text-green-900">{tHero.city}</span>
          </h1>
          <p className="text-lg text-gray-600">{tHero.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
              <BookingForm 
                formData={formData} 
                onChange={handleInputChange}
                onQuantityChange={handleQuantityChange}
                language={language}
              />
          </div>
          <div className="hidden md:block lg:col-span-1">
            <SummaryCard 
              {...formData}
              billableDays={billableDays}
              totalPrice={totalPrice}
              onPay={handleReserveClick}
              isProcessing={false}
              language={language}
            />
          </div>
        </div>
      </main>

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        bookingData={{ ...formData, bookingId: generateBookingId() }}
        totalPrice={totalPrice}
        language={language}
      />

      {!isPaymentModalOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">{tSummary.total}</span>
              <span className="text-xl font-bold text-green-900">€{totalPrice.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleReserveClick}
              disabled={!formData.dropOffDate || !formData.pickUpDate || totalBags === 0}
              className={`flex-1 py-3 px-6 rounded-lg font-bold text-white shadow-md
                ${!formData.dropOffDate || totalBags === 0 ? 'bg-gray-300' : 'bg-green-900 active:bg-green-800'}`}
            >
              {tSummary.payReserve}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;