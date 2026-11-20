'use client';

import React from 'react';
import { Home, LineChart, ArrowLeftRight, Receipt, GraduationCap } from '@/components/ui/icons';

export type MobileTab = 'home' | 'forecast' | 'transactions' | 'commitments' | 'tracks';

interface BottomNavProps {
  currentTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  dasAlertCount?: number;
}

export function BottomNav({ currentTab, onSelectTab, dasAlertCount = 1 }: BottomNavProps) {
  const tabs = [
    {
      id: 'home' as MobileTab,
      label: 'Início',
      icon: Home,
    },
    {
      id: 'forecast' as MobileTab,
      label: 'Cenários',
      icon: LineChart,
    },
    {
      id: 'transactions' as MobileTab,
      label: 'Extrato',
      icon: ArrowLeftRight,
    },
    {
      id: 'commitments' as MobileTab,
      label: 'DAS & Metas',
      hasBadge: dasAlertCount > 0,
      icon: Receipt,
    },
    {
      id: 'tracks' as MobileTab,
      label: 'Aprender',
      icon: GraduationCap,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111827]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 pt-2 pb-4 sm:pb-3 max-w-md mx-auto transition-all shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 group active:scale-95"
            >
              {/* Indicador de Tab Ativa */}
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#D7FD3C] text-[#111827] shadow-[0_0_15px_rgba(215,253,60,0.5)]'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>

              {/* Badge de Alerta (Ex: DAS pendente) */}
              {tab.hasBadge && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-[#111827] animate-pulse"></span>
              )}

              {/* Rótulo */}
              <span
                className={`text-[10px] mt-1 tracking-tight transition-colors ${
                  isActive ? 'font-bold text-[#D7FD3C]' : 'font-medium text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
