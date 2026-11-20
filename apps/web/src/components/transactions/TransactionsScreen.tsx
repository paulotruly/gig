'use client';

import React, { useState } from 'react';
import { AlertTriangle, Plus, Tag, Receipt, Building2, Zap } from '@/components/ui/icons';

interface TransactionItem {
  id: number;
  date: string;
  description: string;
  category: string;
  source: string;
  label: 'PERSONAL' | 'BUSINESS' | 'TAX' | 'SUPPLIER' | 'WITHDRAWAL';
  amount: string;
}

export function TransactionsScreen() {
  const [filter, setFilter] = useState<'ALL' | 'PJ' | 'PF' | 'TAX'>('ALL');
  const [transactions, setTransactions] = useState<TransactionItem[]>([
    {
      id: 1,
      date: 'Hoje, 14:20',
      description: 'Pix - Cliente Acme Tech',
      category: 'Serviços Prestados',
      source: 'REGRA',
      label: 'BUSINESS',
      amount: '+ R$ 3.500,00',
    },
    {
      id: 2,
      date: 'Ontem, 19:15',
      description: 'Farmácia São Paulo',
      category: 'Saúde & Cuidados',
      source: 'APRENDIDO',
      label: 'PERSONAL',
      amount: '- R$ 86,40',
    },
    {
      id: 3,
      date: '15/Nov',
      description: 'DAS MEI Simples Nacional',
      category: 'Impostos Federais',
      source: 'REGRA',
      label: 'TAX',
      amount: '- R$ 75,90',
    },
    {
      id: 4,
      date: '14/Nov',
      description: 'Kalunga Papelaria',
      category: 'Materiais de Escritório',
      source: 'USUÁRIO',
      label: 'SUPPLIER',
      amount: '- R$ 340,00',
    },
    {
      id: 5,
      date: '10/Nov',
      description: 'Retirada Pró-labore Ester',
      category: 'Pró-labore',
      source: 'GIG MOTOR',
      label: 'WITHDRAWAL',
      amount: '- R$ 1.850,00',
    },
    {
      id: 6,
      date: '08/Nov',
      description: 'Pix - Projeto Identidade Visual',
      category: 'Design & Branding',
      source: 'REGRA',
      label: 'BUSINESS',
      amount: '+ R$ 2.400,00',
    },
  ]);

  const toggleLabel = (id: number) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextLabel = t.label === 'PERSONAL' ? 'BUSINESS' : 'PERSONAL';
          return { ...t, label: nextLabel, source: 'USUÁRIO' };
        }
        return t;
      }),
    );
  };

  const filtered = transactions.filter((t) => {
    if (filter === 'PJ') return t.label === 'BUSINESS' || t.label === 'SUPPLIER';
    if (filter === 'PF') return t.label === 'PERSONAL' || t.label === 'WITHDRAWAL';
    if (filter === 'TAX') return t.label === 'TAX';
    return true;
  });

  return (
    <section className="w-full space-y-5 pb-24 lg:pb-8">
      
      {/* Header do Módulo */}
      <div className="bg-white p-5 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D7FD3C] text-black">
              Separação de Contas
            </span>
            <h2 className="text-xl font-extrabold text-[#111827] mt-1">Transações PF vs PJ</h2>
          </div>
          <button
            onClick={() => alert('Para importar, envie seu arquivo OFX ou CSV.')}
            className="px-3.5 py-1.5 rounded-full bg-[#111827] hover:bg-black text-[#D7FD3C] font-bold text-xs flex items-center gap-1.5 active:scale-95 shadow-2xs transition-all"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Subir OFX</span>
          </button>
        </div>

        {/* Alerta de Contas Misturadas (Diferencial GiG) */}
        <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center gap-3">
          <AlertTriangle size={22} className="text-[#D97706] shrink-0" />
          <div className="text-xs leading-tight">
            <strong className="text-[#92400E]">28% de gastos pessoais identificados na conta jurídica</strong>
            <p className="text-[#B45309] mt-0.5">Toque na etiqueta ao lado da transação para trocar de PF para PJ instantaneamente.</p>
          </div>
        </div>

        {/* Filtros em Pílulas */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filter === 'ALL' ? 'bg-[#111827] text-white shadow-2xs' : 'bg-[#F1F5F9] text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todas ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('PJ')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filter === 'PJ' ? 'bg-[#10B981] text-white shadow-2xs' : 'bg-[#F1F5F9] text-slate-700 hover:bg-slate-200'
            }`}
          >
            PJ Empresa
          </button>
          <button
            onClick={() => setFilter('PF')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filter === 'PF' ? 'bg-[#D97706] text-white shadow-2xs' : 'bg-[#F1F5F9] text-slate-700 hover:bg-slate-200'
            }`}
          >
            PF Pessoal
          </button>
          <button
            onClick={() => setFilter('TAX')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filter === 'TAX' ? 'bg-[#EF4444] text-white shadow-2xs' : 'bg-[#F1F5F9] text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tributos / DAS
          </button>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white rounded-3xl border border-[#E6EFE2] shadow-2xs divide-y divide-[#F1F5E9] overflow-hidden">
        {filtered.map((t) => (
          <div key={t.id} className="p-4 sm:p-5 hover:bg-[#FBFDF8] transition-colors space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
                    t.label === 'BUSINESS'
                      ? 'bg-[#ECFDF5] text-[#10B981]'
                      : t.label === 'PERSONAL'
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : t.label === 'TAX'
                          ? 'bg-[#FEF2F2] text-[#EF4444]'
                          : t.label === 'WITHDRAWAL'
                            ? 'bg-[#D7FD3C] text-black'
                            : 'bg-[#EFF6FF] text-[#1E40AF]'
                  }`}
                >
                  {t.label === 'BUSINESS' && <Building2 size={18} />}
                  {t.label === 'PERSONAL' && <Tag size={18} />}
                  {t.label === 'TAX' && <Receipt size={18} />}
                  {t.label === 'WITHDRAWAL' && <Zap size={18} />}
                  {t.label === 'SUPPLIER' && <Building2 size={18} />}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-sm text-[#111827] truncate">{t.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.date} • {t.category}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className={`font-black text-sm ${t.amount.startsWith('+') ? 'text-[#10B981]' : 'text-[#111827]'}`}>
                  {t.amount}
                </p>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">{t.source}</span>
              </div>
            </div>

            {/* Ação de 1 toque para alterar rótulo */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-400 text-[11px]">Classificação contábil:</span>
              <button
                onClick={() => toggleLabel(t.id)}
                className={`px-3 py-1 rounded-full font-bold text-xs active:scale-95 transition-transform ${
                  t.label === 'PERSONAL'
                    ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                    : t.label === 'BUSINESS'
                      ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                      : t.label === 'TAX'
                        ? 'bg-[#FEF2F2] text-[#991B1B]'
                        : 'bg-slate-100 text-slate-700'
                }`}
              >
                {t.label === 'PERSONAL'
                  ? 'Pessoal PF (Clique p/ alternar)'
                  : t.label === 'BUSINESS'
                    ? 'Empresa PJ (Clique p/ alternar)'
                    : t.label}
              </button>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
