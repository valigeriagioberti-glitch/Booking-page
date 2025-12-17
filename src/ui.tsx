import React from 'react';

export function Container(props: { children: React.ReactNode; className?: string }) {
  return (
    <div className={['mx-auto w-full max-w-6xl px-4 sm:px-6', props.className].filter(Boolean).join(' ')}>
      {props.children}
    </div>
  );
}

export function Pill(props: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      {props.children}
    </span>
  );
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, ...rest } = props;
  return (
    <button
      {...rest}
      className={[
        'inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition',
        'hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60',
        className ?? '',
      ].join(' ')}
    />
  );
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, ...rest } = props;
  return (
    <button
      {...rest}
      className={[
        'inline-flex items-center justify-center rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-800 transition',
        'hover:bg-slate-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60',
        className ?? '',
      ].join(' ')}
    />
  );
}

export function Card(props: { children: React.ReactNode; className?: string }) {
  return (
    <div className={['rounded-2xl border border-slate-200 bg-white p-5 shadow-soft', props.className].filter(Boolean).join(' ')}>
      {props.children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={[
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none',
        'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100',
        className ?? '',
      ].join(' ')}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return (
    <select
      {...rest}
      className={[
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none',
        'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100',
        className ?? '',
      ].join(' ')}
    />
  );
}
