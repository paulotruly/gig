'use client';

import React, { useState } from 'react';
import { ChevronRight, Receipt, Rocket, Scissors, Waves } from '@/components/ui/icons';
import { EmptyCard, ErrorCard, FormError, LoadingCard } from '@/components/ui/states';
import { api } from '@/lib/api';
import { useBusinessData } from '@/lib/session';
import { errorMessage, useResource } from '@/lib/useResource';

const ICONS: Record<string, typeof Waves> = {
  'fluxo-de-caixa': Waves,
  'separar-contas': Scissors,
  'impostos-e-das': Receipt,
  runway: Rocket,
};

export function TracksScreen() {
  const { business } = useBusinessData();
  const tracks = useResource(() => api.listTracks(), []);
  // A API ainda não devolve o progresso salvo (P-17); mostra o que foi registrado agora.
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [error, setError] = useState<string>();

  async function advance(trackId: number, percent: number) {
    setError(undefined);
    try {
      const saved = await api.saveTrackProgress(trackId, business.id, percent);
      setProgress((p) => ({ ...p, [trackId]: saved.percent }));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <section className="w-full space-y-5 pb-24 lg:pb-8">
      <div className="bg-white p-5 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D7FD3C] text-black">
          Educação prática GiG
        </span>
        <h2 className="text-xl font-extrabold text-[#111827]">Trilhas rápidas</h2>
        <p className="text-xs text-[#64748B]">
          Aprenda o que fazer no momento em que o seu negócio precisa de uma decisão.
        </p>
      </div>

      <FormError message={error} />
      {tracks.loading && !tracks.data && <LoadingCard />}
      {tracks.error && <ErrorCard error={tracks.error} onRetry={() => void tracks.reload()} />}
      {tracks.data && tracks.data.tracks.length === 0 && <EmptyCard title="Nenhuma trilha ainda" />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tracks.data?.tracks.map((track) => {
          const Icon = ICONS[track.slug] ?? Waves;
          const percent = progress[track.id];
          const done = percent === 100;
          return (
            <div
              key={track.id}
              className="bg-white p-5 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-3 hover:border-[#D7FD3C] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-2xl bg-[#F8FAF5] border border-[#E6EFE2] flex items-center justify-center text-[#111827]">
                    <Icon size={20} strokeWidth={2.2} />
                  </span>
                  <h3 className="font-extrabold text-sm text-[#111827]">{track.title}</h3>
                </div>
                {done && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#D7FD3C] text-black">
                    Concluída
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{track.summary}</p>

              {percent !== undefined && (
                <div className="w-full h-2 bg-[#F1F5E9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D7FD3C] rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => void advance(track.id, 100)}
                  disabled={done}
                  className="px-3.5 py-1.5 rounded-full bg-[#111827] hover:bg-black text-[#D7FD3C] font-bold text-xs flex items-center gap-1 active:scale-95 transition-all disabled:opacity-60"
                >
                  {done ? 'Trilha concluída' : 'Marcar como concluída'}
                  {!done && <ChevronRight size={13} strokeWidth={2.5} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
