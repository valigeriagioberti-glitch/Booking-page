import React from 'react';
import { BookingDetails, BagSize } from '../types';
import { PRICES } from '../constants';
import { CheckCircle, Calendar, Package, Printer, ArrowLeft, Download, Briefcase } from 'lucide-react';
import { calculateDailySubtotal } from '../services/bookingService';

interface SuccessViewProps {
  booking: BookingDetails;
  onReset: () => void;
}

const SuccessView: React.FC<SuccessViewProps> = ({ booking, onReset }) => {
  const dailySubtotal = calculateDailySubtotal(booking.bagQuantities);
  
  // Format dates
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* 
        SCREEN VIEW 
        Visible only on screen, hidden when printing 
      */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden print:hidden">
        
        {/* Success Header */}
        <div className="bg-green-50 p-8 text-center border-b border-gray-100">
          <div className="bg-green-100 text-green-900 rounded-full p-4 inline-flex items-center justify-center mb-4 shadow-sm ring-4 ring-white">
            <CheckCircle size={48} strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed ✅</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Your luggage storage reservation is confirmed. We've sent a confirmation email to <span className="font-semibold text-gray-900">{booking.customerEmail}</span>.
          </p>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Booking ID & Status */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-6 rounded-lg border border-gray-200 gap-4">
             <div className="text-center md:text-left">
               <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Booking Reference</p>
               <p className="text-2xl font-mono font-bold text-gray-900 tracking-tight">{booking.id}</p>
             </div>
             <div className="flex flex-col items-center md:items-end">
               <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Payment Status</p>
               <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                 PAID via Stripe
               </span>
             </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column: Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="text-green-900" size={20} /> Schedule
              </h3>
              <div className="space-y-3 pl-2 border-l-2 border-gray-100 ml-2">
                <div>
                  <p className="text-sm text-gray-500">Drop-off</p>
                  <p className="font-medium text-gray-900">{formatDate(booking.dropOffDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pick-up</p>
                  <p className="font-medium text-gray-900">{formatDate(booking.pickUpDate)}</p>
                </div>
                <div>
                   <p className="text-sm text-gray-500">Total Duration</p>
                   <p className="font-medium text-green-900">{booking.billableDays} Day{booking.billableDays > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Customer */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserIcon /> Customer Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2 border border-gray-100">
                <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{booking.customerName}</span></p>
                <p><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{booking.customerEmail}</span></p>
                <p><span className="text-gray-500">Phone:</span> <span className="font-medium text-gray-900">{booking.customerPhone}</span></p>
                <p><span className="text-gray-500">Booked on:</span> <span className="font-medium text-gray-900">{new Date(booking.timestamp).toLocaleString()}</span></p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Bag Breakdown Table */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="text-green-900" size={20} /> Order Summary
            </h3>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal (Day)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(booking.bagQuantities).map(([size, qty]) => {
                     const quantity = qty as number;
                     if (quantity === 0) return null;
                     const price = PRICES[size as BagSize].pricePerDay;
                     return (
                      <tr key={size}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{size} Bag</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">€{price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">€{(quantity * price).toFixed(2)}</td>
                      </tr>
                     );
                  })}
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-4 text-sm font-bold text-gray-700 text-right">Per-Day Subtotal</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">€{dailySubtotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <div className="w-full md:w-1/2 bg-green-50 rounded-lg p-6 flex justify-between items-center border border-green-100">
                <div>
                  <p className="text-sm text-green-800">Total Billable Days</p>
                  <p className="text-sm text-green-800">Daily Rate</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-900">x {booking.billableDays}</p>
                  <p className="text-sm font-medium text-green-900">€{dailySubtotal.toFixed(2)}</p>
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <p className="text-3xl font-bold text-green-900">€{booking.totalPrice.toFixed(2)}</p>
                    <p className="text-xs text-green-700 uppercase font-bold mt-1">Total Paid</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
            <button 
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-3 px-6 rounded-lg font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <Printer size={20} /> Print Receipt
            </button>
            <button 
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-3 px-6 rounded-lg font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <Download size={20} /> Download PDF
            </button>
            <button 
              onClick={onReset}
              className="flex-1 flex items-center justify-center gap-2 bg-green-900 text-white py-3 px-6 rounded-lg font-bold hover:bg-green-800 shadow-md hover:shadow-lg transition-all"
            >
              <ArrowLeft size={20} /> New Booking
            </button>
          </div>
        </div>
      </div>

      {/* 
        PRINT VIEW (Receipt Layout)
        Hidden on screen, Visible only when printing 
        Tailwind `hidden print:block`
      */}
      <div className="hidden print:block p-8 bg-white text-black max-w-[210mm] mx-auto">
        {/* Print Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
          <div className="flex items-center gap-3">
             <Briefcase size={32} className="text-black" />
             <div>
                <h1 className="text-2xl font-bold uppercase tracking-wider">Luggage Deposit Rome</h1>
                <p className="text-sm text-gray-600">luggagedepositrome.com</p>
             </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">RECEIPT</h2>
            <p className="text-sm text-gray-600">#{booking.id}</p>
            <p className="text-sm text-gray-600">{new Date(booking.timestamp).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-12 mb-8">
          <div>
            <h3 className="font-bold border-b border-gray-300 mb-2 pb-1 text-sm uppercase">Billed To</h3>
            <p className="font-medium">{booking.customerName}</p>
            <p className="text-sm">{booking.customerEmail}</p>
            <p className="text-sm">{booking.customerPhone}</p>
            <p className="text-sm mt-2">Paid via Credit Card (Stripe)</p>
          </div>
          <div>
            <h3 className="font-bold border-b border-gray-300 mb-2 pb-1 text-sm uppercase">Booking Details</h3>
            <div className="grid grid-cols-2 text-sm gap-y-1">
              <span className="text-gray-600">Drop-off:</span>
              <span className="font-medium">{formatDate(booking.dropOffDate)}</span>
              <span className="text-gray-600">Pick-up:</span>
              <span className="font-medium">{formatDate(booking.pickUpDate)}</span>
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{booking.billableDays} Days</span>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
           <table className="w-full text-sm">
             <thead>
               <tr className="border-b-2 border-black">
                 <th className="text-left py-2 font-bold uppercase">Description</th>
                 <th className="text-right py-2 font-bold uppercase">Qty</th>
                 <th className="text-right py-2 font-bold uppercase">Rate</th>
                 <th className="text-right py-2 font-bold uppercase">Amount</th>
               </tr>
             </thead>
             <tbody>
              {Object.entries(booking.bagQuantities).map(([size, qty]) => {
                     const quantity = qty as number;
                     if (quantity === 0) return null;
                     const price = PRICES[size as BagSize].pricePerDay;
                     return (
                      <tr key={size} className="border-b border-gray-200">
                        <td className="py-3">{size} Luggage Storage</td>
                        <td className="py-3 text-right">{quantity}</td>
                        <td className="py-3 text-right">€{price.toFixed(2)}</td>
                        <td className="py-3 text-right font-medium">€{(quantity * price).toFixed(2)}</td>
                      </tr>
                     );
                  })}
             </tbody>
           </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
           <div className="w-1/2">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span>Subtotal (per day)</span>
                <span>€{dailySubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span>Billable Days</span>
                <span>x {booking.billableDays}</span>
              </div>
              <div className="flex justify-between py-3 border-b-2 border-black text-xl font-bold">
                <span>Total Paid</span>
                <span>€{booking.totalPrice.toFixed(2)}</span>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
          <p className="font-medium text-black mb-1">Thank you for choosing Luggage Deposit Rome!</p>
          <p>For assistance, please contact support@luggagedepositrome.com</p>
        </div>
      </div>
    </div>
  );
};

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-900"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export default SuccessView;