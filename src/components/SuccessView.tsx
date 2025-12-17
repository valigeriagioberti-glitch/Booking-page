import React, { useRef, useState } from 'react';
import { BookingDetails, BagSize, Language } from '../types';
import { PRICES } from '../constants';
import { CheckCircle, Calendar, Package, Printer, ArrowLeft, Download, Briefcase, Loader2 } from 'lucide-react';
import { calculateDailySubtotal } from '../services/bookingService';
import { translations } from '../translations';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface SuccessViewProps {
  booking: BookingDetails;
  onReset: () => void;
  language: Language;
}

const SuccessView: React.FC<SuccessViewProps> = ({ booking, onReset, language }) => {
  const t = translations[language].success;
  const dailySubtotal = calculateDailySubtotal(booking.bagQuantities);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Format dates
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const formatTimestamp = (dateStr: string) => {
      return new Date(dateStr).toLocaleString(language === 'it' ? 'it-IT' : 'en-GB');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingPdf(true);

    try {
      // Temporarily reveal the print view for capture if hidden
      const element = receiptRef.current;
      
      // Force block display for capture
      element.classList.remove('hidden');
      element.classList.add('block');
      
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // Hide it again unless printing
      element.classList.remove('block');
      element.classList.add('hidden');
      element.classList.add('print:block');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt_${booking.id}.pdf`);

    } catch (error) {
      console.error("PDF Generation failed", error);
      alert("Could not generate PDF. Please try printing instead.");
    } finally {
      setIsGeneratingPdf(false);
    }
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            {t.subtitlePart1} <span className="font-semibold text-gray-900">{booking.customerEmail}</span>.
          </p>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Booking ID & Status */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-6 rounded-lg border border-gray-200 gap-4">
             <div className="text-center md:text-left">
               <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">{t.reference}</p>
               <p className="text-2xl font-mono font-bold text-gray-900 tracking-tight">{booking.id}</p>
             </div>
             <div className="flex flex-col items-center md:items-end">
               <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">{t.paymentStatus}</p>
               <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                 {t.paidVia}
               </span>
             </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column: Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="text-green-900" size={20} /> {t.schedule}
              </h3>
              <div className="space-y-3 pl-2 border-l-2 border-gray-100 ml-2">
                <div>
                  <p className="text-sm text-gray-500">{translations[language].bookingForm.dropOff}</p>
                  <p className="font-medium text-gray-900">{formatDate(booking.dropOffDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{translations[language].bookingForm.pickUp}</p>
                  <p className="font-medium text-gray-900">{formatDate(booking.pickUpDate)}</p>
                </div>
                <div>
                   <p className="text-sm text-gray-500">{t.totalDuration}</p>
                   <p className="font-medium text-green-900">{booking.billableDays} {booking.billableDays > 1 ? translations[language].summary.days : translations[language].summary.day}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Customer */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserIcon /> {t.customerDetails}
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2 border border-gray-100">
                <p><span className="text-gray-500">{t.name}</span> <span className="font-medium text-gray-900">{booking.customerName}</span></p>
                <p><span className="text-gray-500">{t.email}</span> <span className="font-medium text-gray-900">{booking.customerEmail}</span></p>
                <p><span className="text-gray-500">{t.phone}</span> <span className="font-medium text-gray-900">{booking.customerPhone}</span></p>
                <p><span className="text-gray-500">{t.bookedOn}</span> <span className="font-medium text-gray-900">{formatTimestamp(booking.timestamp)}</span></p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Bag Breakdown Table */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="text-green-900" size={20} /> {t.orderSummary}
            </h3>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.item}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.qty}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t.rate}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t.subtotalDay}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(booking.bagQuantities).map(([size, qty]) => {
                     const quantity = qty as number;
                     if (quantity === 0) return null;
                     const price = PRICES[size as BagSize].pricePerDay;
                     return (
                      <tr key={size}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{size} {t.bag}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">€{price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">€{(quantity * price).toFixed(2)}</td>
                      </tr>
                     );
                  })}
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-4 text-sm font-bold text-gray-700 text-right">{translations[language].summary.perDaySubtotal}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">€{dailySubtotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <div className="w-full md:w-1/2 bg-green-50 rounded-lg p-6 flex justify-between items-center border border-green-100">
                <div>
                  <p className="text-sm text-green-800">{t.totalBillableDays}</p>
                  <p className="text-sm text-green-800">{t.dailyRate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-900">x {booking.billableDays}</p>
                  <p className="text-sm font-medium text-green-900">€{dailySubtotal.toFixed(2)}</p>
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <p className="text-3xl font-bold text-green-900">€{booking.totalPrice.toFixed(2)}</p>
                    <p className="text-xs text-green-700 uppercase font-bold mt-1">{t.totalPaid}</p>
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
              <Printer size={20} /> {t.printReceipt}
            </button>
            <button 
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-3 px-6 rounded-lg font-bold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
              {isGeneratingPdf ? t.generatingPdf : t.downloadPdf}
            </button>
            <button 
              onClick={onReset}
              className="flex-1 flex items-center justify-center gap-2 bg-green-900 text-white py-3 px-6 rounded-lg font-bold hover:bg-green-800 shadow-md hover:shadow-lg transition-all"
            >
              <ArrowLeft size={20} /> {t.newBooking}
            </button>
          </div>
        </div>
      </div>

      {/* 
        RECEIPT LAYOUT (For Print & PDF)
        
        Note: We attach the ref here. 
        Tailwind 'hidden print:block' handles Print visibility.
        Our handleDownloadPdf temporarily adds 'block' to capture it for PDF.
      */}
      <div 
        ref={receiptRef}
        className="hidden print:block p-12 bg-white text-black max-w-[210mm] mx-auto"
        style={{ width: '210mm', minHeight: '297mm' }} // A4 dimensions to ensure good PDF capture
      >
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
            <h2 className="text-xl font-bold">{t.receiptHeader}</h2>
            <p className="text-sm text-gray-600">#{booking.id}</p>
            <p className="text-sm text-gray-600">{new Date(booking.timestamp).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-GB')}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-12 mb-8">
          <div>
            <h3 className="font-bold border-b border-gray-300 mb-2 pb-1 text-sm uppercase">{t.billedTo}</h3>
            <p className="font-medium">{booking.customerName}</p>
            <p className="text-sm">{booking.customerEmail}</p>
            <p className="text-sm">{booking.customerPhone}</p>
            <p className="text-sm mt-2">{t.paidCreditCard}</p>
          </div>
          <div>
            <h3 className="font-bold border-b border-gray-300 mb-2 pb-1 text-sm uppercase">{t.orderSummary}</h3>
            <div className="grid grid-cols-2 text-sm gap-y-1">
              <span className="text-gray-600">{translations[language].bookingForm.dropOff}:</span>
              <span className="font-medium">{formatDate(booking.dropOffDate)}</span>
              <span className="text-gray-600">{translations[language].bookingForm.pickUp}:</span>
              <span className="font-medium">{formatDate(booking.pickUpDate)}</span>
              <span className="text-gray-600">{translations[language].summary.duration}:</span>
              <span className="font-medium">{booking.billableDays} {translations[language].summary.days}</span>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
           <table className="w-full text-sm">
             <thead>
               <tr className="border-b-2 border-black">
                 <th className="text-left py-2 font-bold uppercase">{t.description}</th>
                 <th className="text-right py-2 font-bold uppercase">{t.qty}</th>
                 <th className="text-right py-2 font-bold uppercase">{t.rate}</th>
                 <th className="text-right py-2 font-bold uppercase">{t.amount}</th>
               </tr>
             </thead>
             <tbody>
              {Object.entries(booking.bagQuantities).map(([size, qty]) => {
                     const quantity = qty as number;
                     if (quantity === 0) return null;
                     const price = PRICES[size as BagSize].pricePerDay;
                     return (
                      <tr key={size} className="border-b border-gray-200">
                        <td className="py-3">{size} {t.luggageStorage}</td>
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
                <span>{translations[language].summary.perDaySubtotal}</span>
                <span>€{dailySubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span>{translations[language].summary.billableDays}</span>
                <span>x {booking.billableDays}</span>
              </div>
              <div className="flex justify-between py-3 border-b-2 border-black text-xl font-bold">
                <span>{t.totalPaid}</span>
                <span>€{booking.totalPrice.toFixed(2)}</span>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
          <p className="font-medium text-black mb-1">{t.thankYou}</p>
          <p>{t.assistance}</p>
        </div>
      </div>
    </div>
  );
};

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-900"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export default SuccessView;