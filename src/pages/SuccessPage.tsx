import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, PrimaryButton } from '../ui';

type VerifyResponse =
  | { verified: true; booking: any }
  | { verified: false; error?: string };

function eurCents(amountCents: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amountCents / 100);
}

export function SuccessPage() {
  const { sessionId } = useParams();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<VerifyResponse | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        if (!sessionId) {
          setData({ verified: false, error: 'Missing session id.' });
          return;
        }
        const res = await fetch('/api/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const json = (await res.json()) as VerifyResponse;
        if (mounted) setData(json);
      } catch (e: any) {
        if (mounted) setData({ verified: false, error: e?.message || 'Failed to verify payment.' });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  const booking = (data && 'booking' in data && data.booking) ? data.booking : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <Container className="flex items-center justify-between py-4">
          <div className="text-base font-semibold">Luggage Deposit Rome</div>
          <a href="#/" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            New booking
          </a>
        </Container>
      </header>

      <Container className="py-10">
        <Card className="mx-auto max-w-2xl">
          {loading ? (
            <div className="text-sm text-slate-600">Verifying payment…</div>
          ) : data?.verified ? (
            <div>
              <h1 className="text-2xl font-extrabold">Payment successful ✅</h1>
              <p className="mt-2 text-sm text-slate-600">
                We sent a confirmation email to <span className="font-semibold text-slate-900">{booking.customerEmail}</span>.
              </p>

              <div className="mt-6 grid gap-3 text-sm">
                <Row label="Booking ID" value={booking.bookingId} />
                <Row label="Drop-off" value={booking.dropOffDate} />
                <Row label="Pick-up" value={booking.pickUpDate} />
                <Row label="Bags" value={`Small ${booking.bagQuantities?.Small || 0}, Medium ${booking.bagQuantities?.Medium || 0}, Large ${booking.bagQuantities?.Large || 0}`} />
                <Row label="Billable days" value={String(booking.days)} />
                <Row label="Total paid" value={eurCents(booking.amountTotal)} />
                <Row label="Stripe session" value={booking.sessionId} />
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <PrimaryButton
                  onClick={() => {
                    const url = `/api/booking-pdf?sessionId=${encodeURIComponent(sessionId!)}`;
                    window.open(url, '_blank');
                  }}
                  className="w-full sm:w-auto"
                >
                  Download PDF
                </PrimaryButton>
                <PrimaryButton onClick={() => (window.location.href = '#/')} className="w-full bg-slate-900 hover:bg-slate-950 sm:w-auto">
                  Make another booking
                </PrimaryButton>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                If you don’t see the email, check your spam folder. You can also download the PDF confirmation above.
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-extrabold">We couldn’t confirm the payment</h1>
              <p className="mt-2 text-sm text-slate-600">{data?.error || 'Invalid or unpaid session.'}</p>
              <div className="mt-6">
                <PrimaryButton onClick={() => (window.location.href = '#/')} className="w-full sm:w-auto">
                  Back to booking
                </PrimaryButton>
              </div>
            </div>
          )}
        </Card>
      </Container>
    </div>
  );
}

function Row(props: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-between gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center">
      <div className="text-slate-600">{props.label}</div>
      <div className="font-semibold text-slate-900 break-all">{props.value}</div>
    </div>
  );
}
