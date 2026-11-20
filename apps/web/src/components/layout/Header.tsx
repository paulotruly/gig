'use client';

import React from 'react';
import {
  Bell,
  Eye,
  EyeOff,
  FolderUp,
  ChevronDown,
} from '@/components/ui/icons';
import { type ScreenId } from './Sidebar';

interface HeaderProps {
  currentScreen?: ScreenId;
  onSelectScreen?: (screen: ScreenId) => void;
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
  onOpenNotifications: () => void;
  onOpenImportModal: () => void;
}

export function Header({
  onSelectScreen,
  isBalanceHidden,
  onToggleBalance,
  onOpenNotifications,
  onOpenImportModal,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#F8FAF5]/95 backdrop-blur-md border-b border-[#E6EFE2] px-6 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Marca Oficial GiG */}
        <div
          onClick={() => onSelectScreen?.('home')}
          className="flex items-center gap-3 cursor-pointer group select-none transition-transform active:scale-95"
          title="Ir para o início"
        >
          <img
            src="/logo-transparent.png"
            alt="Greed is Great"
            className="h-10 sm:h-11 md:h-12 lg:h-[46px] w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-2xs"
          />
          <span className="hidden xl:inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-[#D7FD3C] text-[#111827] font-black border border-[#c2ee1f] shadow-2xs">
            GiG
          </span>
        </div>

        {/* Ações e Perfil do Usuário */}
        <div className="flex items-center gap-2.5">
          {/* Botão Importar Extrato (Desktop) */}
          <button
            onClick={onOpenImportModal}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F3FCE2] text-[#111827] border border-[#E6EFE2] text-xs font-bold transition-all shadow-2xs active:scale-95"
          >
            <FolderUp size={15} />
            <span>Importar Extrato</span>
          </button>

          {/* Ocultar/Exibir Saldo */}
          <button
            onClick={onToggleBalance}
            title={isBalanceHidden ? 'Mostrar valores' : 'Ocultar valores'}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#F3FCE2] border border-[#E6EFE2] flex items-center justify-center text-[#4B5563] hover:text-[#111827] transition-all shadow-2xs"
          >
            {isBalanceHidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          {/* Notificações */}
          <button
            onClick={onOpenNotifications}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#F3FCE2] border border-[#E6EFE2] flex items-center justify-center text-[#4B5563] hover:text-[#111827] relative transition-all shadow-2xs"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white animate-pulse"></span>
          </button>

          {/* Seletor de Empresa (Workspace MEI) */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white hover:bg-[#F3FCE2]/60 border border-[#E2EAD9] hover:border-[#D7FD3C] shadow-2xs transition-all cursor-pointer group/biz">
            <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
              <div className="absolute w-3.5 h-3.5 rounded-full bg-[#10B981]/30 animate-ping pointer-events-none"></div>
            </div>
            <span className="text-xs font-bold text-[#1F2937] group-hover/biz:text-black transition-colors">
              Studio Criativo MEI
            </span>
            <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md bg-[#111827] text-[#D7FD3C] tracking-wide">
              MEI
            </span>
            <ChevronDown size={13} className="text-slate-400 group-hover/biz:text-slate-700 transition-colors ml-0.5" />
          </div>

          {/* Avatar & Perfil do Usuário */}
          <div className="flex items-center gap-2.5 p-1 pr-2.5 rounded-2xl hover:bg-white border border-transparent hover:border-[#E6EFE2] hover:shadow-2xs transition-all cursor-pointer group/user select-none">
            {/* Foto / Monograma com anel iluminado */}
            <div className="relative">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#111827] via-[#1F2937] to-[#374151] text-white flex items-center justify-center font-black text-xs ring-2 ring-[#D7FD3C] shadow-xs group-hover/user:scale-105 group-hover/user:ring-offset-2 group-hover/user:ring-offset-[#F8FAF5] transition-all duration-200">
                ES
              </div>
              {/* Ponto indicador de status verificado */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] rounded-full ring-2 ring-[#F8FAF5] flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Nome e Status */}
            <div className="hidden md:block text-left">
              <div className="flex items-center gap-1">
                <p className="text-xs font-extrabold leading-tight text-[#111827] group-hover/user:text-black transition-colors">
                  Ester Silva
                </p>
                <ChevronDown size={13} className="text-slate-400 group-hover/user:text-slate-700 transition-colors" />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                <p className="text-[10px] text-[#059669] font-bold tracking-tight">Open Finance Ativo</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
