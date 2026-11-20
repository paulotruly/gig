'use client';

import React from 'react';
import { Scissors, Waves, Receipt, Rocket, ChevronRight } from '@/components/ui/icons';

export function TracksScreen() {
  const tracks = [
    {
      id: 'separar-contas',
      title: 'Separar Contas PF e PJ',
      icon: Scissors,
      progress: 100,
      badge: 'Concluída 🎉',
      badgeClass: 'bg-[#D7FD3C] text-black',
      summary: 'Como desvincular a conta física da jurídica sem complicação no seu ritmo.',
      duration: '3 min',
    },
    {
      id: 'fluxo-de-caixa',
      title: 'Fluxo de Caixa Descomplicado',
      icon: Waves,
      progress: 75,
      badge: '75% Concluído',
      badgeClass: 'bg-[#ECFDF5] text-[#10B981]',
      summary: 'Como antecipar meses fracos e organizar os próximos vencimentos.',
      duration: '4 min',
      nextLesson: 'Como negociar prazos com clientes',
    },
    {
      id: 'impostos-e-das',
      title: 'Impostos e DAS no Prazo',
      icon: Receipt,
      progress: 30,
      badge: '30% Concluído',
      badgeClass: 'bg-amber-100 text-amber-800',
      summary: 'Provisionamento de tributos antes do vencimento para não pagar juros.',
      duration: '3 min',
      nextLesson: 'Como emitir NFS-e rápido',
    },
    {
      id: 'runway',
      title: 'Runway para Startups',
      icon: Rocket,
      progress: 0,
      badge: 'Novo',
      badgeClass: 'bg-slate-100 text-slate-600',
      summary: 'Como calcular seu tempo de caixa e reduzir a queima mensal.',
      duration: '5 min',
      nextLesson: 'Burn rate real',
    },
  ];

  return (
    <section className="w-full space-y-5 pb-24 lg:pb-8">
      
      {/* Header do Módulo */}
      <div className="bg-white p-5 rounded-3xl border border-[#E6EFE2] shadow-2xs space-y-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D7FD3C] text-black">
          Educação Prática GiG
        </span>
        <h2 className="text-xl font-extrabold text-[#111827]">Trilhas Rápidas de 3 Min</h2>
        <p className="text-xs text-[#64748B]">
          Aprenda o que fazer no momento exato em que seu negócio precisa de uma decisão.
        </p>
      </div>

      {/* Lista de Trilhas: 1 Coluna no Mobile, 2 Colunas no Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tracks.map((track) => {
          const Icon = track.icon;
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
                  <div>
                    <h3 className="font-extrabold text-sm text-[#111827]">{track.title}</h3>
                    <span className="text-[11px] text-slate-400">Duração: {track.duration}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${track.badgeClass}`}>
                  {track.badge}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {track.summary}
              </p>

              {/* Barra de Progresso */}
              <div className="space-y-1 pt-1">
                <div className="w-full h-2 bg-[#F1F5E9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D7FD3C] rounded-full transition-all duration-500"
                    style={{ width: `${track.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {track.nextLesson ? `Próxima: ${track.nextLesson}` : 'Trilha 100% concluída'}
                </span>
                <button
                  onClick={() => alert(`Iniciando trilha: ${track.title}`)}
                  className="px-3.5 py-1.5 rounded-full bg-[#111827] hover:bg-black text-[#D7FD3C] font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
                >
                  Continuar <ChevronRight size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}
