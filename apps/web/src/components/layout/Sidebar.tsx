'use client';

import React from 'react';
import {
  Home,
  LineChart,
  ArrowLeftRight,
  Receipt,
  GraduationCap,
  MessageSquare,
  Zap,
} from '@/components/ui/icons';

export type ScreenId = 'home' | 'forecast' | 'transactions' | 'commitments' | 'tracks' | 'whatsapp';

interface SidebarProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
}

export function Sidebar({ currentScreen, onSelectScreen }: SidebarProps) {
  const menuItems = [
    { id: 'home' as ScreenId, label: 'Início (Panorama)', icon: Home },
    { id: 'forecast' as ScreenId, label: 'Cenários & Fôlego', icon: LineChart },
    { id: 'transactions' as ScreenId, label: 'Transações PF / PJ', icon: ArrowLeftRight },
    { id: 'commitments' as ScreenId, label: 'Metas & DAS MEI', icon: Receipt },
    { id: 'tracks' as ScreenId, label: 'Trilhas Educativas', icon: GraduationCap },
    { id: 'whatsapp' as ScreenId, label: 'WhatsApp Copilot', icon: MessageSquare },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-5">
      {/* Menu Principal */}
      <div className="bg-white p-3.5 rounded-3xl border border-[#E6EFE2] shadow-xs space-y-1">
        <p className="text-[11px] font-bold text-[#94A3B8] uppercase px-3 py-1.5 tracking-wider">
          Navegação
        </p>

        {menuItems.map((item) => {
          const isActive = currentScreen === item.id;
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectScreen(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all text-left group ${
                isActive
                  ? 'bg-[#D7FD3C] text-[#111827] font-extrabold shadow-2xs'
                  : 'text-[#4B5563] hover:bg-[#F3FCE2] hover:text-[#111827] font-medium'
              }`}
            >
              <span
                className={`transition-transform group-hover:scale-110 ${
                  isActive ? 'text-[#111827]' : 'text-[#64748B]'
                }`}
              >
                <IconComponent size={18} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Widget Retirada Segura */}
      <div className="bg-[#111827] text-white p-5 rounded-3xl relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#D7FD3C] rounded-full blur-2xl opacity-20 pointer-events-none"></div>

        <div className="flex items-center gap-1.5 text-[#D7FD3C] text-xs font-bold mb-2">
          <Zap size={15} strokeWidth={2.5} />
          <span>Retirada Segura Hoje</span>
        </div>

        <p className="text-xs text-slate-300 mb-1">Para sua conta pessoal este mês:</p>
        <p className="text-2xl font-black text-white tracking-tight mb-1">R$ 1.850,00</p>
        <p className="text-[11px] text-[#A3E635] font-medium">✓ Não compromete DAS nem contas</p>

        <button
          onClick={() => onSelectScreen('forecast')}
          className="mt-3.5 w-full py-2 bg-[#D7FD3C] hover:bg-[#cbf425] text-black text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95"
        >
          Entender cálculo
        </button>
      </div>

      {/* Frase Manuscrita do Mockup */}
      <div className="px-3 text-center">
        <p className="handwriting text-xl text-[#334155] rotate-[-2deg] select-none leading-tight">
          Planejamento de hoje, <br />
          conquistas amanhã ↗
        </p>
      </div>
    </aside>
  );
}
