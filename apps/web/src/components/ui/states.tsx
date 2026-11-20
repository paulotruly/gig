'use client';

import React from 'react';
import type { ApiError } from '@/lib/api';
import { AlertTriangle } from '@/components/ui/icons';

export function LoadingCard({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-[#E6EFE2] shadow-2xs text-xs text-[#64748B] animate-pulse">
      {label}
    </div>
  );
}

export function ErrorCard({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div className="p-4 rounded-3xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-3">
      <AlertTriangle size={18} className="text-[#EF4444] mt-0.5" />
      <div className="flex-1 text-xs">
        <p className="font-bold text-[#991B1B]">{error.message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-1 font-bold text-[#EF4444] hover:underline">
            Tentar de novo
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyCard({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-dashed border-[#D7E3CF] text-center space-y-1">
      <p className="text-sm font-black text-[#111827]">{title}</p>
      {children && <div className="text-xs text-[#64748B]">{children}</div>}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-bold text-[#EF4444]">
      {message}
    </p>
  );
}

export function TextField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-bold text-[#334155]">{label}</span>
      <input
        {...props}
        className="w-full px-3.5 py-2.5 bg-white border border-[#E6EFE2] rounded-xl text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D7FD3C]"
      />
    </label>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full py-2.5 rounded-xl text-sm font-black bg-[#D7FD3C] hover:bg-[#cbf425] text-black shadow-xs transition-all active:scale-95 disabled:opacity-60 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}
