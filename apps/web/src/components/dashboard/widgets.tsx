'use client';

import type { Commitment, ForecastResponse, Transaction } from '@gig/shared/contracts';
import React from 'react';
import { AlertTriangle, Bell, Building2, ChevronRight, Receipt, Tag } from '@/components/ui/icons';
import { EmptyCard, ErrorCard, LoadingCard } from '@/components/ui/states';
import { api } from '@/lib/api';
import {
  formatDate,
  formatMoney,
  formatSignedMoney,
  isNegative,
  LABEL_NAMES,
  todayIso,
} from '@/lib/format';
import { useBusinessData } from '@/lib/session';
import { useResource } from '@/lib/useResource';

export const SCENARIOS = [
  { key: 'conservative', name: 'Conservador', color: '#D97706' },
  { key: 'likely', name: 'Provável', color: '#111827' },
  { key: 'favorable', name: 'Favorável', color: '#10B981' },
] as const;

export function ForecastNotReady({ onOpenImportModal }: { onOpenImportModal?: () => void }) {
  return (
    <EmptyCard title="A previsão ainda não foi gerada">
      <p>
        O GiG precisa do saldo atual e de histórico suficiente no extrato para calcular os cenários.
      </p>
      {onOpenImportModal && (
        <button
          onClick={onOpenImportModal}
          className="mt-3 px-3.5 py-1.5 rounded-full bg-[#D7FD3C] text-black font-black text-xs"
        >
          Enviar extrato
        </button>
      )}
    </EmptyCard>
  );
}

// Barras com o saldo final de cada cenário, como a API calculou.
export function ScenarioBars({
  forecast,
  hidden,
}: {
  forecast: ForecastResponse;
  hidden: boolean;
}) {
  const values = SCENARIOS.map((s) => Math.abs(Number(forecast.scenarios[s.key].endBalance)));
  const max = Math.max(...values, 1);
  return (
    <div className="space-y-3">
      {SCENARIOS.map((s, i) => {
        const scenario = forecast.scenarios[s.key];
        const negative = isNegative(scenario.endBalance);
        return (
          <div key={s.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#334155]">{s.name}</span>
              <span className={`font-black ${negative ? 'text-[#EF4444]' : 'text-[#111827]'}`}>
                {formatMoney(scenario.endBalance, hidden)}
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#F1F5E9] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: hidden ? '0%' : `${((values[i] ?? 0) / max) * 100}%`,
                  backgroundColor: negative ? '#EF4444' : s.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function useRecentTransactions(limit: number) {
  const { business, version } = useBusinessData();
  return useResource(
    () => api.listTransactions(business.id, { pageSize: limit }),
    [business.id, version, limit],
  );
}

function TransactionIcon({ transaction }: { transaction: Transaction }) {
  if (transaction.label === 'PERSONAL') {
    return (
      <div className="w-9 h-9 rounded-2xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
        <AlertTriangle size={16} className="text-[#D97706]" />
      </div>
    );
  }
  if (transaction.label === 'TAX') {
    return (
      <div className="w-9 h-9 rounded-2xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center shrink-0">
        <Receipt size={16} />
      </div>
    );
  }
  if (transaction.label === 'WITHDRAWAL') {
    return (
      <div className="w-9 h-9 rounded-2xl bg-[#D7FD3C] text-black flex items-center justify-center shrink-0">
        <Tag size={16} />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-2xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0">
      <Building2 size={16} />
    </div>
  );
}

export function RecentTransactions({
  limit,
  hidden,
  onSeeAll,
}: {
  limit: number;
  hidden: boolean;
  onSeeAll: () => void;
}) {
  const recent = useRecentTransactions(limit);
  const list = recent.data?.transactions ?? [];
  return (
    <div className="bg-white p-5 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-[#111827]">Lançamentos recentes</h3>
          <p className="text-xs text-[#64748B]">Classificados pelas regras do seu negócio</p>
        </div>
        <button
          onClick={onSeeAll}
          className="text-xs font-bold text-[#111827] hover:underline flex items-center gap-1"
        >
          Ver todos <ChevronRight size={14} />
        </button>
      </div>
      {recent.loading && !recent.data && <LoadingCard />}
      {recent.error && <ErrorCard error={recent.error} onRetry={() => void recent.reload()} />}
      {recent.data && list.length === 0 && (
        <p className="text-xs text-[#64748B]">Nenhum lançamento ainda. Envie um extrato.</p>
      )}
      <div className="divide-y divide-[#F1F5E9]">
        {list.map((t) => (
          <div key={t.id} className="py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <TransactionIcon transaction={t} />
              <div className="min-w-0">
                <p className="font-black text-sm text-[#111827] truncate">{t.description}</p>
                <p className="text-xs text-slate-400">
                  {formatDate(t.date)} • {LABEL_NAMES[t.label]}
                </p>
              </div>
            </div>
            <p
              className={`font-black text-sm shrink-0 ${
                isNegative(t.amount) ? 'text-[#111827]' : 'text-[#10B981]'
              }`}
            >
              {formatSignedMoney(t.amount, hidden)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function nextCommitment(commitments: Commitment[] | undefined): Commitment | undefined {
  const today = todayIso();
  // A API já ordena por vencimento; aqui só se escolhe o primeiro ainda por vir.
  return commitments?.find((c) => c.type === 'FIXED_EXPENSE' && c.dueDate >= today);
}

export function NextCommitmentCard({ hidden, onOpen }: { hidden: boolean; onOpen: () => void }) {
  const { commitments } = useBusinessData();
  const next = nextCommitment(commitments.data?.commitments);
  return (
    <div className="bg-white rounded-3xl p-5 border border-[#E6EFE2] shadow-lg">
      <div className="w-11 h-11 rounded-2xl bg-[#F3FCE2] border border-[#DCF4A6] flex items-center justify-center mb-3">
        <Bell size={22} className="text-[#294A07]" />
      </div>
      <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
        Próximo vencimento
      </p>
      {next ? (
        <>
          <h3 className="text-base font-black text-[#111827] mt-0.5">{next.description}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {formatMoney(next.amount, hidden)} em {formatDate(next.dueDate)}
          </p>
        </>
      ) : (
        <p className="text-xs text-slate-500 mt-1">
          Nenhuma despesa fixa futura cadastrada. Cadastre o DAS, o aluguel e outras contas.
        </p>
      )}
      <button
        onClick={onOpen}
        className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#D7FD3C] hover:bg-[#cbf425] text-black font-black text-xs transition-all active:scale-95"
      >
        Ver compromissos →
      </button>
    </div>
  );
}

export function LatestAlertCard({ onOpenTracks }: { onOpenTracks: () => void }) {
  const { alerts } = useBusinessData();
  const latest = alerts.data?.alerts[0];
  if (!latest) return null;
  return (
    <div className="p-4 rounded-3xl bg-[#FFFBEB] border border-[#FDE68A] space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#92400E]">Alerta</span>
      <p className="text-sm font-black text-[#111827]">{latest.message}</p>
      <p className="text-xs text-[#B45309]">{latest.explanation}</p>
      <button onClick={onOpenTracks} className="text-xs font-black text-[#92400E] hover:underline">
        Aprender sobre isso →
      </button>
    </div>
  );
}
