import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Download, Mail, Phone, MapPin } from 'lucide-react';
import jsPDF from 'jspdf';

import { verifySession } from '../services/bookingService';
import { BagSize } from '../types';

type VerifiedBooking = {
  verified: true;
  id: string;
  customerEmail: string;
  customerName: string;
  amountTotal: number;
  dropOffDate: string;
  pickUpDate: string;
  bagQuantities: Record<string, number>;
  billableDays: number;
};

export default function Success() {
  const { sessionId } = useParams();
  const [status, setStatus] = useState<'loading' | 'verified' | 'failed' | 'error' | 'missing'>('loading');
  const [booking, setBooking] = useState<VerifiedBooking | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('missing');
      return;
    }

    verifySession(sessionId)
      .then((res: any) => {
        if (res?.verified) {
          setBooking(res as VerifiedBooking);
          setStatus('verified');
        } else {
          setStatus('failed');
        }
      })
      .catch((e: any) => {
        setErrorMsg(e?.message || 'Could not verify payment.');
        setStatus('error');
      });
  }, [sessionId]);

  const bagLines = useMemo(() => {
    if (!booking?.bagQuantities) return [];
    const entries = Object.entries(booking.bagQuantities)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([size, qty]) => ({ size, qty: Number(qty) }));
    // Keep a stable order
    const order = [BagSize.Small, BagSize.Medium, BagSize.Large];
    entries.sort((a, b) => order.indexOf(a.size as BagSize) - order.indexOf(b.size as BagSize));
    return entries;
  }, [booking]);

  const downloadPdf = () => {
    if (!booking) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const left = 48;
    let y = 56;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Luggage Deposit Rome', left, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Booking Confirmation (Paid)', left, y);
    y += 16;

    doc.setDrawColor(220);
    doc.line(left, y, 547, y);
    y += 18;

    // Booking info
    doc.setFont('helvetica', 'bold');
    doc.text('Booking ID:', left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(booking.id), left + 90, y);
    y += 16;

    doc.setFont('helvetica', 'bold');
    doc.text('Name:', left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(booking.customerName || ''), left + 90, y);
    y += 16;

    doc.setFont('helvetica', 'bold');
    doc.text('Email:', left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(booking.customerEmail || ''), left + 90, y);
    y += 16;

    doc.setFont('helvetica', 'bold');
    doc.text('Drop-off:', left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(booking.dropOffDate), left + 90, y);
    y += 16;

    doc.setFont('helvetica', 'bold');
    doc.text('Pick-up:', left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(booking.pickUpDate), left + 90, y);
    y += 16;

    doc.setFont('helvetica', 'bold');
    doc.text('Days:', left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(booking.billableDays), left + 90, y);
    y += 20;

    // Bags
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Bags', left, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    if (bagLines.length === 0) {
      doc.text('—', left, y);
      y += 14;
    } else {
      for (const line of bagLines) {
        doc.text(`${line.size}: ${line.qty}`, left, y);
        y += 14;
      }
    }
    y += 10;

    doc.setDrawColor(220);
    doc.line(left, y, 547, y);
    y += 18;

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Total paid: €${booking.amountTotal.toFixed(2)}`, left, y);
    y += 22;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Please show this PDF at drop-off (print or mobile).', left, y);
    y += 14;
    doc.text('Address: Near Roma Termini, Rome (see website for details).', left, y);

    const filename = `LuggageDepositRome-Booking-${booking.id}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          {status === 'verified' && booking && (
            <>
              <div className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-2 mt-0.5">
                  <CheckCircle2 className="w-6 h-6 text-green-900" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Payment successful</h1>
                  <p className="text-gray-600 mt-1">
                    Your booking is confirmed. Download the PDF and show it at drop-off.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Booking ID</p>
                  <p className="font-mono text-sm break-all text-gray-900 mt-1">{booking.id}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total paid</p>
                  <p className="text-2xl font-extrabold text-green-900 mt-1">€{booking.amountTotal.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Drop-off → Pick-up</p>
                  <p className="text-gray-900 font-semibold mt-1">{booking.dropOffDate} → {booking.pickUpDate}</p>
                  <p className="text-sm text-gray-500">{booking.billableDays} day(s)</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Bags</p>
                  <div className="mt-1 space-y-1">
                    {bagLines.length === 0 ? (
                      <p className="text-gray-700">—</p>
                    ) : (
                      bagLines.map((l) => (
                        <p key={l.size} className="text-gray-900 font-semibold">{l.size}: <span className="font-bold">{l.qty}</span></p>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={downloadPdf}
                  className="inline-flex items-center justify-center gap-2 bg-green-900 text-white px-5 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors shadow-md"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center bg-white border border-gray-300 text-gray-900 px-5 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Make another booking
                </Link>
              </div>

              <div className="mt-8 grid gap-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-900" />
                  <span>Drop-off location: near Roma Termini (see website details)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-900" />
                  <span>A copy of your payment receipt is in your email from Stripe.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-900" />
                  <span>If you need help, contact us on WhatsApp/phone from the main website.</span>
                </div>
              </div>
            </>
          )}

          {status === 'loading' && (
            <div className="text-center py-10">
              <p className="text-gray-600 font-semibold">Verifying your payment…</p>
              <p className="text-sm text-gray-500 mt-2">Please don’t close this tab.</p>
            </div>
          )}

          {status === 'failed' && (
            <div className="text-center py-10">
              <h1 className="text-2xl font-extrabold text-gray-900">We couldn’t verify the payment</h1>
              <p className="text-gray-600 mt-2">If you were charged, contact us and we’ll help.</p>
              <div className="mt-6">
                <Link to="/" className="inline-flex items-center justify-center bg-green-900 text-white px-5 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors">
                  Back to booking
                </Link>
              </div>
            </div>
          )}

          {(status === 'error' || status === 'missing') && (
            <div className="text-center py-10">
              <h1 className="text-2xl font-extrabold text-gray-900">Something went wrong</h1>
              <p className="text-gray-600 mt-2">{status === 'missing' ? 'Missing Stripe session id in the URL.' : errorMsg}</p>
              <div className="mt-6">
                <Link to="/" className="inline-flex items-center justify-center bg-green-900 text-white px-5 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors">
                  Back to booking
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
