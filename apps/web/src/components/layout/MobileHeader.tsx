'use client';

import React from 'react';
import { Eye, EyeOff, Bell, Search, MessageSquare } from '@/components/ui/icons';

interface MobileHeaderProps {
  businessName: string;
  userName: string;
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
  onOpenCopilot?: () => void;
}

export function MobileHeader({
  businessName = 'Studio Criativo MEI',
  userName = 'Ester Silva',
  isBalanceHidden,
  onToggleBalance,
  onOpenNotifications,
  onOpenSearch,
  onOpenCopilot,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#F8FAF5]/95 backdrop-blur-md border-b border-[#E6EFE2] px-4 pt-3 pb-3 max-w-md mx-auto">
      <div className="flex items-center justify-between gap-3">
        
        {/* Perfil & Seletor de Empresa */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#111827] via-[#1F2937] to-[#374151] text-white flex items-center justify-center font-black text-xs ring-2 ring-[#D7FD3C] shadow-xs active:scale-95 transition-all">
              ES
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] rounded-full ring-2 ring-[#F8FAF5] flex items-center justify-center">
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-[#111827] tracking-tight">{businessName}</span>
              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md bg-[#111827] text-[#D7FD3C]">
                MEI
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              <span>Olá, {userName.split(' ')[0]}</span>
              <span>•</span>
              <span className="text-[#059669] font-bold text-[10px]">Open Finance Ativo</span>
            </p>
          </div>
        </div>

        {/* Ações Rápidas do Topo */}
        <div className="flex items-center gap-1.5">
          {/* Botão Ocultar / Mostrar Saldo */}
          <button
            onClick={onToggleBalance}
            title={isBalanceHidden ? 'Mostrar valores' : 'Ocultar valores'}
            className="w-8 h-8 rounded-full bg-white border border-[#DFE8D7] flex items-center justify-center text-slate-700 hover:bg-[#F3FCE2] transition-colors active:scale-95 shadow-2xs"
          >
            {isBalanceHidden ? (
              <EyeOff size={16} className="text-slate-400" />
            ) : (
              <Eye size={16} className="text-slate-700" />
            )}
          </button>

          {/* Sino de Notificações com badge */}
          <button
            onClick={onOpenNotifications}
            className="w-8 h-8 rounded-full bg-white border border-[#DFE8D7] flex items-center justify-center text-slate-700 hover:bg-[#F3FCE2] transition-colors active:scale-95 shadow-2xs relative"
          >
            <Bell size={16} className="text-slate-700" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"></span>
          </button>

          {/* Busca Rápida */}
          <button
            onClick={onOpenSearch}
            className="w-8 h-8 rounded-full bg-[#D7FD3C] flex items-center justify-center text-black font-bold hover:bg-[#cbf425] transition-colors active:scale-95 shadow-2xs"
          >
            <Search size={15} strokeWidth={2.5} />
          </button>

          {/* Copilot WhatsApp */}
          {onOpenCopilot && (
            <button
              onClick={onOpenCopilot}
              className="w-8 h-8 rounded-full bg-[#111827] flex items-center justify-center text-[#D7FD3C] hover:bg-black transition-colors active:scale-95 shadow-2xs"
            >
              <MessageSquare size={15} strokeWidth={2.2} />
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
