'use client';

import React, { useState } from 'react';
import {
  Search,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FolderUp,
  Tags,
  TrendingUp,
  GraduationCap,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from '@/components/ui/icons';

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
  const [cashFlowTab, setCashFlowTab] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [period, setPeriod] = useState<'30d' | '60d' | '90d'>('30d');

  return (
    <div className="w-full space-y-6">
      
      {/* 1. BARRA SUPERIOR DE BUSCA E AÇÕES RÁPIDAS (EXATAMENTE COMO NO MOCKUP WEB) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Input de Busca estilo Mockup */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Buscar lançamentos, notas fiscais, clientes..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E6EFE2] rounded-full text-xs text-[#111827] placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#D7FD3C] shadow-2xs transition-all"
          />
        </div>

        {/* Ações Rápidas no Topo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('commitments')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white hover:bg-[#F3FCE2] text-[#111827] border border-[#E6EFE2] text-xs font-bold transition-all shadow-2xs"
          >
            <Receipt size={15} className="text-[#EF4444]" />
            <span>Pagar DAS (R$ 75,90)</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#D7FD3C] hover:bg-[#cbf425] text-black text-xs font-black shadow-xs transition-all active:scale-95"
          >
            <FolderUp size={15} />
            <span>Subir Extrato PJ</span>
          </button>
        </div>
      </div>

      {/* 2. SAUDAÇÃO & SUBTÍTULO (IDÊNTICO AO MOCKUP) */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-[#111827] tracking-tight">
          Olá, Ester!
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Aqui está o panorama financeiro do seu negócio.
        </p>
      </div>

      {/* 3. OS 3 CARDS HORIZONTAIS BRANCOS (DO MOCKUP ORIGINAL) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Saldo atual */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6EFE2] shadow-2xs relative overflow-hidden transition-all hover:shadow-md">
          <p className="text-xs font-semibold text-[#64748B] mb-2">Saldo atual</p>
          <div className="text-3xl font-black text-[#111827] tracking-tight mb-2">
            {isBalanceHidden ? '••••••••' : 'R$ 4.220,00'}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#10B981]">
            <ArrowUpRight size={15} strokeWidth={2.5} />
            <span>↑ 12% em relação ao mês anterior</span>
          </div>
        </div>

        {/* Card 2: Receitas (mês) */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6EFE2] shadow-2xs relative overflow-hidden transition-all hover:shadow-md">
          <p className="text-xs font-semibold text-[#64748B] mb-2">Receitas (mês)</p>
          <div className="text-3xl font-black text-[#111827] tracking-tight mb-2">
            {isBalanceHidden ? '••••••' : 'R$ 8.230,00'}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#10B981]">
            <ArrowUpRight size={15} strokeWidth={2.5} />
            <span>↑ 8% em relação ao mês anterior</span>
          </div>
        </div>

        {/* Card 3: Despesas (mês) */}
        <div className="bg-white rounded-3xl p-6 border border-[#E6EFE2] shadow-2xs relative overflow-hidden transition-all hover:shadow-md">
          <p className="text-xs font-semibold text-[#64748B] mb-2">Despesas (mês)</p>
          <div className="text-3xl font-black text-[#111827] tracking-tight mb-2">
            {isBalanceHidden ? '••••••' : 'R$ 4.010,00'}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#EF4444]">
            <ArrowDownRight size={15} strokeWidth={2.5} />
            <span>↓ 5% em relação ao mês anterior</span>
          </div>
        </div>

      </div>

      {/* 4. LAYOUT EM GRID: GRÁFICO AMPLO + CARDS FLUTUANTES DO MOCKUP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA ESQUERDA (8 COLUNAS): FLUXO DE CAIXA AMPLO E TABELA DE LANÇAMENTOS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card: Fluxo de Caixa Amplo com abas Entradas / Saídas */}
          <div className="bg-white p-6 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-[#111827]">Fluxo de caixa</h3>
                <p className="text-xs text-[#64748B]">Previsão de entradas e saídas programadas</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#EEF4E8] p-1 rounded-full border border-[#DFE8D7] text-xs">
                  <button
                    onClick={() => setCashFlowTab('all')}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      cashFlowTab === 'all' ? 'bg-[#D7FD3C] text-black shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Saldo Líquido
                  </button>
                  <button
                    onClick={() => setCashFlowTab('inflow')}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      cashFlowTab === 'inflow' ? 'bg-[#D7FD3C] text-black shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Receitas
                  </button>
                  <button
                    onClick={() => setCashFlowTab('outflow')}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      cashFlowTab === 'outflow' ? 'bg-[#D7FD3C] text-black shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Saídas
                  </button>
                </div>
              </div>
            </div>

            {/* Gráfico SVG Amplo de Linha */}
            <div className="h-56 w-full relative pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="webFlowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D7FD3C" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#D7FD3C" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Linhas de Grade Sutis */}
                <line x1="0" y1="40" x2="700" y2="40" stroke="#F1F5E9" strokeDasharray="3" />
                <line x1="0" y1="90" x2="700" y2="90" stroke="#F1F5E9" strokeDasharray="3" />
                <line x1="0" y1="140" x2="700" y2="140" stroke="#E2EAD9" />

                {/* Área Preenchida Verde Limão */}
                <path
                  d="M 0,130 Q 120,110 220,85 T 450,70 T 700,40 L 700,140 L 0,140 Z"
                  fill="url(#webFlowGrad)"
                />

                {/* Linha Curva Verde/Escura como no Mockup */}
                <path
                  d="M 0,130 Q 120,110 220,85 T 450,70 T 700,40"
                  fill="none"
                  stroke="#111827"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Linha Tracejada de Despesas Previstas */}
                <path
                  d="M 0,140 Q 150,130 300,115 T 550,105 T 700,90"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />

                {/* Ponto de Destaque com Tooltip Estilo Mockup */}
                <circle cx="450" cy="70" r="6" fill="#D7FD3C" stroke="#111827" strokeWidth="3" />
                <rect x="420" y="32" width="60" height="22" rx="6" fill="#111827" />
                <text x="450" y="47" textAnchor="middle" fill="#D7FD3C" fontSize="10" fontWeight="bold">R$ 6.420</text>
              </svg>

              <div className="flex justify-between text-xs text-slate-400 mt-3 font-semibold">
                <span>01/Nov</span>
                <span>08/Nov</span>
                <span>15/Nov (DAS)</span>
                <span>22/Nov</span>
                <span>30/Nov (Meta R$ 12k)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#F1F5E9] flex items-center justify-between text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#111827]"></span> Saldo Projetado
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] ml-2"></span> Despesas Fixas
              </span>
              <button
                onClick={() => onNavigate('forecast')}
                className="font-bold text-[#111827] hover:underline flex items-center gap-1"
              >
                Ver projeção completa de 90 dias →
              </button>
            </div>
          </div>

          {/* Card: Lançamentos Recentes com Classificação PF vs PJ */}
          <div className="bg-white p-6 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-[#111827]">Lançamentos Recentes</h3>
                <p className="text-xs text-[#64748B]">Categorização automática por regras do negócio</p>
              </div>
              <button
                onClick={() => onNavigate('transactions')}
                className="text-xs font-bold text-[#111827] hover:underline flex items-center gap-1"
              >
                Ver todos os lançamentos <ChevronRight size={14} />
              </button>
            </div>

            <div className="divide-y divide-[#F1F5E9]">
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center font-black text-xs">
                    PJ
                  </div>
                  <div>
                    <p className="font-black text-sm text-[#111827]">Pix - Cliente Acme Tech</p>
                    <p className="text-xs text-slate-400">Prestação de Serviços de Design • NF 1024</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-[#10B981]">+ R$ 3.500,00</p>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] font-bold">
                    Receita do Negócio
                  </span>
                </div>
              </div>

              <div className="py-3.5 flex items-center justify-between gap-4 bg-[#FFFDF5] px-3 rounded-2xl my-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-[#92400E] flex items-center justify-center">
                    <AlertTriangle size={18} className="text-[#D97706]" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-[#111827]">Farmácia São Paulo</p>
                    <p className="text-xs text-[#B45309]">Despesa pessoal identificada na conta PJ</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-[#D97706]">- R$ 86,40</p>
                  <button
                    onClick={() => onNavigate('transactions')}
                    className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] font-bold hover:bg-[#FDE68A]"
                  >
                    Pessoal (PF) ✎
                  </button>
                </div>
              </div>

              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <p className="font-black text-sm text-[#111827]">DAS MEI Simples Nacional</p>
                    <p className="text-xs text-slate-400">Vencimento em 20/Nov • Tributo Federal MEI</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-[#EF4444]">- R$ 75,90</p>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#991B1B] font-bold">
                    Guia DAS
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA (4 COLUNAS): OS CARDS FLUTUANTES ICÔNICOS DO MOCKUP */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CARD 1: LEMBRETE DAS MEI (EXATAMENTE COMO NO MOCKUP COM O SINO E BOTÃO VERDE-LIMÃO) */}
          <div className="bg-white rounded-3xl p-6 border border-[#E6EFE2] shadow-lg relative overflow-hidden transition-all hover:scale-[1.01]">
            <div className="w-12 h-12 rounded-2xl bg-[#F3FCE2] border border-[#DCF4A6] flex items-center justify-center mb-3">
              <Bell size={24} className="text-[#294A07]" />
            </div>

            <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Lembrete</p>
            <h3 className="text-lg font-black text-[#111827] mt-0.5">
              Seu DAS vence em 5 dias.
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Guia oficial de R$ 75,90 do Simples Nacional já provisionada.
            </p>

            <button
              onClick={() => onNavigate('commitments')}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#D7FD3C] hover:bg-[#cbf425] text-black font-black text-xs transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
            >
              Ver detalhes →
            </button>
          </div>

          {/* CARD 2: META DO MÊS DARK OBSIDIAN (COM ANEL CIRCULAR 70% E CORES DO MOCKUP) */}
          <div className="bg-[#111827] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#D7FD3C] uppercase tracking-wider">Metas</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">Novembro</span>
            </div>

            <h3 className="text-base font-black text-white mb-2">Meta do mês</h3>

            {/* Anel Donut 70% */}
            <div className="flex items-center justify-center my-4">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" stroke="#1F2937" strokeWidth="12" fill="none" />
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
                  <span className="text-2xl font-black text-white">70%</span>
                </div>
              </div>
            </div>

            <p className="text-center text-sm font-bold text-slate-200">
              R$ 8.230 <span className="text-slate-400 font-normal">/ R$ 12.000</span>
            </p>

            <button
              onClick={() => onNavigate('commitments')}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#D7FD3C] font-black text-xs transition-all flex items-center justify-center gap-1"
            >
              Ver metas →
            </button>
          </div>

          {/* ANOTAÇÃO MANUSCRITA COM SETA (EXATAMENTE COMO NO MOCKUP) */}
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
