
import React, { useState, useMemo } from 'react';
import { Calendar, Plus, Minus, CreditCard, User, Mail, Phone, Lock, ShieldCheck } from 'lucide-react';
import { differenceInDays, format, isValid, isBefore } from 'date-fns';
// Fix missing exported member by importing from specific subpath
import { parseISO } from 'date-fns/parseISO';
// Fix missing exported member by importing from specific subpath
import { startOfDay } from 'date-fns/startOfDay';
import { BagSize, BookingData, BookingResult, Language } from '../types';
import { PRICING_RULES } from '../constants';
import { TRANSLATIONS } from '../translations';

interface BookingFormProps {
  onComplete: (result: BookingResult) => void;
  language: Language;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onComplete, language }) => {
  const t = TRANSLATIONS[language];
  
  const [formData, setFormData] = useState<BookingData>({
    quantities: {
      [BagSize.SMALL]: 0,
      [BagSize.MEDIUM]: 1, 
      [BagSize.LARGE]: 0,
    },
    dropOffDate: format(new Date(), 'yyyy-MM-dd'),
    pickUpDate: format(new Date(), 'yyyy-MM-dd'),
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const billableDays = useMemo(() => {
    const start = startOfDay(parseISO(formData.dropOffDate));
    const end = startOfDay(parseISO(formData.pickUpDate));
    
    if (!isValid(start) || !isValid(end)) return 0;
    if (isBefore(end, start)) return 0;
    
    const diff = differenceInDays(end, start);
    return diff + 1;
  }, [formData.dropOffDate, formData.pickUpDate]);

  const perDaySubtotal = useMemo(() => {
    return (Object.entries(formData.quantities) as [BagSize, number][]).reduce((acc: number, [size, qty]: [BagSize, number]) => {
      return acc + (PRICING_RULES[size].pricePerDay * qty);
    }, 0);
  }, [formData.quantities]);

  const totalBags = useMemo(() => {
    return (Object.values(formData.quantities) as number[]).reduce((a: number, b: number) => a + b, 0);
  }, [formData.quantities]);

  const totalPrice = perDaySubtotal * billableDays;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const adjustQuantity = (size: BagSize, amount: number) => {
    setFormData(prev => ({
      ...prev,
      quantities: {
        ...prev.quantities,
        [size]: Math.max(0, prev.quantities[size] + amount)
      }
    }));
  };

  const isFormValid = totalBags > 0 && billableDays > 0 && formData.customerName.trim() !== '' && formData.customerEmail.trim() !== '' && formData.customerPhone.trim() !== '';

  const handlePayment = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          language
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const { url } = await response.json();
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const bagSizeNames: Record<BagSize, string> = {
    [BagSize.SMALL]: t.booking.small,
    [BagSize.MEDIUM]: t.booking.medium,
    [BagSize.LARGE]: t.booking.large,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
      <div className="lg:col-span-2 space-y-10">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="w-1.5 h-6 bg-green-900 rounded-full mr-3"></span>
            {t.booking.step1}
          </h2>
          
          <div className="space-y-4">
            {(Object.values(BagSize)).map((size) => {
              const rule = PRICING_RULES[size];
              const qty = formData.quantities[size];
              return (
                <div 
                  key={size}
                  className={`flex items-center justify-between p-6 border rounded-2xl transition-all ${
                    qty > 0 ? 'border-green-900 bg-green-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex-grow">
                    <div className="font-bold text-gray-900">{bagSizeNames[size]}</div>
                    <div className="text-sm text-gray-500 mt-1">{rule.description}</div>
                    <div className="text-green-900 font-bold mt-2 text-sm">€{rule.pricePerDay} / {t.booking.perDay}</div>
                  </div>
                  
                  <div className="flex items-center space-x-4 bg-white rounded-xl border border-gray-200 p-1.5">
                    <button 
                      onClick={() => adjustQuantity(size, -1)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-900 disabled:opacity-20"
                      disabled={qty === 0}
                    >
                      <Minus className="w-4 h-4"/>
                    </button>
                    <span className="text-lg font-bold text-gray-900 w-6 text-center">{qty}</span>
                    <button 
                      onClick={() => adjustQuantity(size, 1)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-900"
                    >
                      <Plus className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="w-1.5 h-6 bg-green-900 rounded-full mr-3"></span>
            {t.booking.step2}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.booking.dropOff}</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input 
                  type="date"
                  name="dropOffDate"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={formData.dropOffDate}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900/10 focus:border-green-900 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.booking.pickUp}</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input 
                  type="date"
                  name="pickUpDate"
                  min={formData.dropOffDate}
                  value={formData.pickUpDate}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900/10 focus:border-green-900 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.booking.fullName}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  name="customerName"
                  placeholder="John Doe"
                  required
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900/10 focus:border-green-900 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.booking.email}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email"
                  name="customerEmail"
                  placeholder="john@example.com"
                  required
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900/10 focus:border-green-900 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.booking.phone}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="tel"
                  name="customerPhone"
                  placeholder="+39 3XX XXX XXXX"
                  required
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900/10 focus:border-green-900 text-sm"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="lg:sticky lg:top-24">
        <div className="bg-white border-2 border-green-900 p-8 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12"></div>
          
          <h3 className="font-bold text-lg mb-8 text-gray-900 relative z-10">{t.booking.summary}</h3>
          
          <div className="space-y-6 mb-8 relative z-10">
            {(Object.entries(formData.quantities) as [BagSize, number][]).map(([size, qty]) => {
              if (qty === 0) return null;
              const rule = PRICING_RULES[size];
              return (
                <div key={size} className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-600">{bagSizeNames[size]} <span className="text-gray-400">× {qty}</span></div>
                  <div className="font-bold text-gray-900 text-sm">€{(qty * rule.pricePerDay).toFixed(2)}/{t.booking.perDay[0]}</div>
                </div>
              );
            })}
            
            <div className="flex justify-between items-center text-green-900 font-bold">
              <span className="text-xs uppercase tracking-widest">{t.booking.subtotalDay}</span>
              <span className="text-lg">€{perDaySubtotal.toFixed(2)}</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>{t.booking.duration}</span>
                <span>{billableDays} {billableDays === 1 ? t.booking.day : t.booking.days}</span>
              </div>
              <div className="text-xs text-gray-400 leading-relaxed italic">
                {billableDays > 0 ? (
                  <>{t.booking.from} {format(parseISO(formData.dropOffDate), 'MMM d')} {t.booking.to} {format(parseISO(formData.pickUpDate), 'MMM d, yyyy')}</>
                ) : (
                  <span className="text-red-400">Invalid range</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end mb-8 pt-4 border-t-2 border-dashed border-gray-100">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">{t.booking.totalDue}</span>
            <span className="text-4xl font-black text-gray-900">€{totalPrice.toFixed(2)}</span>
          </div>

          {error && (
            <p className="mb-4 text-xs text-red-500 font-bold text-center">{error}</p>
          )}

          <button
            onClick={handlePayment}
            disabled={isLoading || !isFormValid}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all transform active:scale-95 ${
              isLoading || !isFormValid
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-900 hover:bg-black text-white shadow-xl'
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span className="text-sm uppercase tracking-widest">{t.booking.payButton}</span>
              </>
            )}
          </button>

          <div className="mt-6 flex items-center justify-center space-x-2 grayscale opacity-50">
             <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-4" alt="Stripe" />
          </div>
        </div>
      </div>
    </div>
  );
};
