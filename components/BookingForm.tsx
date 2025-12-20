
import React, { useState, useMemo } from 'react';
import { Calendar, Plus, Minus, CreditCard, User, Mail, Phone, Clock, Info } from 'lucide-react';
import { differenceInDays, format, isValid, isBefore } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
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
  
  const generateTimeOptions = () => {
    const options = [];
    // Limit range from 08:30 to 21:30
    for (let h = 8; h <= 21; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 8 && m === 0) continue; // Start at 8:30
        if (h === 21 && m > 30) continue; // End at 21:30
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  const timeOptions = useMemo(() => generateTimeOptions(), []);

  const [formData, setFormData] = useState<BookingData>({
    quantities: {
      [BagSize.SMALL]: 0,
      [BagSize.MEDIUM]: 1, 
      [BagSize.LARGE]: 0,
    },
    dropOffDate: format(new Date(), 'yyyy-MM-dd'),
    dropOffTime: '09:00',
    pickUpDate: format(new Date(), 'yyyy-MM-dd'),
    pickUpTime: '18:00',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const isFormValid = useMemo(() => {
    return (
      totalBags > 0 && 
      billableDays > 0 && 
      formData.customerName.trim().length >= 2 && 
      isValidEmail(formData.customerEmail) && 
      formData.customerPhone.trim().length >= 5
    );
  }, [totalBags, billableDays, formData.customerName, formData.customerEmail, formData.customerPhone]);

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

  const bagSizeDescriptions: Record<BagSize, string> = {
    [BagSize.SMALL]: t.booking.smallDesc,
    [BagSize.MEDIUM]: t.booking.mediumDesc,
    [BagSize.LARGE]: t.booking.largeDesc,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
      <div className="lg:col-span-2 space-y-12">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
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
                  <div className="flex-grow pr-8">
                    <div className="font-bold text-gray-900">{bagSizeNames[size]}</div>
                    <div className="text-sm text-gray-500 mt-1 leading-snug">{bagSizeDescriptions[size]}</div>
                    <div className="text-green-900 font-bold mt-2 text-sm">€{rule.pricePerDay} / {t.booking.perDay}</div>
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center space-x-4 bg-white rounded-xl border border-gray-200 p-1.5 h-fit self-center">
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
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 flex items-center mb-6">
              <span className="w-1.5 h-6 bg-green-900 rounded-full mr-3"></span>
              {t.booking.step2}
            </h2>
            <div className="flex items-start md:items-center space-x-4 bg-red-50 border border-red-100 p-6 rounded-2xl shadow-sm">
              <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-600 shadow-sm border border-red-50">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="text-red-700 text-sm font-black leading-tight mb-0.5 tracking-tight">
                  {t.booking.attentionLabel}
                </p>
                <p className="text-red-600 text-[13px] font-bold leading-relaxed">
                  {t.booking.fridayDisclaimer}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-10 mb-12">
            {/* Drop Off Group */}
            <div className="space-y-4 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
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
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900/10 focus:border-green-900 text-sm font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.booking.dropOffTime}</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select 
                    name="dropOffTime"
                    value={formData.dropOffTime}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900/10 focus:border-green-900 text-sm appearance-none bg-white font-medium"
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Pick Up Group */}
            <div className="space-y-4 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
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
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900/10 focus:border-green-900 text-sm font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.booking.pickUpTime}</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select 
                    name="pickUpTime"
                    value={formData.pickUpTime}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900/10 focus:border-green-900 text-sm appearance-none bg-white font-medium"
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-gray-100">
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
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900/10 focus:border-green-900 text-sm font-medium"
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
                  className={`w-full pl-12 pr-4 py-4 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-green-900/10 text-sm font-medium ${
                    formData.customerEmail.length > 0 && !isValidEmail(formData.customerEmail) 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-200 focus:border-green-900'
                  }`}
                />
              </div>
              {formData.customerEmail.length > 0 && !isValidEmail(formData.customerEmail) && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider pl-1">Please enter a valid email address</p>
              )}
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
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900/10 focus:border-green-900 text-sm font-medium"
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
                  <div className="space-y-1">
                    <div>{t.booking.from} {format(parseISO(formData.dropOffDate), 'MMM d')} @ {formData.dropOffTime}</div>
                    <div>{t.booking.to} {format(parseISO(formData.pickUpDate), 'MMM d, yyyy')} @ {formData.pickUpTime}</div>
                  </div>
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
        </div>
      </div>
    </div>
  );
};
