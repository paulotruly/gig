'use client';

import React, { useState } from 'react';
import { Zap, ShieldCheck, CheckCircle2 } from '@/components/ui/icons';

type ScenarioType = 'conservative' | 'likely' | 'favorable';

export function ForecastScreen() {
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('likely');

  const scenariosData = {
    conservative: {
      title: 'Conservador',
      badgeColor: 'text-[#D97706] bg-[#FEF3C7]',
      balance: 'R$ 1.800,00',
      runway: '8.5 meses',
      description: 'Considera apenas recebíveis com confirmação e 70% das vendas médias.',
      negativeRisk: 'Nenhum saldo negativo previsto no horizonte.',
    },
    likely: {
      title: 'Provável (Recomendado)',
      badgeColor: 'text-[#1F2937] bg-[#D7FD3C]',
      balance: 'R$ 4.300,00',
      runway: '20.0 meses',
      description: 'Mediana dos últimos 6 meses com todos os compromissos fixos e DAS provisionados.',
      negativeRisk: 'Caixa positivo e estável com folga confortável.',
    },
    favorable: {
      title: 'Favorável',
      badgeColor: 'text-[#059669] bg-[#ECFDF5]',
      balance: 'R$ 7.600,00',
      runway: 'Sem queima (Gera Caixa)',
      description: 'Novos contratos fechados e recebimentos antecipados em dia.',
      negativeRisk: 'Crescimento e acúmulo de reserva para o negócio.',
    },
  };

  const current = scenariosData[activeScenario];

  return (
    <section className="w-full space-y-5 pb-24 lg:pb-8">
      
      {/* Header do Módulo */}
      <div className="bg-white p-5 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#111827] text-[#D7FD3C]">
              Motor GiG v1.0
            </span>
            <h2 className="text-xl font-extrabold text-[#111827] mt-1">Cenários de Caixa & Fôlego (Runway)</h2>
          </div>
          <button
            onClick={() => alert('Recalculando cenários...')}
            className="w-8 h-8 rounded-full bg-[#D7FD3C] text-black font-bold flex items-center justify-center text-xs active:scale-95 shadow-2xs"
            title="Recalcular"
          >
            <Zap size={15} strokeWidth={2.5} />
          </button>
        </div>
        <p className="text-xs text-[#64748B]">
          Saiba com até 12 semanas de antecedência se o caixa aguentará o ritmo das despesas e do pró-labore.
        </p>

        {/* Segmented Control para trocar entre os 3 cenários */}
        <div className="grid grid-cols-3 p-1 bg-[#EEF4E8] rounded-2xl border border-[#DFE8D7] gap-1">
          <button
            onClick={() => setActiveScenario('conservative')}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
              activeScenario === 'conservative'
                ? 'bg-[#111827] text-[#D7FD3C] shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            Conservador
          </button>
          <button
            onClick={() => setActiveScenario('likely')}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
              activeScenario === 'likely'
                ? 'bg-[#D7FD3C] text-black shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            Provável
          </button>
          <button
            onClick={() => setActiveScenario('favorable')}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
              activeScenario === 'favorable'
                ? 'bg-[#111827] text-[#10B981] shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            Favorável
          </button>
        </div>
      </div>

      {/* Grid Responsivo dos Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        
        {/* Card do Cenário Ativo Selecionado */}
        <div className="bg-white p-6 rounded-3xl border-2 border-[#D7FD3C] shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${current.badgeColor}`}>
              Cenário {current.title}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Horizonte 4 semanas</span>
          </div>

          <div>
            <p className="text-xs text-[#64748B]">Saldo Final Projetado:</p>
            <div className="text-3xl font-black text-[#111827] tracking-tight">
              {current.balance}
            </div>
          </div>

          <div className="p-4 bg-[#F8FAF5] rounded-2xl border border-[#E6EFE2] space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Fôlego de Caixa (Runway):</span>
              <span className="font-extrabold text-[#111827] text-sm">{current.runway}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Risco de Saldo Negativo:</span>
              <span className="font-bold text-[#10B981] flex items-center gap-1">
                <CheckCircle2 size={14} /> {current.negativeRisk}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 pt-1 leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Card Retirada Segura & Transparência do Cálculo */}
        <div className="bg-[#111827] text-white p-6 rounded-3xl shadow-lg space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#D7FD3C] text-black font-bold flex items-center justify-center">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </span>
            <div>
              <h3 className="font-bold text-sm text-white">Retirada Segura: R$ 1.850,00</h3>
              <p className="text-[11px] text-slate-400">Como o algoritmo GiG chegou neste valor</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[#D7FD3C] font-bold text-xs mb-0.5">1. Receita Base</p>
              <p className="text-slate-300 text-[11px]">Mediana histórica dos últimos 6 meses (R$ 8.230,00).</p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[#D7FD3C] font-bold text-xs mb-0.5">2. Obrigações Reservadas</p>
              <p className="text-slate-300 text-[11px]">R$ 1.950,00 já provisionados para DAS MEI e fornecedores essenciais.</p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[#D7FD3C] font-bold text-xs mb-0.5">3. Margem Anticrise</p>
              <p className="text-slate-300 text-[11px]">Garante saldo mínimo de segurança mesmo se clientes atrasarem pagamentos.</p>
            </div>
          </div>
        </div>

      </div>

    </section>
  );
}
