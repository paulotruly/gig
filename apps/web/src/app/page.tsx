'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar, type ScreenId } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { BottomNav, type MobileTab } from '@/components/layout/BottomNav';
import { MobileDashboardScreen } from '@/components/dashboard/MobileDashboardScreen';
import { WebDashboardScreen } from '@/components/dashboard/WebDashboardScreen';
import { ForecastScreen } from '@/components/forecast/ForecastScreen';
import { TransactionsScreen } from '@/components/transactions/TransactionsScreen';
import { CommitmentsScreen } from '@/components/commitments/CommitmentsScreen';
import { TracksScreen } from '@/components/tracks/TracksScreen';
import { WhatsAppScreen } from '@/components/whatsapp/WhatsAppScreen';
import { FolderUp, Bell, X, ChevronRight } from '@/components/ui/icons';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<ScreenId>('home');
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#F8FAF5] flex flex-col text-[#111827] selection:bg-[#D7FD3C] selection:text-black antialiased">
      
      {/* ─────────────────────────────────────────────────────────────
          LAYOUT RESPONSIVO NATIVO (DESKTOP NO PC, APP NO CELULAR)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Header Desktop (Visível apenas em telas >= lg) */}
        <div className="hidden lg:block">
          <Header
            currentScreen={currentTab}
            onSelectScreen={setCurrentTab}
            isBalanceHidden={isBalanceHidden}
            onToggleBalance={() => setIsBalanceHidden(!isBalanceHidden)}
            onOpenNotifications={() => setIsNotificationModalOpen(true)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        </div>

        {/* Header Mobile (Visível apenas em telas < lg) */}
        <div className="lg:hidden">
          <MobileHeader
            businessName="Studio Criativo MEI"
            userName="Ester Silva"
            isBalanceHidden={isBalanceHidden}
            onToggleBalance={() => setIsBalanceHidden(!isBalanceHidden)}
            onOpenNotifications={() => setIsNotificationModalOpen(true)}
            onOpenSearch={() => setCurrentTab('transactions')}
            onOpenCopilot={() => setCurrentTab('whatsapp')}
          />
        </div>

        {/* Corpo com Sidebar (Desktop) e Conteúdo Principal */}
        <div className="w-full max-w-7xl mx-auto flex-1 flex gap-6 px-4 sm:px-6 lg:px-8 py-4 lg:py-6 items-start">
          {/* Sidebar Web Lateral (Desktop) */}
          <Sidebar
            currentScreen={currentTab}
            onSelectScreen={setCurrentTab}
          />

          {/* Conteúdo Central */}
          <main className="flex-1 min-w-0 w-full">
            {currentTab === 'home' && (
              <>
                {/* No Desktop: Renderiza o layout Web amplo do Mockup */}
                <div className="hidden lg:block">
                  <WebDashboardScreen
                    isBalanceHidden={isBalanceHidden}
                    onNavigate={(tab) => setCurrentTab(tab as ScreenId)}
                    onOpenImportModal={() => setIsImportModalOpen(true)}
                  />
                </div>

                {/* No Mobile: Renderiza o layout Mobile de banco */}
                <div className="lg:hidden">
                  <MobileDashboardScreen
                    isBalanceHidden={isBalanceHidden}
                    onNavigate={(tab) => setCurrentTab(tab as ScreenId)}
                    onOpenImportModal={() => setIsImportModalOpen(true)}
                  />
                </div>
              </>
            )}

            {currentTab === 'forecast' && <ForecastScreen />}
            {currentTab === 'transactions' && <TransactionsScreen />}
            {currentTab === 'commitments' && <CommitmentsScreen />}
            {currentTab === 'tracks' && <TracksScreen />}
            {currentTab === 'whatsapp' && <WhatsAppScreen />}
          </main>
        </div>

        {/* Bottom Navigation Bar Fixa no Rodapé (Apenas no Mobile) */}
        <div className="lg:hidden">
          <BottomNav
            currentTab={currentTab === 'whatsapp' ? 'home' : (currentTab as MobileTab)}
            onSelectTab={(tab) => setCurrentTab(tab as ScreenId)}
            dasAlertCount={1}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL DE IMPORTAÇÃO DE EXTRATO (DISPONÍVEL EM AMBOS OS MODOS)
      ───────────────────────────────────────────────────────────── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6EFE2] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-[#111827]">Importar Extrato Bancário PJ</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Classificação instantânea de receitas, despesas e pró-labore.
                </p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="border-2 border-dashed border-[#D7FD3C] bg-[#F8FAF5] rounded-2xl p-8 text-center cursor-pointer hover:bg-[#F3FCE2] transition-colors flex flex-col items-center">
              <span className="w-14 h-14 rounded-2xl bg-[#F3FCE2] text-[#294A07] flex items-center justify-center mb-2.5 shadow-2xs">
                <FolderUp size={28} />
              </span>
              <p className="text-sm font-black text-[#111827]">Clique ou arraste o arquivo aqui</p>
              <p className="text-xs text-slate-500 mt-1">
                Formatos aceitos: <strong>.OFX</strong> ou <strong>.CSV</strong>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Compatível com Nubank PJ, Inter, Itaú, Bradesco e C6</p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  alert('Extrato processado com sucesso! 18 lançamentos novos foram categorizados.');
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-black bg-[#D7FD3C] hover:bg-[#cbf425] text-black shadow-xs transition-all active:scale-95"
              >
                Processar Extrato
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL DE NOTIFICAÇÕES (DISPONÍVEL EM AMBOS OS MODOS)
      ───────────────────────────────────────────────────────────── */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6EFE2] space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5E9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F3FCE2] flex items-center justify-center text-[#294A07]">
                  <Bell size={18} />
                </div>
                <h3 className="font-black text-base text-[#111827]">Notificações & Alertas</h3>
              </div>
              <button
                onClick={() => setIsNotificationModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#EF4444] uppercase tracking-wider">Tributo MEI</span>
                <span className="text-[10px] font-bold text-[#991B1B] bg-white px-2 py-0.5 rounded-full">
                  Em 5 dias
                </span>
              </div>
              <p className="text-xs font-black text-[#111827]">Vencimento do DAS MEI de Outubro</p>
              <p className="text-xs text-slate-600">
                Valor de <strong>R$ 75,90</strong> provisionado e pronto para pagamento via Pix.
              </p>
              <button
                onClick={() => {
                  setIsNotificationModalOpen(false);
                  setCurrentTab('commitments');
                }}
                className="text-xs font-black text-[#EF4444] hover:underline flex items-center gap-1"
              >
                Pagar agora com Pix <ChevronRight size={13} />
              </button>
            </div>

            <button
              onClick={() => setIsNotificationModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
