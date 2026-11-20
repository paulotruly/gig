'use client';

import { BUSINESS_TYPES, cashBalanceBody, createBusinessBody } from '@gig/shared/contracts';
import React, { useState } from 'react';
import { FormError, PrimaryButton, TextField } from '@/components/ui/states';
import { api, INGESTION_CONSENT_SCOPE } from '@/lib/api';
import { BUSINESS_TYPE_NAMES, moneyInputToDecimal, todayIso } from '@/lib/format';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/useResource';

export function BusinessSetup() {
  const { state, reloadBusinesses, logout } = useSession();
  const [name, setName] = useState('');
  const [type, setType] = useState<(typeof BUSINESS_TYPES)[number]>('MEI');
  const [partnerCode, setPartnerCode] = useState('');
  const [balance, setBalance] = useState('');
  const [balanceDate, setBalanceDate] = useState(todayIso());
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);
  // Se um passo seguinte falhar, o reenvio não cria o negócio de novo.
  const [createdId, setCreatedId] = useState<number>();

  const userName = state.status === 'authenticated' ? state.user.name : '';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);
    const businessBody = createBusinessBody.safeParse({
      name,
      type,
      ...(partnerCode.trim() ? { partnerCode: partnerCode.trim() } : {}),
    });
    if (!businessBody.success) {
      setError('Informe o nome do negócio.');
      return;
    }
    const balanceBody = balance.trim()
      ? cashBalanceBody.safeParse({ amount: moneyInputToDecimal(balance), date: balanceDate })
      : undefined;
    if (balanceBody && !balanceBody.success) {
      setError('Informe o saldo como valor em reais, por exemplo 4.220,00.');
      return;
    }
    setSending(true);
    try {
      let businessId = createdId;
      if (businessId === undefined) {
        businessId = (await api.createBusiness(businessBody.data)).id;
        setCreatedId(businessId);
      }
      if (balanceBody?.success) await api.setCashBalance(businessId, balanceBody.data);
      if (consent) {
        await api.grantConsent(businessId, 'ASSISTED_INGESTION', INGESTION_CONSENT_SCOPE);
      }
      await reloadBusinesses();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAF5]">
      <form
        onSubmit={submit}
        noValidate
        className="w-full max-w-md bg-white rounded-3xl border border-[#E6EFE2] shadow-card p-6 space-y-4"
      >
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D7FD3C] text-black">
            Primeiros passos
          </span>
          <h1 className="text-lg font-black text-[#111827] mt-2">
            {userName ? `Olá, ${userName.split(' ')[0]}! ` : ''}Cadastre o seu negócio
          </h1>
          <p className="text-xs text-[#64748B]">
            Com o saldo atual e o extrato, o GiG calcula os cenários do seu caixa.
          </p>
        </div>

        <TextField label="Nome do negócio" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#334155]">Tipo</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as (typeof BUSINESS_TYPES)[number])}
            className="w-full px-3.5 py-2.5 bg-white border border-[#E6EFE2] rounded-xl text-sm"
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {BUSINESS_TYPE_NAMES[t]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Saldo atual (R$)"
            inputMode="decimal"
            placeholder="4.220,00"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
          <TextField
            label="Data do saldo"
            type="date"
            max={todayIso()}
            value={balanceDate}
            onChange={(e) => setBalanceDate(e.target.value)}
          />
        </div>

        <TextField
          label="Código de parceiro (opcional)"
          value={partnerCode}
          onChange={(e) => setPartnerCode(e.target.value)}
        />

        <label className="flex items-start gap-2 text-xs text-[#334155]">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Autorizo o GiG a ler os extratos que eu enviar para classificar as transações do
            negócio. Posso revogar quando quiser.
          </span>
        </label>

        <FormError message={error} />
        <PrimaryButton type="submit" disabled={sending}>
          {sending ? 'Salvando...' : 'Começar'}
        </PrimaryButton>
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full text-xs font-bold text-[#64748B] hover:underline"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
