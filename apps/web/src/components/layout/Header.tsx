'use client';

import React from 'react';
import { Bell, Eye, EyeOff, FolderUp } from '@/components/ui/icons';
import { Logo } from '@/components/ui/Logo';
import { BUSINESS_TYPE_NAMES, firstName, initials } from '@/lib/format';
import { useSession } from '@/lib/session';
import { type ScreenId } from './Sidebar';

interface HeaderProps {
  onSelectScreen?: (screen: ScreenId) => void;
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
  onOpenNotifications: () => void;
  onOpenImportModal: () => void;
  alertCount: number;
}

export function Header({
  onSelectScreen,
  isBalanceHidden,
  onToggleBalance,
  onOpenNotifications,
  onOpenImportModal,
  alertCount,
}: HeaderProps) {
  const { state, business, selectBusiness, logout } = useSession();
  const userName = state.status === 'authenticated' ? state.user.name : '';
  const owned =
    state.status === 'authenticated' ? state.businesses.filter((b) => b.role === 'OWNER') : [];

  return (
    <header className="sticky top-0 z-40 bg-[#F8FAF5]/95 backdrop-blur-md border-b border-[#E6EFE2] px-6 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Marca oficial GiG */}
        <button
          type="button"
          onClick={() => onSelectScreen?.('home')}
          className="flex items-center gap-3 cursor-pointer group select-none transition-transform active:scale-95"
          title="Ir para o início"
        >
          <Logo className="h-9 sm:h-10 lg:h-11 w-auto transition-transform duration-200 group-hover:scale-105" />
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenImportModal}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F3FCE2] text-[#111827] border border-[#E6EFE2] text-xs font-bold transition-all shadow-2xs active:scale-95"
          >
            <FolderUp size={15} />
            <span>Importar extrato</span>
          </button>

          <button
            onClick={onToggleBalance}
            title={isBalanceHidden ? 'Mostrar valores' : 'Ocultar valores'}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#F3FCE2] border border-[#E6EFE2] flex items-center justify-center text-[#4B5563] hover:text-[#111827] transition-all shadow-2xs"
          >
            {isBalanceHidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          <button
            onClick={onOpenNotifications}
            title="Notificações"
            className="w-9 h-9 rounded-full bg-white hover:bg-[#F3FCE2] border border-[#E6EFE2] flex items-center justify-center text-[#4B5563] hover:text-[#111827] relative transition-all shadow-2xs"
          >
            <Bell size={16} />
            {alertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {/* Seletor de negócio */}
          {business && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border border-[#E2EAD9] shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
              {owned.length > 1 ? (
                <select
                  value={business.id}
                  onChange={(e) => selectBusiness(Number(e.target.value))}
                  className="text-xs font-bold text-[#1F2937] bg-transparent focus:outline-none"
                >
                  {owned.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-bold text-[#1F2937]">{business.name}</span>
              )}
              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md bg-[#111827] text-[#D7FD3C] tracking-wide">
                {BUSINESS_TYPE_NAMES[business.type]}
              </span>
            </div>
          )}

          {/* Perfil e saída */}
          <div className="flex items-center gap-2.5 p-1 pr-2.5 rounded-2xl select-none">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#111827] via-[#1F2937] to-[#374151] text-white flex items-center justify-center font-black text-xs ring-2 ring-[#D7FD3C] shadow-xs">
              {initials(userName)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-extrabold leading-tight text-[#111827]">
                {firstName(userName)}
              </p>
              <button
                onClick={() => void logout()}
                className="text-[10px] text-[#64748B] font-bold hover:underline"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
