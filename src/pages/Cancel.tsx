import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function Cancel() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
           <XCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-8">No charges were made. You can try booking again when you are ready.</p>
        <Link 
          to="/"
          className="inline-block bg-green-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors"
        >
          Return to Booking
        </Link>
      </div>
    </div>
  );
}