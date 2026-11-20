'use client';

import React, { useEffect, useId } from 'react';
import { Bell, X } from '@/components/ui/icons';
import { EmptyCard, ErrorCard, LoadingCard } from '@/components/ui/states';
import { formatDate } from '@/lib/format';
import { useBusinessData } from '@/lib/session';

export function NotificationsModal({
  onClose,
  onOpenTracks,
}: {
  onClose: () => void;
  onOpenTracks: () => void;
}) {
  const titleId = useId();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  const { alerts } = useBusinessData();
  const list = alerts.data?.alerts ?? [];

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6EFE2] space-y-4 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5E9]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F3FCE2] flex items-center justify-center text-[#294A07]">
              <Bell size={18} />
            </div>
            <h3 id={titleId} className="font-black text-base text-[#111827]">
              Notificações e alertas
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {alerts.loading && !alerts.data && <LoadingCard />}
        {alerts.error && <ErrorCard error={alerts.error} onRetry={() => void alerts.reload()} />}
        {alerts.data && list.length === 0 && (
          <EmptyCard title="Nenhum alerta por enquanto">
            Os alertas aparecem quando a previsão encontra algo que pede atenção.
          </EmptyCard>
        )}

        {list.map((alert) => (
          <div
            key={alert.id}
            className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-1.5"
          >
            <span className="text-[10px] font-bold text-[#92400E]">
              {formatDate(alert.referenceDate)}
            </span>
            <p className="text-xs font-black text-[#111827]">{alert.message}</p>
            <p className="text-xs text-slate-600">{alert.explanation}</p>
            <button
              onClick={onOpenTracks}
              className="text-xs font-black text-[#92400E] hover:underline"
            >
              Ver a trilha relacionada →
            </button>
          </div>
        ))}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
