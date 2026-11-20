'use client';

import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Caught Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8FAF5] flex items-center justify-center p-6 text-[#111827]">
      <div className="max-w-md w-full bg-white p-6 rounded-3xl border border-[#E6EFE2] shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-xl font-black">Ops! Algo deu errado ao carregar</h2>
        <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl font-mono text-left overflow-auto max-h-36">
          {error.message || 'Erro inesperado'}
        </p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-full bg-[#D7FD3C] hover:bg-[#cbf425] text-black font-extrabold text-xs shadow-xs transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
