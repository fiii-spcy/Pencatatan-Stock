import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Smartphone,
  Users
} from 'lucide-react';
import { getTodayDateString } from '../data/initialData';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileHeaderProps {
  onOpenUserSwitch: () => void;
  isFramed: boolean;
  setIsFramed: (val: boolean) => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenUserSwitch,
  isFramed,
  setIsFramed
}) => {
  const {
    currentUser,
    isAdmin,
    selectedDate,
    setSelectedDate,
    dailyTotals
} = useApp();

  const { isInstallable, install, isIOS, isInstalled } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const todayStr = getTodayDateString();

  // Helper for date shift
  const handleShiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + days);
    const nextY = dateObj.getFullYear();
    const nextM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nextD = String(dateObj.getDate()).padStart(2, '0');
    const nextDateStr = `${nextY}-${nextM}-${nextD}`;
    // Prevent navigating past today
    if (nextDateStr <= todayStr) {
      setSelectedDate(nextDateStr);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'Hari Ini';
    try {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const isToday = selectedDate === todayStr;

  return (
    <header className="bg-[#7E9F85] text-white sticky top-0 z-30 shadow-md pt-[env(safe-area-inset-top)]">
      {/* Top Bar: Brand + User */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        {/* Left: Store identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-white truncate leading-tight">
              Toko SS Telur & Sembako
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-white/80 font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse shrink-0" />
              <span>Aplikasi Kasir & Stok</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* PWA Install Button */}
          {!isInstalled && isInstallable && (
            <button
              type="button"
              onClick={install}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 active:scale-95 text-white text-[11px] font-bold rounded-lg"
              title="Pasang aplikasi di layar utama HP"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}

          {!isInstalled && isIOS && (
            <button
              type="button"
              onClick={() => setShowIOSModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold rounded-lg"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}

          {/* Frame toggle (desktop only) */}
          <button
            type="button"
            onClick={() => setIsFramed(!isFramed)}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold rounded-lg transition-colors"
            title={isFramed ? 'Mode Layar Penuh' : 'Mode Bingkai HP'}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isFramed ? 'Full' : 'Frame HP'}</span>
          </button>

          {/* User Avatar Button */}
          <button
            type="button"
            onClick={onOpenUserSwitch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 border border-white/20 text-white font-semibold transition-all"
            title="Klik untuk ganti kasir / petugas"
          >
            <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <span className="text-[11px] truncate max-w-[72px]">
              {currentUser.name}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/20 text-white/90 uppercase font-bold">
              {currentUser.role}
            </span>
          </button>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="bg-black/10 border-t border-white/15 px-3 py-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => handleShiftDate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white transition-all"
          title="Hari Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center justify-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-white/80 shrink-0" />
          <span className="font-bold text-white text-sm">
            {formatDateLabel(selectedDate)}
          </span>
          {isToday ? (
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold shrink-0">
              Hari ini
            </span>
          ) : (
            <>
              <span className="text-white/50 text-[11px]">
                ({selectedDate})
              </span>
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="text-[10px] bg-white text-[#46664D] font-bold px-2 py-0.5 rounded-full shrink-0"
              >
                Ke Hari Ini
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleShiftDate(1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white transition-all"
          title="Hari Berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* iOS Safari PWA Install Modal Guide */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white text-neutral-900 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-sm text-black flex items-center gap-2">
              <Download className="w-4 h-4 text-[#7E9F85]" />
              <span>Pasang di iPhone / iPad</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Untuk memasang aplikasi ini di layar utama iPhone Anda:
            </p>
            <ol className="text-xs text-neutral-600 mt-3 space-y-2 list-decimal list-inside bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <li>Ketuk ikon <strong>Bagikan / Share</strong> di bilah bawah Safari.</li>
              <li>Gulir ke bawah lalu pilih <strong>"Tambah ke Layar Utama"</strong>.</li>
              <li>Ketuk <strong>Tambah</strong> di pojok kanan atas.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="mt-4 w-full py-2.5 bg-[#7E9F85] hover:bg-[#6F8F75] text-white font-bold text-sm rounded-xl"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
