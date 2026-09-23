import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/LoginPage';
import { AppNavbar } from './components/AppNavbar';
import { MobileBottomNav, MobileTabType } from './components/MobileBottomNav';
import { MobileHeader } from './components/MobileHeader';
import { DashboardView } from './components/DashboardView';
import { PageMasuk } from './components/PageMasuk';
import { PageKeluar } from './components/PageKeluar';
import { ReportsView } from './components/ReportsView';
import { MobileMenuView } from './components/MobileMenuView';
import { UserSwitchModal } from './components/UserSwitchModal';
import { ProductManagementModal } from './components/ProductManagementModal';
import { UserManagementModal } from './components/UserManagementModal';
import { OnboardingGuide } from './components/OnboardingGuide';
import { ToastProvider } from './components/Toast';

const MainAppContent: React.FC = () => {
  // ALL hooks must be at the top — no hooks after conditional returns
  const { isAuthenticated, isAuthLoading, isAdmin } = useApp();

  const [activeTab, setActiveTab] = useState<MobileTabType>('dashboard');
  const [isUserSwitchOpen, setIsUserSwitchOpen] = useState(false);
  const [isProductMgmtOpen, setIsProductMgmtOpen] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [isFramed, setIsFramed] = useState(false);
  
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('toko_sembako_onboarded') !== 'true';
  });

  const handleFinishOnboarding = () => {
    localStorage.setItem('toko_sembako_onboarded', 'true');
    setShowOnboarding(false);
  };

  // 1. Firebase Auth still initializing — show loading screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F2F6F3] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-3xl bg-gradient-to-tr from-[#719278] to-[#8CAE93] flex items-center justify-center shadow-lg animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6l9 14 9-14-3-4z" /><path d="M3 6h18" /><path d="m12 2 3 4H9l3-4z" />
          </svg>
        </div>
        <p className="text-sm text-neutral-500 font-medium">Memuat aplikasi...</p>
      </div>
    );
  }

  // 2. Not authenticated — show login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 3. Authenticated — show main app
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 'masuk':
        return <PageMasuk />;
      case 'keluar':
        return <PageKeluar />;
      case 'laporan':
        if (!isAdmin) {
          return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h3 className="text-lg font-bold text-black mb-1">Akses Terkunci</h3>
              <p className="text-sm text-neutral-500 max-w-xs">Halaman Laporan hanya bisa diakses oleh Admin / Pemilik Toko.</p>
            </div>
          );
        }
        return <ReportsView />;
      case 'menu':
        return (
          <MobileMenuView
            onOpenProductMgmt={() => setIsProductMgmtOpen(true)}
            onOpenUserMgmt={() => setIsUserMgmtOpen(true)}
            onOpenUserSwitch={() => setIsUserSwitchOpen(true)}
          />
        );
      default:
        return <DashboardView onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-dvh bg-[#F9FAF9] flex flex-col font-sans antialiased text-neutral-900">
      {/* Desktop navbar — hidden on mobile */}
      <div className="hidden md:block">
        <AppNavbar onOpenUserSwitch={() => setIsUserSwitchOpen(true)} />
      </div>

      {/* Mobile header — hidden on desktop */}
      <div className="md:hidden">
        <MobileHeader
          onOpenUserSwitch={() => setIsUserSwitchOpen(true)}
          isFramed={isFramed}
          setIsFramed={setIsFramed}
        />
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-8 pb-[calc(5.25rem+env(safe-area-inset-bottom))] min-w-0">
        {renderTabContent()}
      </main>

      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {isUserSwitchOpen && (
        <UserSwitchModal
          isOpen={isUserSwitchOpen}
          onClose={() => setIsUserSwitchOpen(false)}
        />
      )}

      {isProductMgmtOpen && (
        <ProductManagementModal
          isOpen={isProductMgmtOpen}
          onClose={() => setIsProductMgmtOpen(false)}
        />
      )}

      {isUserMgmtOpen && (
        <UserManagementModal
          isOpen={isUserMgmtOpen}
          onClose={() => setIsUserMgmtOpen(false)}
        />
      )}

      {showOnboarding && <OnboardingGuide onComplete={handleFinishOnboarding} />}
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ToastProvider>
  );
}
