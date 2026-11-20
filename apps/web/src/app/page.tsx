'use client';

import React, { useEffect, useState } from 'react';
import { NotificationsModal } from '@/components/alerts/NotificationsModal';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { CommitmentsScreen } from '@/components/commitments/CommitmentsScreen';
import { MobileDashboardScreen } from '@/components/dashboard/MobileDashboardScreen';
import { WebDashboardScreen } from '@/components/dashboard/WebDashboardScreen';
import { ForecastScreen } from '@/components/forecast/ForecastScreen';
import { BottomNav, type MobileTab } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { Sidebar, type ScreenId } from '@/components/layout/Sidebar';
import { BusinessSetup } from '@/components/onboarding/BusinessSetup';
import { ImportStatementModal } from '@/components/statements/ImportStatementModal';
import { TracksScreen } from '@/components/tracks/TracksScreen';
import { TransactionsScreen } from '@/components/transactions/TransactionsScreen';
import { LoadingCard } from '@/components/ui/states';
import { WhatsAppScreen } from '@/components/whatsapp/WhatsAppScreen';
import { BusinessDataProvider, SessionProvider, useBusinessData, useSession } from '@/lib/session';

// Preferência visual: guardar no navegador não expõe nenhum dado.
const HIDDEN_KEY = 'gig:saldo-oculto';
const SCREEN_HASH: Record<ScreenId, string> = {
  home: 'inicio',
  forecast: 'cenarios',
  transactions: 'transacoes',
  commitments: 'compromissos',
  tracks: 'trilhas',
  whatsapp: 'whatsapp',
};

export default function Home() {
  return (
    <SessionProvider>
      <Gate />
    </SessionProvider>
  );
}

function Gate() {
  const { state, business } = useSession();
  if (state.status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <LoadingCard label="Abrindo o GiG..." />
      </main>
    );
  }
  if (state.status === 'anonymous') return <AuthScreen />;
  if (!business) return <BusinessSetup />;
  return (
    <BusinessDataProvider key={business.id} business={business}>
      <AppShell />
    </BusinessDataProvider>
  );
}

function AppShell() {
  const { alerts } = useBusinessData();
  const [currentTab, setCurrentTab] = useState<ScreenId>('home');
  const [focusSearch, setFocusSearch] = useState(0);
  useEffect(() => {
    const syncHash = () => {
      const screen = (Object.keys(SCREEN_HASH) as ScreenId[]).find(
        (id) => `#${SCREEN_HASH[id]}` === window.location.hash,
      );
      setCurrentTab(screen ?? 'home');
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const alertCount = alerts.data?.alerts.length ?? 0;

  useEffect(() => {
    try {
      setIsBalanceHidden(window.localStorage.getItem(HIDDEN_KEY) === '1');
    } catch {
      // Sem armazenamento local, começa com os valores visíveis.
    }
  }, []);

  function toggleBalance() {
    setIsBalanceHidden((hidden) => {
      try {
        window.localStorage.setItem(HIDDEN_KEY, hidden ? '0' : '1');
      } catch {
        // Só não lembra a preferência.
      }
      return !hidden;
    });
  }

  const openImport = () => setIsImportModalOpen(true);
  const openNotifications = () => setIsNotificationModalOpen(true);
  const navigate = (tab: string) => {
    window.location.hash = SCREEN_HASH[tab as ScreenId] ?? SCREEN_HASH.home;
  };

  return (
    <div className="min-h-screen bg-[#F8FAF5] flex flex-col text-[#111827] selection:bg-[#D7FD3C] selection:text-black antialiased">
      <div className="flex-1 flex flex-col">
        <div className="hidden lg:block">
          <Header
            onSelectScreen={navigate}
            isBalanceHidden={isBalanceHidden}
            onToggleBalance={toggleBalance}
            onOpenNotifications={openNotifications}
            onOpenImportModal={openImport}
            alertCount={alertCount}
          />
        </div>

        <div className="lg:hidden">
          <MobileHeader
            isBalanceHidden={isBalanceHidden}
            onToggleBalance={toggleBalance}
            onOpenNotifications={openNotifications}
            onOpenSearch={() => {
              setFocusSearch((value) => value + 1);
              navigate('transactions');
            }}
            onOpenCopilot={() => navigate('whatsapp')}
            alertCount={alertCount}
          />
        </div>

        <div className="w-full max-w-7xl mx-auto flex-1 flex gap-6 px-4 sm:px-6 lg:px-8 py-4 lg:py-6 items-start">
          <Sidebar
            currentScreen={currentTab}
            onSelectScreen={navigate}
            isBalanceHidden={isBalanceHidden}
          />

          <main className="flex-1 min-w-0 w-full">
            {currentTab === 'home' && (
              <>
                <div className="hidden lg:block">
                  <WebDashboardScreen
                    isBalanceHidden={isBalanceHidden}
                    onNavigate={navigate}
                    onOpenImportModal={openImport}
                  />
                </div>
                <div className="lg:hidden">
                  <MobileDashboardScreen
                    isBalanceHidden={isBalanceHidden}
                    onNavigate={navigate}
                    onOpenImportModal={openImport}
                  />
                </div>
              </>
            )}

            {currentTab === 'forecast' && <ForecastScreen isBalanceHidden={isBalanceHidden} />}
            {currentTab === 'transactions' && (
              <TransactionsScreen
                focusSearch={focusSearch}
                isBalanceHidden={isBalanceHidden}
                onOpenImportModal={openImport}
              />
            )}
            {currentTab === 'commitments' && (
              <CommitmentsScreen isBalanceHidden={isBalanceHidden} />
            )}
            {currentTab === 'tracks' && <TracksScreen />}
            {currentTab === 'whatsapp' && <WhatsAppScreen />}
          </main>
        </div>

        <div className="lg:hidden">
          <BottomNav
            currentTab={currentTab === 'whatsapp' ? null : (currentTab as MobileTab)}
            onSelectTab={navigate}
            dasAlertCount={alertCount}
          />
        </div>
      </div>

      {isImportModalOpen && <ImportStatementModal onClose={() => setIsImportModalOpen(false)} />}
      {isNotificationModalOpen && (
        <NotificationsModal
          onClose={() => setIsNotificationModalOpen(false)}
          onOpenTracks={() => {
            setIsNotificationModalOpen(false);
            navigate('tracks');
          }}
        />
      )}
    </div>
  );
}
