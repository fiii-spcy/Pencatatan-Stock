import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  PackagePlus,
  PackageMinus,
  FileSpreadsheet,
  Menu,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export type MobileTabType = 'dashboard' | 'masuk' | 'keluar' | 'laporan' | 'menu';

interface MobileBottomNavProps {
  activeTab: MobileTabType;
  setActiveTab: (tab: MobileTabType) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab
}) => {
  const { dailyTotals, isAdmin } = useApp();
  const criticalCount = dailyTotals?.outOfStockCount || 0;

  const allNavItems: {
    id: MobileTabType;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Beranda', icon: LayoutDashboard },
    { id: 'masuk', label: 'Stok masuk', shortLabel: 'Masuk', icon: PackagePlus },
    { id: 'keluar', label: 'Stok keluar', shortLabel: 'Keluar', icon: PackageMinus },
    { id: 'laporan', label: 'Laporan', shortLabel: 'Laporan', icon: FileSpreadsheet, adminOnly: true },
    { id: 'menu', label: 'Menu', shortLabel: 'Menu', icon: Menu },
  ];

  // Filter nav items based on role
  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 select-none pointer-events-none pb-[env(safe-area-inset-bottom)]"
      id="bottom-navigation-container"
    >
      {/* Desktop floating pill nav */}
      <div className="hidden md:flex items-center justify-center pb-5">
        <nav
          className="pointer-events-auto relative flex items-center gap-1.5 bg-white/90 backdrop-blur-xl p-1.5 rounded-full border border-white/60 shadow-[0_12px_36px_rgba(0,0,0,0.09)] ring-1 ring-black/5"
          aria-label="Navigasi aplikasi utama"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-black/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktopActiveGlassPill"
                    transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                    className="absolute inset-0 rounded-full z-[-1] bg-[#7E9F85]"
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{item.label}</span>
                {item.id === 'dashboard' && criticalCount > 0 && (
                  <span
                    className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {criticalCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile bottom bar */}
      <nav className="md:hidden pointer-events-auto bg-white border-t border-neutral-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch justify-around px-1 pt-1 pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center flex-1 min-h-[60px] touch-tap py-1 ${
                  isActive ? 'text-[#46664D]' : 'text-neutral-400'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveGlassIndicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="absolute inset-x-1 inset-y-0.5 rounded-2xl bg-[#7E9F85]/10 z-0"
                  />
                )}
                <div className="relative z-10">
                  <Icon
                    className={`w-[22px] h-[22px] ${
                      isActive ? 'stroke-[2.2]' : 'stroke-[1.7]'
                    }`}
                  />
                  {item.id === 'dashboard' && criticalCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                  )}
                </div>
                <span
                  className={`text-[11px] mt-0.5 tracking-tight relative z-10 ${
                    isActive ? 'font-bold text-[#46664D]' : 'font-medium'
                  }`}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
