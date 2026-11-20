'use client';

import { createCommitmentBody, type Commitment } from '@gig/shared/contracts';
import React, { useState } from 'react';
import { Plus, Receipt, X } from '@/components/ui/icons';
import { EmptyCard, ErrorCard, FormError, LoadingCard, TextField } from '@/components/ui/states';
import { api } from '@/lib/api';
import { formatDate, formatMoney, moneyInputToDecimal, todayIso } from '@/lib/format';
import { useBusinessData } from '@/lib/session';
import { errorMessage } from '@/lib/useResource';

type Tab = 'FIXED_EXPENSE' | 'RECEIVABLE';

function NewCommitmentForm({ type, onDone }: { type: Tab; onDone: () => void }) {
  const { business, refreshAll } = useBusinessData();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(todayIso());
  const [monthly, setMonthly] = useState(type === 'FIXED_EXPENSE');
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = createCommitmentBody.safeParse({
      type,
      description,
      amount: moneyInputToDecimal(amount),
      dueDate,
      recurrence: monthly ? 'MONTHLY' : 'NONE',
    });
    if (!parsed.success) {
      setError('Informe a descrição, um valor positivo em reais e a data.');
      return;
    }
    setSending(true);
    setError(undefined);
    try {
      await api.createCommitment(business.id, parsed.data);
      refreshAll();
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="bg-white p-5 rounded-3xl border-2 border-[#D7FD3C] shadow-md space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-sm text-[#111827]">
          {type === 'FIXED_EXPENSE' ? 'Nova despesa fixa' : 'Novo recebível'}
        </h3>
        <button type="button" onClick={onDone} aria-label="Fechar">
          <X size={16} />
        </button>
      </div>
      <TextField
        label="Descrição"
        placeholder={type === 'FIXED_EXPENSE' ? 'DAS MEI, aluguel...' : 'Cliente, contrato...'}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Valor (R$)"
          inputMode="decimal"
          placeholder="75,90"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <TextField
          label="Vencimento"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-[#334155]">
        <input type="checkbox" checked={monthly} onChange={(e) => setMonthly(e.target.checked)} />
        Repete todo mês
      </label>
      <FormError message={error} />
      <button
        type="submit"
        disabled={sending}
        className="w-full py-2.5 rounded-xl bg-[#D7FD3C] hover:bg-[#cbf425] text-black font-black text-xs disabled:opacity-60"
      >
        {sending ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}

export function CommitmentsScreen({ isBalanceHidden }: { isBalanceHidden: boolean }) {
  const { business, commitments, refreshAll } = useBusinessData();
  const [tab, setTab] = useState<Tab>('FIXED_EXPENSE');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>();

  const list = (commitments.data?.commitments ?? []).filter((c) => c.type === tab);

  async function remove(c: Commitment) {
    if (!window.confirm(`Excluir "${c.description}"?`)) return;
    setError(undefined);
    try {
      await api.deleteCommitment(business.id, c.id);
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <section className="w-full space-y-5 pb-24 lg:pb-8">
      <div className="bg-white p-5 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D7FD3C] text-black">
              Gestão de vencimentos
            </span>
            <h2 className="text-xl font-extrabold text-[#111827] mt-1">Compromissos e DAS MEI</h2>
          </div>
          <button
            onClick={() => setCreating(true)}
            title="Adicionar compromisso"
            className="w-8 h-8 rounded-full bg-[#111827] text-[#D7FD3C] flex items-center justify-center active:scale-95 shadow-2xs"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="grid grid-cols-2 p-1 bg-[#EEF4E8] rounded-2xl border border-[#DFE8D7] gap-1">
          <button
            onClick={() => setTab('FIXED_EXPENSE')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'FIXED_EXPENSE' ? 'bg-[#111827] text-[#D7FD3C] shadow-xs' : 'text-slate-600'
            }`}
          >
            A pagar (fixos e tributos)
          </button>
          <button
            onClick={() => setTab('RECEIVABLE')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'RECEIVABLE' ? 'bg-[#111827] text-[#10B981] shadow-xs' : 'text-slate-600'
            }`}
          >
            A receber
          </button>
        </div>
      </div>

      {creating && <NewCommitmentForm key={tab} type={tab} onDone={() => setCreating(false)} />}
      <FormError message={error} />
      {commitments.loading && !commitments.data && <LoadingCard />}
      {commitments.error && (
        <ErrorCard error={commitments.error} onRetry={() => void commitments.reload()} />
      )}
      {commitments.data && list.length === 0 && !creating && (
        <EmptyCard title={tab === 'FIXED_EXPENSE' ? 'Nenhuma despesa fixa' : 'Nenhum recebível'}>
          Cadastre para o GiG considerar nos cenários de caixa.
        </EmptyCard>
      )}

      {list.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#E6EFE2] shadow-2xs divide-y divide-[#F1F5E9] overflow-hidden">
          {list.map((c) => (
            <div key={c.id} className="p-4 sm:p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {c.type === 'FIXED_EXPENSE' && (
                  <Receipt size={18} className="text-[#EF4444] shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#111827] truncate">{c.description}</p>
                  <p className="text-xs text-slate-400">
                    Vence {formatDate(c.dueDate)} •{' '}
                    {c.recurrence === 'MONTHLY' ? 'Mensal' : 'Única'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`font-black text-sm ${
                    c.type === 'RECEIVABLE' ? 'text-[#10B981]' : 'text-[#111827]'
                  }`}
                >
                  {formatMoney(c.amount, isBalanceHidden)}
                </p>
                <button
                  onClick={() => void remove(c)}
                  className="text-[10px] text-slate-400 font-bold hover:text-[#EF4444]"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
