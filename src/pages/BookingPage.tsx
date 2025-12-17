import React from 'react';
import { Container, Card, Input, PrimaryButton } from '../ui';
import type { BookingFormState, BagSize, BagQuantities } from '../types';
import { PRICES_EUR, billableDays, perDaySubtotalEUR, calcTotalEUR, totalBags } from '../pricing';

const DEFAULT_Q: BagQuantities = { Small: 0, Medium: 0, Large: 0 };

const DEFAULT_STATE: BookingFormState = {
  bagQuantities: DEFAULT_Q,
  dropOffDate: '',
  pickUpDate: '',
  name: '',
  email: '',
  phone: '',
};

function eur(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
}

function clampQty(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(99, Math.floor(n)));
}

function BagRow(props: {
  size: BagSize;
  title: string;
  subtitle: string;
  price: number;
  qty: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600">🧳</div>
        <div>
          <div className="font-semibold text-slate-900">{props.title}</div>
          <div className="text-sm text-slate-500">{props.subtitle}</div>
          <div className="mt-1 text-sm font-semibold text-emerald-700">€{props.price}/day</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${props.title}`}
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          onClick={() => props.onChange(clampQty(props.qty - 1))}
        >
          −
        </button>
        <div className="w-6 text-center font-semibold text-slate-800">{props.qty}</div>
        <button
          type="button"
          aria-label={`Increase ${props.title}`}
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          onClick={() => props.onChange(clampQty(props.qty + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function BookingPage() {
  const [form, setForm] = React.useState<BookingFormState>(DEFAULT_STATE);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const days = billableDays(form.dropOffDate, form.pickUpDate);
  const perDay = perDaySubtotalEUR(form.bagQuantities);
  const total = calcTotalEUR(form.bagQuantities, days);

  const canPay =
    totalBags(form.bagQuantities) > 0 &&
    form.dropOffDate &&
    form.pickUpDate &&
    days > 0 &&
    form.email.trim().length > 3 &&
    /.+@.+\..+/.test(form.email);

  async function onPay() {
    setError(null);
    if (!canPay) {
      setError('Please select at least 1 bag, choose valid dates, and enter a valid email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bagQuantities: form.bagQuantities,
          dropOffDate: form.dropOffDate,
          pickUpDate: form.pickUpDate,
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
        }),
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to create payment session.');
      window.location.href = data.url;
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal header like your screenshot */}
      <header className="border-b border-slate-100">
        <Container className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">🧳</div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">LUGGAGE DEPOSIT</div>
              <div className="text-xs font-semibold tracking-wide text-emerald-700">ROME</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <a className="hidden text-slate-600 hover:text-slate-900 sm:inline-flex" href="https://luggagedepositrome.com">
              ← Return to Home
            </a>
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white text-xs">
              <button type="button" className="px-3 py-2 font-semibold text-slate-900">GB</button>
              <span className="w-px bg-slate-200" />
              <button type="button" className="px-3 py-2 font-semibold text-slate-500">IT</button>
            </div>
          </div>
        </Container>
      </header>

      <main>
        <Container className="py-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Secure Luggage Storage in <span className="text-emerald-700">Rome</span>
            </h1>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Book online in 2 minutes. Secure payment. Free cancellation up to 24h before.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {/* Left: form */}
            <Card className="lg:col-span-2">
              <div className="p-6 sm:p-7">
                <div className="text-lg font-bold text-slate-900">Book Your Space</div>
                <div className="mt-1 text-sm text-slate-600">Select your dates and luggage details below.</div>

                {/* Bags */}
                <div className="mt-6">
                  <div className="text-xs font-bold tracking-wide text-slate-500">1. SELECT BAGS</div>
                  <div className="mt-3 space-y-3">
                    <BagRow
                      size="Small"
                      title="Small"
                      subtitle="Handbags, backpacks, laptop bags"
                      price={PRICES_EUR.Small}
                      qty={form.bagQuantities.Small}
                      onChange={(next) => setForm((s) => ({ ...s, bagQuantities: { ...s.bagQuantities, Small: next } }))}
                    />
                    <BagRow
                      size="Medium"
                      title="Medium"
                      subtitle="Cabin suitcase, carry-on (up to 10kg)"
                      price={PRICES_EUR.Medium}
                      qty={form.bagQuantities.Medium}
                      onChange={(next) => setForm((s) => ({ ...s, bagQuantities: { ...s.bagQuantities, Medium: next } }))}
                    />
                    <BagRow
                      size="Large"
                      title="Large"
                      subtitle="Check-in suitcase, bulky items"
                      price={PRICES_EUR.Large}
                      qty={form.bagQuantities.Large}
                      onChange={(next) => setForm((s) => ({ ...s, bagQuantities: { ...s.bagQuantities, Large: next } }))}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="mt-7">
                  <div className="text-xs font-bold tracking-wide text-slate-500">2. DATES</div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-slate-800">Drop-off Date</label>
                      <Input
                        type="date"
                        value={form.dropOffDate}
                        onChange={(e) => setForm((s) => ({ ...s, dropOffDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-800">Pick-up Date</label>
                      <Input
                        type="date"
                        value={form.pickUpDate}
                        min={form.dropOffDate || undefined}
                        onChange={(e) => setForm((s) => ({ ...s, pickUpDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    Drop-off day is counted as a full billable day regardless of time.
                  </div>
                </div>

                {/* Details */}
                <div className="mt-7">
                  <div className="text-xs font-bold tracking-wide text-slate-500">3. YOUR DETAILS <span className="text-rose-600">(Required)</span></div>
                  <div className="mt-3 space-y-3">
                    <Input
                      placeholder="Full Name *"
                      value={form.name}
                      onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Email Address *"
                      value={form.email}
                      onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                    />
                    <Input
                      placeholder="Phone Number *"
                      value={form.phone}
                      onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                    />
                  </div>
                </div>

                {error ? <div className="mt-4 text-sm text-rose-600">{error}</div> : null}
              </div>
            </Card>

            {/* Right: summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card>
                  <div className="p-6">
                    <div className="text-sm font-bold text-slate-900">Booking Summary</div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Drop-off</span>
                        <span className="font-semibold text-slate-800">{form.dropOffDate || '--'}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Pick-up</span>
                        <span className="font-semibold text-slate-800">{form.pickUpDate || '--'}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Duration</span>
                        <span className="font-semibold text-emerald-700">{days || 0} days</span>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Small (€{PRICES_EUR.Small}/d)</span>
                        <span className="font-semibold text-slate-800">{form.bagQuantities.Small || 0}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Medium (€{PRICES_EUR.Medium}/d)</span>
                        <span className="font-semibold text-slate-800">{form.bagQuantities.Medium || 0}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Large (€{PRICES_EUR.Large}/d)</span>
                        <span className="font-semibold text-slate-800">{form.bagQuantities.Large || 0}</span>
                      </div>

                      <div className="mt-3 flex justify-between text-slate-600">
                        <span>Per-day subtotal</span>
                        <span className="font-semibold text-slate-800">{eur(perDay)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Billable days</span>
                        <span className="font-semibold text-slate-800">× {days || 0}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
                      <div className="text-sm font-bold text-slate-900">Total</div>
                      <div className="text-xl font-extrabold text-emerald-700">{eur(total)}</div>
                    </div>

                    <div className="mt-5">
                      <PrimaryButton
                        disabled={!canPay || loading}
                        onClick={onPay}
                        className="w-full disabled:opacity-60"
                      >
                        {loading ? 'Redirecting…' : totalBags(form.bagQuantities) > 0 ? 'Pay & Reserve' : 'Select Bags'}
                      </PrimaryButton>

                      <div className="mt-3 text-center text-xs text-slate-500">• Secure payment via Stripe</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
