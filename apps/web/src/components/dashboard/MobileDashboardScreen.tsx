'use client';

import React from 'react';
import {
  ChevronRight,
  FolderUp,
  GraduationCap,
  Lightbulb,
  Receipt,
  Tags,
  TrendingUp,
  Zap,
} from '@/components/ui/icons';
import { ErrorCard, LoadingCard } from '@/components/ui/states';
import { formatDate, formatMoney, formatRunway } from '@/lib/format';
import { isForecastNotReady, useBusinessData } from '@/lib/session';
import {
  ForecastNotReady,
  LatestAlertCard,
  NextCommitmentCard,
  RecentTransactions,
  ScenarioBars,
} from './widgets';

interface MobileDashboardScreenProps {
  isBalanceHidden?: boolean;
  onNavigate: (tab: 'forecast' | 'transactions' | 'commitments' | 'tracks') => void;
  onOpenImportModal: () => void;
}

const QUICK_ACTION =
  'flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-[#E6EFE2] shadow-2xs hover:border-[#D7FD3C] transition-all min-w-[76px] shrink-0 active:scale-95';

export function MobileDashboardScreen({
  isBalanceHidden = false,
  onNavigate,
  onOpenImportModal,
}: MobileDashboardScreenProps) {
  const { business, forecast } = useBusinessData();
  const notReady = isForecastNotReady(forecast.error);

  return (
    <section className="space-y-4 pb-24 max-w-md mx-auto">
      {/* Saldo e retirada segura */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6EFE2] shadow-[0_4px_20px_-4px_rgba(18,24,20,0.06)] relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#D7FD3C] rounded-full blur-3xl opacity-25 pointer-events-none"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#64748B]">Saldo informado da conta PJ</span>
          {business.cashBalanceDate && (
            <span className="text-[11px] font-bold text-[#64748B]">
              {formatDate(business.cashBalanceDate)}
            </span>
          )}
        </div>
        <span className="text-3xl font-extrabold text-[#111827] tracking-tight">
          {formatMoney(business.cashBalance, isBalanceHidden)}
        </span>

        <div className="mt-3.5 pt-3 border-t border-[#F1F5E9] flex items-center justify-between bg-[#F8FAF5] -mx-5 -mb-5 p-4 rounded-b-3xl">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-[#D7FD3C] flex items-center justify-center text-[#111827] shadow-2xs">
              <Zap size={15} strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                Retirada segura
              </p>
              <p className="text-xs font-extrabold text-[#111827]">
                {forecast.data ? formatMoney(forecast.data.safeWithdrawal, isBalanceHidden) : '—'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('forecast')}
            className="px-3 py-1 rounded-full bg-[#111827] hover:bg-black text-[#D7FD3C] text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1"
          >
            Ver cálculo <ChevronRight size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        <button onClick={() => onNavigate('commitments')} className={QUICK_ACTION}>
          <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center mb-1">
            <Receipt size={20} />
          </div>
          <span className="text-[10px] font-bold text-[#111827]">Contas</span>
        </button>
        <button onClick={onOpenImportModal} className={QUICK_ACTION}>
          <div className="w-10 h-10 rounded-xl bg-[#F3FCE2] text-[#294A07] flex items-center justify-center mb-1">
            <FolderUp size={20} />
          </div>
          <span className="text-[10px] font-bold text-[#111827]">Extrato</span>
        </button>
        <button onClick={() => onNavigate('transactions')} className={QUICK_ACTION}>
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#92400E] flex items-center justify-center mb-1">
            <Tags size={20} />
          </div>
          <span className="text-[10px] font-bold text-[#111827]">PF vs PJ</span>
        </button>
        <button onClick={() => onNavigate('forecast')} className={QUICK_ACTION}>
          <div className="w-10 h-10 rounded-xl bg-[#111827] text-[#D7FD3C] flex items-center justify-center mb-1">
            <TrendingUp size={20} strokeWidth={2.2} />
          </div>
          <span className="text-[10px] font-bold text-[#111827]">Cenários</span>
        </button>
        <button onClick={() => onNavigate('tracks')} className={QUICK_ACTION}>
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1E40AF] flex items-center justify-center mb-1">
            <GraduationCap size={20} />
          </div>
          <span className="text-[10px] font-bold text-[#111827]">Trilhas</span>
        </button>
      </div>

      <LatestAlertCard onOpenTracks={() => onNavigate('tracks')} />
      <NextCommitmentCard hidden={isBalanceHidden} onOpen={() => onNavigate('commitments')} />

      {/* Cenários */}
      <div className="bg-white p-5 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-3">
        <div>
          <h3 className="font-extrabold text-sm text-[#111827]">Cenários de caixa</h3>
          <p className="text-[11px] text-[#64748B]">
            {forecast.data
              ? `Saldo projetado para daqui a ${forecast.data.horizonWeeks} semanas`
              : 'Saldo projetado por cenário'}
          </p>
        </div>
        {forecast.loading && !forecast.data && !forecast.error && <LoadingCard />}
        {notReady && <ForecastNotReady onOpenImportModal={onOpenImportModal} />}
        {forecast.error && !notReady && (
          <ErrorCard error={forecast.error} onRetry={() => void forecast.reload()} />
        )}
        {forecast.data && (
          <>
            <ScenarioBars forecast={forecast.data} hidden={isBalanceHidden} />
            <div className="p-3 rounded-2xl bg-[#F8FAF5] border border-[#E6EFE2] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Lightbulb size={16} className="text-[#2B4B0A]" />
                <span className="text-[11px] text-[#475569]">
                  Fôlego conservador:{' '}
                  <strong>{formatRunway(forecast.data.scenarios.conservative.runway)}</strong>
                </span>
              </div>
              <button
                onClick={() => onNavigate('forecast')}
                className="text-[11px] font-bold text-black underline shrink-0"
              >
                Detalhes
              </button>
            </div>
          </>
        )}
      </div>

      <RecentTransactions
        limit={3}
        hidden={isBalanceHidden}
        onSeeAll={() => onNavigate('transactions')}
      />

      <div className="text-center py-2">
        <p className="handwriting text-lg text-[#475569]">
          Planejamento de hoje, conquistas amanhã ↗
        </p>
      </div>
    </section>
  );
}
