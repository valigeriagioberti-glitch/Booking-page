import React from 'react';
import { BagSize, BagQuantities } from '../types';
import { PRICES } from '../constants';
import { Calendar, User, Mail, Phone, Briefcase, Info, Plus, Minus } from 'lucide-react';

interface BookingFormProps {
  formData: {
    bagQuantities: BagQuantities;
    dropOffDate: string;
    pickUpDate: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  onChange: (field: string, value: any) => void;
  onQuantityChange: (size: BagSize, delta: number) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ formData, onChange, onQuantityChange }) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Your Space</h2>
        <p className="text-gray-500">Select your dates and luggage details below.</p>
      </div>

      {/* Bag Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
          1. Select Bags
        </label>
        <div className="grid grid-cols-1 gap-4">
          {Object.values(BagSize).map((size) => {
            const qty = formData.bagQuantities[size];
            return (
              <div 
                key={size}
                className={`relative rounded-lg border-2 p-4 transition-all duration-200 flex flex-col sm:flex-row items-center justify-between gap-4
                  ${qty > 0 
                    ? 'border-green-900 bg-green-50 ring-1 ring-green-900' 
                    : 'border-gray-100 bg-white hover:border-gray-200'}`}
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                   <div className={`p-3 rounded-lg ${qty > 0 ? 'bg-green-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <Briefcase size={24} />
                   </div>
                   <div>
                     <h3 className="font-bold text-gray-900 text-lg">{size}</h3>
                     <p className="text-sm text-gray-500">{PRICES[size].description}</p>
                     <div className="font-semibold text-green-900 mt-0.5">€{PRICES[size].pricePerDay}/day</div>
                   </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onQuantityChange(size, -1)}
                    disabled={qty === 0}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors
                      ${qty === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Minus size={18} />
                  </button>
                  <span className={`w-8 text-center text-xl font-bold ${qty > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                    {qty}
                  </span>
                  <button 
                    onClick={() => onQuantityChange(size, 1)}
                    className="w-10 h-10 rounded-full border border-gray-300 text-green-900 flex items-center justify-center hover:bg-green-50 hover:border-green-900 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
          2. Dates
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar size={16} /> Drop-off Date
            </label>
            <input 
              type="date" 
              min={today}
              value={formData.dropOffDate}
              onChange={(e) => onChange('dropOffDate', e.target.value)}
              className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-900 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar size={16} /> Pick-up Date
            </label>
            <input 
              type="date" 
              min={formData.dropOffDate || today}
              value={formData.pickUpDate}
              onChange={(e) => onChange('pickUpDate', e.target.value)}
              className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-900 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex items-start gap-2 bg-green-50 text-green-900 text-sm p-3 rounded-md">
          <Info size={18} className="mt-0.5 flex-shrink-0" />
          <p>Drop-off day is counted as a full billable day regardless of time.</p>
        </div>
      </div>

      {/* Personal Info */}
      <div className="space-y-4 border-t border-gray-100 pt-6">
        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
          3. Your Details <span className="text-red-500 font-normal normal-case ml-1">(Required)</span>
        </label>
        <div className="grid grid-cols-1 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={18} className="text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Full Name *"
              required
              value={formData.customerName}
              onChange={(e) => onChange('customerName', e.target.value)}
              className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-900 focus:border-transparent outline-none"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-gray-400" />
            </div>
            <input 
              type="email" 
              placeholder="Email Address *"
              required
              value={formData.customerEmail}
              onChange={(e) => onChange('customerEmail', e.target.value)}
              className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-900 focus:border-transparent outline-none"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone size={18} className="text-gray-400" />
            </div>
            <input 
              type="tel" 
              placeholder="Phone Number *"
              required
              value={formData.customerPhone}
              onChange={(e) => onChange('customerPhone', e.target.value)}
              className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-900 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;