'use client';

import React, { useState } from 'react';
import {
  Zap,
  Receipt,
  FolderUp,
  Tags,
  TrendingUp,
  GraduationCap,
  Bell,
  Lightbulb,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from '@/components/ui/icons';

interface MobileDashboardScreenProps {
  isBalanceHidden?: boolean;
  onNavigate: (tab: 'forecast' | 'transactions' | 'commitments' | 'tracks') => void;
  onOpenImportModal: () => void;
}

export function MobileDashboardScreen({
  isBalanceHidden = false,
  onNavigate,
  onOpenImportModal,
}: MobileDashboardScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '60d'>('30d');

  return (
    <section className="space-y-4 pb-24 max-w-md mx-auto">
      
      {/* 1. HERO CARD: SALDO ATUAL COM RETIRADA SEGURA */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6EFE2] shadow-[0_4px_20px_-4px_rgba(18,24,20,0.06)] relative overflow-hidden">
        {/* Glow sutil de fundo */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#D7FD3C] rounded-full blur-3xl opacity-25 pointer-events-none"></div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#64748B]">Saldo em conta PJ</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#D1FAE5]">
            <ArrowUpRight size={13} strokeWidth={2.5} /> +12% no mês
          </span>
        </div>

        {/* Valor do Saldo */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-[#111827] tracking-tight">
            {isBalanceHidden ? '••••••••' : 'R$ 4.220,00'}
          </span>
        </div>

        {/* Retirada Segura Recomendada (Conceito GiG) */}
        <div className="mt-3.5 pt-3 border-t border-[#F1F5E9] flex items-center justify-between bg-[#F8FAF5] -mx-5 -mb-5 p-4 rounded-b-3xl">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-[#D7FD3C] flex items-center justify-center text-[#111827] shadow-2xs">
              <Zap size={15} strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Retirada Segura Hoje</p>
              <p className="text-xs font-extrabold text-[#111827]">
                {isBalanceHidden ? '••••••' : 'R$ 1.850,00'}
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

      {/* 2. CARROSSEL DE AÇÕES RÁPIDAS (LUCIDE ICONS) */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        {/* Ação 1: Pagar DAS */}
        <button
          onClick={() => onNavigate('commitments')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-[#E6EFE2] shadow-2xs hover:border-[#D7FD3C] transition-all min-w-[76px] shrink-0 active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center mb-1 relative transition-colors group-hover:bg-[#FEE2E2]">
            <Receipt size={20} strokeWidth={2} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full ring-2 ring-white animate-pulse"></span>
          </div>
          <span className="text-[10px] font-bold text-[#111827]">Pagar DAS</span>
        </button>

        {/* Ação 2: Subir Extrato */}
        <button
          onClick={onOpenImportModal}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-[#E6EFE2] shadow-2xs hover:border-[#D7FD3C] transition-all min-w-[76px] shrink-0 active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F3FCE2] text-[#294A07] flex items-center justify-center mb-1 transition-colors group-hover:bg-[#DCF4A6]">
            <FolderUp size={20} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-bold text-[#111827]">Extrato</span>
        </button>

        {/* Ação 3: Classificar PF/PJ */}
        <button
          onClick={() => onNavigate('transactions')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-[#E6EFE2] shadow-2xs hover:border-[#D7FD3C] transition-all min-w-[76px] shrink-0 active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#92400E] flex items-center justify-center mb-1 transition-colors group-hover:bg-[#FDE68A]">
            <Tags size={20} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-bold text-[#111827]">PF vs PJ</span>
        </button>

        {/* Ação 4: Simular Cenários */}
        <button
          onClick={() => onNavigate('forecast')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-[#E6EFE2] shadow-2xs hover:border-[#D7FD3C] transition-all min-w-[76px] shrink-0 active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#111827] text-[#D7FD3C] flex items-center justify-center mb-1 transition-colors group-hover:bg-black">
            <TrendingUp size={20} strokeWidth={2.2} />
          </div>
          <span className="text-[10px] font-bold text-[#111827]">Cenários</span>
        </button>

        {/* Ação 5: Aprender */}
        <button
          onClick={() => onNavigate('tracks')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-[#E6EFE2] shadow-2xs hover:border-[#D7FD3C] transition-all min-w-[76px] shrink-0 active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1E40AF] flex items-center justify-center mb-1 transition-colors group-hover:bg-[#DBEAFE]">
            <GraduationCap size={20} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-bold text-[#111827]">Trilhas</span>
        </button>
      </div>

      {/* 3. CARD DE ALERTA: LEMBRETE DAS MEI */}
      <div className="bg-white rounded-3xl p-4 border border-[#E6EFE2] shadow-xs relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F3FCE2] border border-[#DCF4A6] flex items-center justify-center text-[#294A07] shrink-0">
            <Bell size={20} strokeWidth={2.2} className="text-[#294A07]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Lembrete de Imposto</span>
              <span className="text-[10px] font-bold text-[#EF4444] bg-[#FEF2F2] px-2 py-0.5 rounded-full">Vence em 5 dias</span>
            </div>
            <h4 className="text-sm font-extrabold text-[#111827] mt-0.5">Seu DAS MEI vence em 20/Nov</h4>
            <p className="text-xs text-[#64748B] mt-0.5">
              Valor: <strong className="text-[#111827]">R$ 75,90</strong>. O valor já está reservado no seu saldo seguro.
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#F1F5E9] flex items-center justify-between">
          <span className="text-[11px] text-[#10B981] font-semibold flex items-center gap-1">
            ✓ Guia no PGMEI pronta
          </span>
          <button
            onClick={() => onNavigate('commitments')}
            className="px-3.5 py-1.5 rounded-full bg-[#D7FD3C] hover:bg-[#cbf425] text-black font-bold text-xs shadow-2xs transition-all active:scale-95 flex items-center gap-1"
          >
            Ver detalhes <ChevronRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 4. CARDS COMPACTOS: RECEITAS & DESPESAS DO MÊS */}
      <div className="grid grid-cols-2 gap-3">
        {/* Receitas */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E6EFE2] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
            <span>Receitas (mês)</span>
            <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-0.5">
              <ArrowUpRight size={12} strokeWidth={2.5} /> +8%
            </span>
          </div>
          <div className="text-lg font-extrabold text-[#111827]">
            {isBalanceHidden ? '••••••' : 'R$ 8.230,00'}
          </div>
          <p className="text-[10px] text-[#64748B] mt-1">10 lançamentos</p>
        </div>

        {/* Despesas */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E6EFE2] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
            <span>Despesas (mês)</span>
            <span className="text-[10px] font-bold text-[#EF4444] flex items-center gap-0.5">
              <ArrowDownRight size={12} strokeWidth={2.5} /> -5%
            </span>
          </div>
          <div className="text-lg font-extrabold text-[#111827]">
            {isBalanceHidden ? '••••••' : 'R$ 4.010,00'}
          </div>
          <p className="text-[10px] text-[#64748B] mt-1">R$ 1.950 em fixos</p>
        </div>
      </div>

      {/* 5. CARD DARK OBSIDIAN: META DO MÊS (DONUT CIRCULAR 70%) */}
      <div className="bg-[#111827] text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold text-[#D7FD3C] uppercase tracking-wider">Planejamento</span>
            <h4 className="text-base font-extrabold text-white">Meta de Faturamento</h4>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Novembro
          </span>
        </div>

        <div className="flex items-center gap-4 my-2">
          {/* Anel SVG Circular */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" stroke="#1F2937" strokeWidth="12" fill="none"/>
              <circle
                cx="50"
                cy="50"
                r="38"
                stroke="#D7FD3C"
                strokeWidth="12"
                fill="none"
                strokeDasharray="238.76"
                strokeDashoffset="71.62"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-white">70%</span>
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <p className="text-xs text-slate-300">
              <strong className="text-white font-bold text-sm">R$ 8.230</strong> de R$ 12.000
            </p>
            <p className="text-[11px] text-slate-400">
              Faltam apenas <span className="text-[#D7FD3C] font-semibold">R$ 3.770</span> para bater a meta do mês.
            </p>
            <button
              onClick={() => onNavigate('commitments')}
              className="mt-2 text-xs font-bold text-[#D7FD3C] hover:underline flex items-center gap-1"
            >
              Ver detalhes da meta <ChevronRight size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* 6. FLUXO DE CAIXA PROJETADO (MOBILE CHART) */}
      <div className="bg-white p-5 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-[#111827]">Fluxo de Caixa</h3>
            <p className="text-[11px] text-[#64748B]">Projeção das próximas semanas</p>
          </div>
          <div className="flex items-center gap-1 bg-[#F8FAF5] p-1 rounded-full border border-[#DFE8D7] text-[10px]">
            <button
              onClick={() => setSelectedPeriod('30d')}
              className={`px-2 py-0.5 rounded-full font-bold ${
                selectedPeriod === '30d' ? 'bg-[#D7FD3C] text-black' : 'text-slate-600'
              }`}
            >
              30d
            </button>
            <button
              onClick={() => setSelectedPeriod('60d')}
              className={`px-2 py-0.5 rounded-full font-medium ${
                selectedPeriod === '60d' ? 'bg-[#D7FD3C] text-black' : 'text-slate-600'
              }`}
            >
              60d
            </button>
          </div>
        </div>

        {/* Gráfico SVG Compacto */}
        <div className="h-40 w-full relative pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 350 140" preserveAspectRatio="none">
            <defs>
              <linearGradient id="mobileGradRestored" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D7FD3C" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#D7FD3C" stopOpacity="0.0"/>
              </linearGradient>
            </defs>

            <line x1="0" y1="30" x2="350" y2="30" stroke="#F1F5E9" strokeDasharray="3"/>
            <line x1="0" y1="70" x2="350" y2="70" stroke="#F1F5E9" strokeDasharray="3"/>
            <line x1="0" y1="110" x2="350" y2="110" stroke="#E2EAD9"/>

            {/* Curva de Saldo */}
            <path d="M 0,100 Q 60,85 110,65 T 230,50 T 350,30 L 350,110 L 0,110 Z" fill="url(#mobileGradRestored)" />
            <path d="M 0,100 Q 60,85 110,65 T 230,50 T 350,30" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M 0,110 Q 70,100 140,85 T 280,75 T 350,60" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 2"/>

            <circle cx="230" cy="50" r="4.5" fill="#D7FD3C" stroke="#111827" strokeWidth="2" />
          </svg>

          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
            <span>Hoje</span>
            <span>Sem 1</span>
            <span>Sem 2</span>
            <span>Sem 3</span>
            <span>Sem 4</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#F8FAF5] border border-[#E6EFE2] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-[#2B4B0A]" />
            <span className="text-[11px] text-[#475569]">Fôlego saudável: <strong>8.5 meses</strong> no ritmo atual.</span>
          </div>
          <button
            onClick={() => onNavigate('forecast')}
            className="text-[11px] font-bold text-black underline shrink-0"
          >
            Cenários
          </button>
        </div>
      </div>

      {/* 7. LANÇAMENTOS RECENTES COM CLASSIFICAÇÃO PF/PJ */}
      <div className="bg-white p-4 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#111827]">Últimos Lançamentos</h3>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-bold text-[#111827] hover:underline flex items-center gap-0.5"
          >
            Ver todos <ChevronRight size={13} strokeWidth={2.5} />
          </button>
        </div>

        <div className="divide-y divide-[#F1F5E9] text-xs">
          {/* Lançamento 1 */}
          <div className="py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center font-bold text-[10px] shrink-0">
                PJ
              </div>
              <div className="truncate">
                <p className="font-bold text-[#111827] truncate">Pix - Cliente Acme Tech</p>
                <p className="text-[10px] text-slate-400">Hoje • Receita</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-[#10B981]">+ R$ 3.500,00</p>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#ECFDF5] text-[#065F46] font-semibold">PJ</span>
            </div>
          </div>

          {/* Lançamento 2: Despesa Pessoal */}
          <div className="py-2.5 flex items-center justify-between gap-3 bg-[#FFFDF5] px-2 rounded-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#92400E] flex items-center justify-center font-bold text-[10px] shrink-0">
                <AlertTriangle size={15} className="text-[#D97706]" />
              </div>
              <div className="truncate">
                <p className="font-bold text-[#111827] truncate">Farmácia São Paulo</p>
                <p className="text-[10px] text-[#B45309]">Gasto pessoal na conta PJ</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-[#D97706]">- R$ 86,40</p>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#FEF3C7] text-[#92400E] font-bold">Pessoal</span>
            </div>
          </div>

          {/* Lançamento 3: DAS */}
          <div className="py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center shrink-0">
                <Receipt size={16} />
              </div>
              <div className="truncate">
                <p className="font-bold text-[#111827] truncate">DAS MEI Simples Nacional</p>
                <p className="text-[10px] text-slate-400">Vence em 20/Nov • Tributo</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-[#EF4444]">- R$ 75,90</p>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#FEF2F2] text-[#991B1B] font-semibold">DAS</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8. PÍLULA DE APRENDIZADO RECOMENDADA */}
      <div className="p-4 rounded-3xl bg-linear-to-r from-[#F3FCE2] to-[#E9F9D1] border border-[#DCF4A6] flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center text-[#2B4B0A]">
            <Lightbulb size={18} strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#2B4B0A]">Pílula de 3 min</p>
            <p className="text-xs font-bold text-[#111827]">Como separar contas aos poucos</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('tracks')}
          className="px-3 py-1.5 rounded-full bg-[#111827] text-[#D7FD3C] text-[11px] font-bold shrink-0 active:scale-95 flex items-center gap-0.5"
        >
          Ouvir <ChevronRight size={12} strokeWidth={2.5} />
        </button>
      </div>

      {/* Frase manuscrita no rodapé */}
      <div className="text-center py-2">
        <p className="handwriting text-lg text-[#475569]">
          Planejamento de hoje, conquistas amanhã ↗
        </p>
      </div>

    </section>
  );
}
