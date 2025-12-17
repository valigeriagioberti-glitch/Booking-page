import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import { verifySession } from '../services/bookingService';

type VerifiedBooking = {
  verified: boolean;
  id: string;
  customerEmail: string;
  customerName: string;
  amountTotal: number;
  dropOffDate: string;
  pickUpDate: string;
  billableDays: number;
  bagQuantities: Record<string, number>;
};

const fmtDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
  } catch {
    return iso;
  }
};

export default function Success() {
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<VerifiedBooking | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!sessionId) {
          throw new Error('Missing Stripe session ID in the URL.');
        }
        const res = await verifySession(sessionId);
        if (!alive) return;

        if (!res?.verified) {
          throw new Error('Payment not verified yet. If you just paid, refresh in a few seconds.');
        }
        setBooking(res);
      } catch (e: any) {
        setError(e?.message || 'Could not verify payment.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sessionId]);

  const lineItems = useMemo(() => {
    const bq = booking?.bagQuantities || {};
    const entries = Object.entries(bq)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([size, qty]) => ({ size, qty: Number(qty) }));
    return entries.length ? entries : [];
  }, [booking]);

  const downloadPdf = () => {
    if (!booking) return;

    const doc = new jsPDF();
    const left = 14;
    let y = 16;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Luggage Deposit Rome', left, y);
    y += 8;
    doc.setFontSize(12);
    doc.text('Booking Confirmation', left, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Booking ID: ${booking.id}`, left, y); y += 7;
    doc.text(`Customer: ${booking.customerName}`, left, y); y += 7;
    doc.text(`Email: ${booking.customerEmail}`, left, y); y += 7;
    doc.text(`Drop-off: ${fmtDate(booking.dropOffDate)}`, left, y); y += 7;
    doc.text(`Pick-up: ${fmtDate(booking.pickUpDate)}`, left, y); y += 7;
    doc.text(`Billable days: ${booking.billableDays}`, left, y); y += 9;

    doc.setFont('helvetica', 'bold');
    doc.text('Bags', left, y); y += 7;
    doc.setFont('helvetica', 'normal');
    if (lineItems.length === 0) {
      doc.text('—', left, y); y += 7;
    } else {
      for (const item of lineItems) {
        doc.text(`${item.size}: ${item.qty}`, left, y);
        y += 7;
      }
    }
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.text(`Total paid: €${booking.amountTotal.toFixed(2)}`, left, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Please show this confirmation at drop-off.', left, y);

    const safeId = String(booking.id || 'booking').replace(/[^a-z0-9_-]+/gi, '_');
    doc.save(`booking_${safeId}.pdf`);
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-green-900">Payment successful</h1>
          <p className="mt-2 text-green-900/80">
            Your booking is confirmed. You can download your PDF confirmation below.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
          {loading && (
            <p className="text-gray-700">Verifying your payment…</p>
          )}

          {!loading && error && (
            <div className="space-y-3">
              <p className="font-semibold text-red-700">Couldn’t load confirmation</p>
              <p className="text-gray-700">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white"
                >
                  Refresh
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-900"
                >
                  Back to booking
                </Link>
              </div>
            </div>
          )}

          {!loading && booking && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Booking ID</p>
                  <p className="mt-1 font-mono text-sm break-all">{booking.id}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total paid</p>
                  <p className="mt-1 text-lg font-bold">€{booking.amountTotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Drop-off</p>
                  <p className="mt-1 font-semibold">{fmtDate(booking.dropOffDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Pick-up</p>
                  <p className="mt-1 font-semibold">{fmtDate(booking.pickUpDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Bags</p>
                {lineItems.length === 0 ? (
                  <p className="mt-1 text-gray-700">—</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-gray-800">
                    {lineItems.map((i) => (
                      <li key={i.size} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                        <span className="font-semibold">{i.size}</span>
                        <span className="font-mono">{i.qty}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={downloadPdf}
                  className="inline-flex items-center justify-center rounded-lg bg-green-900 px-5 py-3 font-bold text-white"
                >
                  Download PDF confirmation
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 font-bold text-gray-900"
                >
                  Make another booking
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
