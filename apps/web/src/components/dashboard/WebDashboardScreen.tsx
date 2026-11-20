'use client';

import React from 'react';
import { FolderUp, Receipt } from '@/components/ui/icons';
import { ErrorCard, LoadingCard } from '@/components/ui/states';
import { firstName, formatDate, formatMoney, formatRunway } from '@/lib/format';
import { isForecastNotReady, useBusinessData, useSession } from '@/lib/session';
import {
  ForecastNotReady,
  LatestAlertCard,
  NextCommitmentCard,
  RecentTransactions,
  ScenarioBars,
} from './widgets';

interface WebDashboardScreenProps {
  isBalanceHidden?: boolean;
  onNavigate: (tab: string) => void;
  onOpenImportModal: () => void;
}

export function WebDashboardScreen({
  isBalanceHidden = false,
  onNavigate,
  onOpenImportModal,
}: WebDashboardScreenProps) {
  const { state } = useSession();
  const { business, forecast } = useBusinessData();
  const notReady = isForecastNotReady(forecast.error);
  const userName = state.status === 'authenticated' ? state.user.name : '';

  return (
    <div className="w-full space-y-6">
      {/* Ações rápidas */}
      <div className="flex items-center justify-end gap-2.5">
        <button
          onClick={() => onNavigate('commitments')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white hover:bg-[#F3FCE2] text-[#111827] border border-[#E6EFE2] text-xs font-bold transition-all shadow-2xs"
        >
          <Receipt size={15} className="text-[#EF4444]" />
          <span>Compromissos</span>
        </button>
        <button
          onClick={onOpenImportModal}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#D7FD3C] hover:bg-[#cbf425] text-black text-xs font-black shadow-xs transition-all active:scale-95"
        >
          <FolderUp size={15} />
          <span>Subir extrato PJ</span>
        </button>
      </div>

      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-[#111827] tracking-tight">
          Olá, {firstName(userName)}!
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Aqui está o panorama financeiro de {business.name}.
        </p>
      </div>

      {/* Três números do topo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-[#E6EFE2] shadow-2xs">
          <p className="text-xs font-semibold text-[#64748B] mb-2">Saldo informado</p>
          <div className="text-3xl font-black text-[#111827] tracking-tight mb-2">
            {formatMoney(business.cashBalance, isBalanceHidden)}
          </div>
          <p className="text-xs text-[#64748B]">
            {business.cashBalanceDate
              ? `Em ${formatDate(business.cashBalanceDate)}`
              : 'Informe o saldo atual da conta PJ.'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E6EFE2] shadow-2xs">
          <p className="text-xs font-semibold text-[#64748B] mb-2">Retirada segura</p>
          <div className="text-3xl font-black text-[#111827] tracking-tight mb-2">
            {forecast.data ? formatMoney(forecast.data.safeWithdrawal, isBalanceHidden) : '—'}
          </div>
          <p className="text-xs text-[#64748B]">
            Quanto sair para a conta pessoal sem apertar o caixa
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E6EFE2] shadow-2xs">
          <p className="text-xs font-semibold text-[#64748B] mb-2">Fôlego (cenário conservador)</p>
          <div className="text-3xl font-black text-[#111827] tracking-tight mb-2">
            {forecast.data ? formatRunway(forecast.data.scenarios.conservative.runway) : '—'}
          </div>
          <p className="text-xs text-[#64748B]">Tempo de caixa no ritmo atual de gastos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-4">
            <div>
              <h3 className="text-lg font-black text-[#111827]">Cenários de caixa</h3>
              <p className="text-xs text-[#64748B]">
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
            {forecast.data && <ScenarioBars forecast={forecast.data} hidden={isBalanceHidden} />}
            <div className="pt-3 border-t border-[#F1F5E9] flex justify-end text-xs">
              <button
                onClick={() => onNavigate('forecast')}
                className="font-bold text-[#111827] hover:underline"
              >
                Ver cenários e explicação →
              </button>
            </div>
          </div>

          <RecentTransactions
            limit={5}
            hidden={isBalanceHidden}
            onSeeAll={() => onNavigate('transactions')}
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <NextCommitmentCard hidden={isBalanceHidden} onOpen={() => onNavigate('commitments')} />
          <LatestAlertCard onOpenTracks={() => onNavigate('tracks')} />
          <div className="text-center pt-2">
            <p className="handwriting text-2xl text-[#334155] rotate-[-2deg] select-none">
              Planejamento de hoje, <br />
              conquistas amanhã ↗
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
