'use client';

import type { StatementUploadResponse } from '@gig/shared/contracts';
import React, { useRef, useState } from 'react';
import { FolderUp, X, CheckCircle2 } from '@/components/ui/icons';
import { FormError } from '@/components/ui/states';
import { api, ApiError, INGESTION_CONSENT_SCOPE, STATEMENT_MAX_BYTES } from '@/lib/api';
import { useBusinessData } from '@/lib/session';
import { errorMessage } from '@/lib/useResource';

function formatOf(file: File): 'csv' | 'ofx' | undefined {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return 'csv';
  if (name.endsWith('.ofx')) return 'ofx';
  return undefined;
}

export function ImportStatementModal({ onClose }: { onClose: () => void }) {
  const { business, refreshAll } = useBusinessData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [error, setError] = useState<string>();
  const [needsConsent, setNeedsConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<StatementUploadResponse>();

  function pick(selected: File | undefined) {
    setError(undefined);
    setResult(undefined);
    setNeedsConsent(false);
    if (!selected) return;
    if (!formatOf(selected)) {
      setError('Envie um arquivo .csv ou .ofx.');
      return;
    }
    if (selected.size > STATEMENT_MAX_BYTES) {
      setError('O arquivo passa de 5 MB. Envie um período menor.');
      return;
    }
    setFile(selected);
  }

  async function upload(grantConsent = false) {
    const format = file && formatOf(file);
    if (!file || !format) return;
    setSending(true);
    setError(undefined);
    try {
      if (grantConsent) {
        await api.grantConsent(business.id, 'ASSISTED_INGESTION', INGESTION_CONSENT_SCOPE);
        setNeedsConsent(false);
      }
      const text = await file.text();
      setResult(await api.uploadStatement(business.id, { text, format }));
      refreshAll();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'consent_required') {
        setNeedsConsent(true);
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6EFE2] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-lg text-[#111827]">Importar extrato bancário PJ</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              O GiG classifica receitas, despesas e retiradas a partir do arquivo.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files[0]);
          }}
          className="w-full border-2 border-dashed border-[#D7FD3C] bg-[#F8FAF5] rounded-2xl p-8 text-center hover:bg-[#F3FCE2] transition-colors flex flex-col items-center"
        >
          <span className="w-14 h-14 rounded-2xl bg-[#F3FCE2] text-[#294A07] flex items-center justify-center mb-2.5">
            <FolderUp size={28} />
          </span>
          <p className="text-sm font-black text-[#111827]">
            {file ? file.name : 'Clique ou arraste o arquivo aqui'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Formatos aceitos: <strong>.OFX</strong> ou <strong>.CSV</strong>, até 5 MB
          </p>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.ofx"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />

        {needsConsent && (
          <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs space-y-2">
            <p className="text-[#92400E] font-bold">
              Para importar, autorize o GiG a ler os extratos que você enviar.
            </p>
            <p className="text-[#B45309]">Você pode revogar a autorização quando quiser.</p>
            <button
              onClick={() => void upload(true)}
              disabled={sending}
              className="px-3 py-1.5 rounded-full bg-[#111827] text-[#D7FD3C] font-bold"
            >
              Autorizar e importar
            </button>
          </div>
        )}

        {result && (
          <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs flex gap-2">
            <CheckCircle2 size={16} className="text-[#10B981]" />
            <p className="text-[#065F46]">
              <strong>{result.rowsImported}</strong> de {result.rowsTotal} lançamentos importados
              {result.duplicates > 0 ? ` (${result.duplicates} já existiam)` : ''}. A previsão será
              recalculada em instantes.
            </p>
          </div>
        )}

        <FormError message={error} />

        <div className="flex gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
          >
            {result ? 'Fechar' : 'Cancelar'}
          </button>
          <button
            onClick={() => void upload()}
            disabled={!file || sending || needsConsent}
            className="flex-1 py-2.5 rounded-xl text-xs font-black bg-[#D7FD3C] hover:bg-[#cbf425] text-black shadow-xs transition-all active:scale-95 disabled:opacity-60"
          >
            {sending ? 'Processando...' : 'Processar extrato'}
          </button>
        </div>
      </div>
    </div>
  );
}
