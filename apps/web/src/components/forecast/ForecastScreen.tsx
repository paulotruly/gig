'use client';

import React, { useState } from 'react';
import { ForecastNotReady, SCENARIOS } from '@/components/dashboard/widgets';
import { AlertTriangle, CheckCircle2, ShieldCheck } from '@/components/ui/icons';
import { ErrorCard, LoadingCard } from '@/components/ui/states';
import { formatDate, formatMoney, formatRunway } from '@/lib/format';
import { isForecastNotReady, useBusinessData } from '@/lib/session';

type ScenarioKey = (typeof SCENARIOS)[number]['key'];

const BADGES: Record<ScenarioKey, string> = {
  conservative: 'text-[#D97706] bg-[#FEF3C7]',
  likely: 'text-[#1F2937] bg-[#D7FD3C]',
  favorable: 'text-[#059669] bg-[#ECFDF5]',
};

export function ForecastScreen({ isBalanceHidden }: { isBalanceHidden: boolean }) {
  const { forecast } = useBusinessData();
  const [active, setActive] = useState<ScenarioKey>('likely');

  const data = forecast.data;
  const scenario = data?.scenarios[active];
  const activeName = SCENARIOS.find((s) => s.key === active)?.name;

  return (
    <section className="w-full space-y-5 pb-24 lg:pb-8">
      <div className="bg-white p-5 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-3">
        <div>
          {data && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#111827] text-[#D7FD3C]">
              Regras v{data.rulesVersion} • gerada em {formatDate(data.generatedAt)}
            </span>
          )}
          <h2 className="text-xl font-extrabold text-[#111827] mt-1">Cenários de caixa e fôlego</h2>
        </div>
        <p className="text-xs text-[#64748B]">
          Saiba com antecedência se o caixa aguenta o ritmo das despesas e das retiradas. O GiG
          recalcula a previsão alguns minutos depois de cada dado novo.
        </p>

        <div className="grid grid-cols-3 p-1 bg-[#EEF4E8] rounded-2xl border border-[#DFE8D7] gap-1">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
                active === s.key
                  ? 'bg-[#111827] text-[#D7FD3C] shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {forecast.loading && !data && !forecast.error && <LoadingCard />}
      {isForecastNotReady(forecast.error) && <ForecastNotReady />}
      {forecast.error && !isForecastNotReady(forecast.error) && (
        <ErrorCard error={forecast.error} onRetry={() => void forecast.reload()} />
      )}

      {data && scenario && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <div className="bg-white p-6 rounded-3xl border-2 border-[#D7FD3C] shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${BADGES[active]}`}>
                Cenário {activeName}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Horizonte de {data.horizonWeeks} semanas
              </span>
            </div>

            <div>
              <p className="text-xs text-[#64748B]">Saldo final projetado</p>
              <div className="text-3xl font-black text-[#111827] tracking-tight">
                {formatMoney(scenario.endBalance, isBalanceHidden)}
              </div>
            </div>

            <div className="p-4 bg-[#F8FAF5] rounded-2xl border border-[#E6EFE2] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Fôlego de caixa (runway)</span>
                <span className="font-extrabold text-[#111827] text-sm">
                  {formatRunway(scenario.runway)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 font-medium">Saldo negativo</span>
                {scenario.firstNegativeDate ? (
                  <span className="font-bold text-[#EF4444] flex items-center gap-1">
                    <AlertTriangle size={14} /> A partir de {formatDate(scenario.firstNegativeDate)}
                  </span>
                ) : (
                  <span className="font-bold text-[#10B981] flex items-center gap-1">
                    <CheckCircle2 size={14} /> Não previsto no horizonte
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#111827] text-white p-6 rounded-3xl shadow-lg space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[#D7FD3C] text-black flex items-center justify-center">
                <ShieldCheck size={20} strokeWidth={2.5} />
              </span>
              <div>
                <h3 className="font-bold text-sm text-white">
                  Retirada segura: {formatMoney(data.safeWithdrawal, isBalanceHidden)}
                </h3>
                <p className="text-[11px] text-slate-400">Como o GiG chegou nos números</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              {data.explanation.map((line, i) => (
                <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[#D7FD3C] font-bold text-xs mb-0.5">{i + 1}.</p>
                  <p className="text-slate-300 text-[11px]">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
