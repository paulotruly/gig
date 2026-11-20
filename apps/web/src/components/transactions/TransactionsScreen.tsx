'use client';

import { LABEL_VALUES, type LabelValue, type Transaction } from '@gig/shared/contracts';
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Building2, Plus, Receipt, Tag, Zap } from '@/components/ui/icons';
import { EmptyCard, ErrorCard, FormError, LoadingCard } from '@/components/ui/states';
import { api } from '@/lib/api';
import {
  formatDate,
  formatSignedMoney,
  isNegative,
  LABEL_NAMES,
  LABEL_SOURCE_NAMES,
} from '@/lib/format';
import { useBusinessData } from '@/lib/session';
import { errorMessage, useResource } from '@/lib/useResource';

const PAGE_SIZE = 50;

type Filter = 'ALL' | 'PJ' | 'PF' | 'TAX';

const FILTERS: { id: Filter; name: string; active: string }[] = [
  { id: 'ALL', name: 'Todas', active: 'bg-[#111827] text-white' },
  { id: 'PJ', name: 'Empresa (PJ)', active: 'bg-[#10B981] text-white' },
  { id: 'PF', name: 'Pessoal (PF)', active: 'bg-[#D97706] text-white' },
  { id: 'TAX', name: 'Tributos', active: 'bg-[#EF4444] text-white' },
];

// A origem PF/PJ vem da API; o filtro só escolhe o que mostrar nesta página.
function matches(filter: Filter, t: Transaction): boolean {
  if (filter === 'PJ') return t.origin === 'BUSINESS' && t.label !== 'TAX';
  if (filter === 'PF') return t.origin === 'PERSONAL';
  if (filter === 'TAX') return t.label === 'TAX';
  return true;
}

const LABEL_STYLES: Record<LabelValue, string> = {
  BUSINESS: 'bg-[#ECFDF5] text-[#10B981]',
  PERSONAL: 'bg-[#FEF3C7] text-[#92400E]',
  TAX: 'bg-[#FEF2F2] text-[#EF4444]',
  WITHDRAWAL: 'bg-[#D7FD3C] text-black',
  SUPPLIER: 'bg-[#EFF6FF] text-[#1E40AF]',
};

function LabelIcon({ label }: { label: LabelValue }) {
  if (label === 'PERSONAL') return <Tag size={18} />;
  if (label === 'TAX') return <Receipt size={18} />;
  if (label === 'WITHDRAWAL') return <Zap size={18} />;
  return <Building2 size={18} />;
}

export function TransactionsScreen({
  isBalanceHidden,
  onOpenImportModal,
  focusSearch = 0,
}: {
  isBalanceHidden: boolean;
  focusSearch?: number;
  onOpenImportModal: () => void;
}) {
  const { business, version, refreshAll } = useBusinessData();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (focusSearch > 0) searchRef.current?.focus();
  }, [focusSearch]);
  const [savingId, setSavingId] = useState<number>();
  const [error, setError] = useState<string>();
  const list = useResource(
    () => api.listTransactions(business.id, { page, pageSize: PAGE_SIZE, q: q || undefined }),
    [business.id, page, q, version],
  );

  const transactions = list.data?.transactions ?? [];
  const filtered = transactions.filter((t) => matches(filter, t));
  const lastPage = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;

  async function correct(t: Transaction, label: LabelValue) {
    if (label === t.label) return;
    setSavingId(t.id);
    setError(undefined);
    try {
      await api.correctTransaction(t.id, label);
      // A correção também alcança as parecidas e marca a previsão para recálculo.
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingId(undefined);
    }
  }

  return (
    <section className="w-full space-y-5 pb-24 lg:pb-8">
      <div className="bg-white p-5 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D7FD3C] text-black">
              Separação de contas
            </span>
            <h2 className="text-xl font-extrabold text-[#111827] mt-1">Transações PF e PJ</h2>
          </div>
          <button
            onClick={onOpenImportModal}
            className="px-3.5 py-1.5 rounded-full bg-[#111827] hover:bg-black text-[#D7FD3C] font-bold text-xs flex items-center gap-1.5 active:scale-95 shadow-2xs transition-all"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Subir extrato</span>
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center gap-3">
          <AlertTriangle size={22} className="text-[#D97706] shrink-0" />
          <p className="text-xs leading-tight text-[#B45309]">
            Se o GiG errou a classificação, troque a etiqueta. Ele aprende e corrige as transações
            parecidas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="transaction-search" className="text-xs font-bold">
            Buscar transações
          </label>
          <input
            id="transaction-search"
            ref={searchRef}
            type="search"
            maxLength={100}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar pela descrição"
            className="min-w-0 flex-1 rounded-xl border border-[#E6EFE2] p-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setQ('');
              setPage(1);
              searchRef.current?.focus();
            }}
            className="text-xs font-bold"
          >
            Limpar
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filter === f.id ? f.active : 'bg-[#F1F5F9] text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.name}
              {f.id === 'ALL' && list.data ? ` (${list.data.total})` : ''}
            </button>
          ))}
        </div>
      </div>

      <FormError message={error} />
      {list.loading && !list.data && <LoadingCard />}
      {list.error && <ErrorCard error={list.error} onRetry={() => void list.reload()} />}
      {list.data && transactions.length === 0 && (
        <EmptyCard title={q ? 'Nenhuma transação encontrada' : 'Nenhuma transação ainda'}>
          {q
            ? 'Tente outra descrição ou limpe a busca.'
            : 'Envie um extrato CSV ou OFX da conta PJ.'}
        </EmptyCard>
      )}

      {filtered.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#E6EFE2] shadow-2xs divide-y divide-[#F1F5E9] overflow-hidden">
          {filtered.map((t) => (
            <div key={t.id} className="p-4 sm:p-5 hover:bg-[#FBFDF8] transition-colors space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${LABEL_STYLES[t.label]}`}
                  >
                    <LabelIcon label={t.label} />
                  </div>
                  <div className="min-w-0">
                    {/* Texto do extrato sempre como texto, nunca como HTML. */}
                    <p className="font-extrabold text-sm text-[#111827] truncate">
                      {t.description}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(t.date)} • {t.category}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`font-black text-sm ${
                      isNegative(t.amount) ? 'text-[#111827]' : 'text-[#10B981]'
                    }`}
                  >
                    {formatSignedMoney(t.amount, isBalanceHidden)}
                  </p>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    {LABEL_SOURCE_NAMES[t.labelSource]}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-400 text-[11px]">Classificação:</span>
                <select
                  value={t.label}
                  disabled={savingId === t.id}
                  onChange={(e) => void correct(t, e.target.value as LabelValue)}
                  className={`px-3 py-1 rounded-full font-bold text-xs border-0 ${LABEL_STYLES[t.label]}`}
                >
                  {LABEL_VALUES.map((label) => (
                    <option key={label} value={label}>
                      {LABEL_NAMES[label]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {list.data && lastPage > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 rounded-full bg-white border border-[#E6EFE2] font-bold disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-[#64748B]">
            Página {page} de {lastPage}
          </span>
          <button
            disabled={page >= lastPage}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 rounded-full bg-white border border-[#E6EFE2] font-bold disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </section>
  );
}
