import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BookingForm from './components/BookingForm';
import SummaryCard from './components/SummaryCard';
import SuccessView from './components/SuccessView';
import PaymentModal from './components/PaymentModal';
import { BagSize, BookingDetails, PaymentStatus, BagQuantities, Language } from './types';
import { calculateBillableDays, calculateTotal, saveBooking, generateBookingId } from './services/bookingService';
import { Loader2 } from 'lucide-react';
import { translations } from './translations';

const App: React.FC = () => {
  // State
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
  const [status, setStatus] = useState<'input' | 'processing' | 'success'>('input');
  const [completedBooking, setCompletedBooking] = useState<BookingDetails | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Effects
  useEffect(() => {
    const days = calculateBillableDays(formData.dropOffDate, formData.pickUpDate);
    const total = calculateTotal(formData.bagQuantities, days);
    
    setBillableDays(days);
    setTotalPrice(total);
  }, [formData]);

  // Handlers
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      // Logic constraint: Pickup cannot be before dropoff
      if (field === 'dropOffDate') {
         if (prev.pickUpDate && new Date(value) > new Date(prev.pickUpDate)) {
            return { ...prev, [field]: value, pickUpDate: value };
         }
      }
      if (field === 'pickUpDate') {
         if (prev.dropOffDate && new Date(value) < new Date(prev.dropOffDate)) {
            return prev; // Do nothing if trying to select invalid date
         }
      }
      return { ...prev, [field]: value };
    });
  };

  const handleQuantityChange = (size: BagSize, delta: number) => {
    setFormData(prev => {
      const currentQty = prev.bagQuantities[size];
      const newQty = Math.max(0, currentQty + delta); // Prevent negative
      return {
        ...prev,
        bagQuantities: {
          ...prev.bagQuantities,
          [size]: newQty
        }
      };
    });
  };

  const handleReserveClick = () => {
    const t = translations[language].alerts;
    const totalBags = Object.values(formData.bagQuantities).reduce((a: number, b: number) => a + b, 0);

    if (totalBags === 0) {
      alert(t.selectBag);
      return;
    }
    if (!formData.customerName.trim() || !formData.customerEmail.trim() || !formData.customerPhone.trim()) {
      alert(t.enterDetails);
      return;
    }
    if (billableDays <= 0) {
      alert(t.validDates);
      return;
    }

    // Open Payment Modal instead of direct processing
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setIsPaymentModalOpen(false);
    setStatus('processing');

    // Create Booking Object
    const booking: BookingDetails = {
      id: generateBookingId(),
      bagQuantities: formData.bagQuantities,
      dropOffDate: formData.dropOffDate,
      pickUpDate: formData.pickUpDate,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      billableDays,
      totalPrice,
      paymentStatus: PaymentStatus.Paid,
      stripePaymentId: paymentId,
      timestamp: new Date().toISOString()
    };

    // Save Data
    saveBooking(booking);
    setCompletedBooking(booking);
    setStatus('success');
    window.scrollTo(0,0);
  };

  const resetFlow = () => {
    setFormData({
      bagQuantities: {
        [BagSize.Small]: 0,
        [BagSize.Medium]: 0,
        [BagSize.Large]: 0,
      },
      dropOffDate: '',
      pickUpDate: '',
      customerName: '',
      customerEmail: '',
      customerPhone: ''
    });
    setCompletedBooking(null);
    setStatus('input');
  };

  const totalBags = Object.values(formData.bagQuantities).reduce((a: number, b: number) => a + b, 0);
  const tHero = translations[language].hero;
  const tSummary = translations[language].summary;

  return (
    <div className="min-h-screen bg-white pb-24 print:bg-white print:pb-0">
      {/* Hide header when printing */}
      <div className="print:hidden">
        <Header language={language} setLanguage={setLanguage} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 print:p-0 print:max-w-none">
        {status === 'success' && completedBooking ? (
          <SuccessView booking={completedBooking} onReset={resetFlow} language={language} />
        ) : (
          <>
            {/* Header Text */}
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                {tHero.title} <span className="text-green-900">{tHero.city}</span>
              </h1>
              <p className="text-lg text-gray-600">
                {tHero.subtitle}
              </p>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Form Section */}
              <div className="lg:col-span-2">
                 <BookingForm 
                    formData={formData} 
                    onChange={handleInputChange}
                    onQuantityChange={handleQuantityChange}
                    language={language}
                 />
              </div>

              {/* Summary Section - Sticky Desktop */}
              <div className="hidden md:block lg:col-span-1">
                <SummaryCard 
                  {...formData}
                  billableDays={billableDays}
                  totalPrice={totalPrice}
                  onPay={handleReserveClick}
                  isProcessing={status === 'processing'}
                  language={language}
                />
              </div>
            </div>
          </>
        )}
      </main>

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        totalPrice={totalPrice}
        customerEmail={formData.customerEmail}
        language={language}
      />

      {/* Mobile Sticky Footer */}
      {status !== 'success' && !isPaymentModalOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">{tSummary.total}</span>
              <span className="text-xl font-bold text-green-900">€{totalPrice.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleReserveClick}
              disabled={status === 'processing' || !formData.dropOffDate || !formData.pickUpDate || totalBags === 0}
              className={`flex-1 py-3 px-6 rounded-lg font-bold text-white shadow-md
                ${status === 'processing' || !formData.dropOffDate || totalBags === 0 ? 'bg-gray-300' : 'bg-green-900 active:bg-green-800'}`}
            >
              {status === 'processing' ? <Loader2 className="animate-spin mx-auto" /> : tSummary.payReserve}
            </button>
          </div>
        </div>
      )}
      
      {/* Visual Overlay for Main Processing (Post-Payment) */}
      {status === 'processing' && !isPaymentModalOpen && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[60] flex flex-col items-center justify-center print:hidden">
           <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 flex flex-col items-center text-center max-w-sm mx-4">
              <div className="w-16 h-16 border-4 border-green-900 border-t-transparent rounded-full animate-spin mb-6"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Finalizing Booking</h3>
              <p className="text-gray-500">Please wait while we secure your reservation...</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;