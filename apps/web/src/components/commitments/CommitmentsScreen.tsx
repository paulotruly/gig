'use client';

import React, { useState } from 'react';
import { Receipt, Copy, FileDown, Plus, CheckCircle2 } from '@/components/ui/icons';

export function CommitmentsScreen() {
  const [activeTab, setActiveTab] = useState<'pay' | 'receive'>('pay');

  return (
    <section className="w-full space-y-5 pb-24 lg:pb-8">
      
      {/* Header do Módulo */}
      <div className="bg-white p-5 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D7FD3C] text-black">
              Gestão de Vencimentos
            </span>
            <h2 className="text-xl font-extrabold text-[#111827] mt-1">Compromissos & DAS MEI</h2>
          </div>
          <button
            onClick={() => alert('Adicionar novo compromisso')}
            className="w-8 h-8 rounded-full bg-[#111827] text-[#D7FD3C] font-bold flex items-center justify-center text-xs active:scale-95 shadow-2xs"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Toggle A Pagar / A Receber */}
        <div className="grid grid-cols-2 p-1 bg-[#EEF4E8] rounded-2xl border border-[#DFE8D7] gap-1">
          <button
            onClick={() => setActiveTab('pay')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'pay'
                ? 'bg-[#111827] text-[#D7FD3C] shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            A Pagar (Fixos & Tributos)
          </button>
          <button
            onClick={() => setActiveTab('receive')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'receive'
                ? 'bg-[#111827] text-[#10B981] shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            A Receber (Previsão de Clientes)
          </button>
        </div>
      </div>

      {/* Conteúdo Aba A Pagar */}
      {activeTab === 'pay' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Card Destaque: DAS MEI com Copia e Cola Pix */}
          <div className="bg-white p-6 rounded-3xl border-2 border-[#EF4444] shadow-md space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#EF4444]">
                  Urgente • Vence em 5 dias
                </span>
                <h3 className="font-extrabold text-base text-[#111827] mt-2 flex items-center gap-2">
                  <Receipt size={18} className="text-[#EF4444]" /> DAS MEI Simples Nacional
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Competência Outubro • Vencimento 20/Nov</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#EF4444]">R$ 75,90</span>
                <span className="flex items-center justify-end gap-1 text-[10px] text-[#10B981] font-bold mt-0.5">
                  <CheckCircle2 size={13} /> Saldo reservado
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#F1F5E9] flex gap-2.5">
              <button
                onClick={() => alert('Código Pix Copia e Cola copiado com sucesso!')}
                className="flex-1 py-2.5 rounded-xl bg-[#D7FD3C] hover:bg-[#cbf425] text-black font-extrabold text-xs active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Copy size={15} strokeWidth={2.2} /> Copiar Pix Copia e Cola
              </button>
              <button
                onClick={() => alert('Abrindo PDF da Guia DAS...')}
                className="px-4 py-2.5 rounded-xl bg-[#F8FAF5] border border-slate-200 text-slate-700 font-bold text-xs active:scale-95 flex items-center gap-1.5 hover:bg-slate-100"
              >
                <FileDown size={15} /> PDF
              </button>
            </div>
          </div>

          {/* Outros Compromissos Fixos */}
          <div className="bg-white rounded-3xl border border-[#E6EFE2] shadow-2xs divide-y divide-[#F1F5E9] overflow-hidden">
            <div className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[#111827]">Aluguel Sala / Coworking</p>
                <p className="text-xs text-slate-400">Vence 05/Dez • Mensal</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-[#111827]">R$ 1.200,00</p>
                <span className="text-[10px] text-slate-400 font-medium">Aguardando</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[#111827]">Honorários Contabilidade</p>
                <p className="text-xs text-slate-400">Vence 10/Dez • Mensal</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-[#111827]">R$ 180,00</p>
                <span className="text-[10px] text-slate-400 font-medium">Aguardando</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[#111827]">Internet Fibra Escritório</p>
                <p className="text-xs text-slate-400">Vence 12/Dez • Mensal</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-[#111827]">R$ 119,90</p>
                <span className="text-[10px] text-slate-400 font-medium">Aguardando</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Aba A Receber */}
      {activeTab === 'receive' && (
        <div className="bg-white rounded-3xl border border-[#E6EFE2] shadow-2xs divide-y divide-[#F1F5E9] overflow-hidden">
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-[#111827]">Consultoria Empresa Alpha</p>
              <p className="text-xs text-[#10B981] font-semibold">Boleto vence 24/Nov</p>
            </div>
            <div className="text-right">
              <p className="font-black text-sm text-[#10B981]">+ R$ 3.500,00</p>
              <span className="text-[10px] bg-green-50 text-[#10B981] font-bold px-2 py-0.5 rounded-full">Confirmado</span>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-[#111827]">Identidade Visual Beta</p>
              <p className="text-xs text-slate-400">Parcela 2/2 prevista 02/Dez</p>
            </div>
            <div className="text-right">
              <p className="font-black text-sm text-[#10B981]">+ R$ 2.400,00</p>
              <span className="text-[10px] text-slate-400">A faturar</span>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
