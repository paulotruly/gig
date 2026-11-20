'use client';

import React from 'react';
import { Eye, EyeOff, Bell, Search, MessageSquare } from '@/components/ui/icons';
import { BUSINESS_TYPE_NAMES, firstName, initials } from '@/lib/format';
import { useSession } from '@/lib/session';

interface MobileHeaderProps {
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
  onOpenCopilot?: () => void;
  alertCount: number;
}

export function MobileHeader({
  isBalanceHidden,
  onToggleBalance,
  onOpenNotifications,
  onOpenSearch,
  onOpenCopilot,
  alertCount,
}: MobileHeaderProps) {
  const { state, business, logout } = useSession();
  const userName = state.status === 'authenticated' ? state.user.name : '';

  return (
    <header className="sticky top-0 z-40 bg-[#F8FAF5]/95 backdrop-blur-md border-b border-[#E6EFE2] px-4 pt-3 pb-3 max-w-md mx-auto">
      <div className="flex items-center justify-between gap-3">
        {/* Perfil e negócio */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-tr from-[#111827] via-[#1F2937] to-[#374151] text-white flex items-center justify-center font-black text-xs ring-2 ring-[#D7FD3C] shadow-xs">
            {initials(userName)}
          </div>

          <div className="text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-[#111827] tracking-tight truncate">
                {business?.name}
              </span>
              {business && (
                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md bg-[#111827] text-[#D7FD3C]">
                  {BUSINESS_TYPE_NAMES[business.type]}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
              <span>Olá, {firstName(userName)}</span>
              <span>•</span>
              <button onClick={() => void logout()} className="font-bold hover:underline">
                Sair
              </button>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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

          <button
            onClick={onOpenNotifications}
            title="Notificações"
            className="w-8 h-8 rounded-full bg-white border border-[#DFE8D7] flex items-center justify-center text-slate-700 hover:bg-[#F3FCE2] transition-colors active:scale-95 shadow-2xs relative"
          >
            <Bell size={16} className="text-slate-700" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"></span>
            )}
          </button>

          <button
            onClick={onOpenSearch}
            title="Transações"
            className="w-8 h-8 rounded-full bg-[#D7FD3C] flex items-center justify-center text-black font-bold hover:bg-[#cbf425] transition-colors active:scale-95 shadow-2xs"
          >
            <Search size={15} strokeWidth={2.5} />
          </button>

          {onOpenCopilot && (
            <button
              onClick={onOpenCopilot}
              title="WhatsApp"
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
