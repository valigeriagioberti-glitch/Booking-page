import React from 'react';
import { Container, Card, PrimaryButton } from '../ui';

export function CancelPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <Container className="py-4">
          <div className="text-base font-semibold">Luggage Deposit Rome</div>
        </Container>
      </header>

      <Container className="py-10">
        <Card className="mx-auto max-w-xl">
          <h1 className="text-xl font-extrabold">Payment cancelled</h1>
          <p className="mt-2 text-sm text-slate-600">No worries — you can try again anytime.</p>
          <div className="mt-6">
            <PrimaryButton onClick={() => (window.location.href = '#/')} className="w-full">
              Back to booking
            </PrimaryButton>
          </div>
        </Card>
      </Container>
    </div>
  );
}
