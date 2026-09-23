import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { getTodayDateString } from '../data/initialData';

interface AppNavbarProps {
  onOpenUserSwitch: () => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  onOpenUserSwitch,
}) => {
  const {
    currentUser,
    isAdmin,
    selectedDate,
    setSelectedDate,
    logout,
  } = useApp();

  const todayStr = getTodayDateString();
  const isToday = selectedDate >= todayStr;

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d - 1);
    const nextY = dateObj.getFullYear();
    const nextM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nextD = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${nextY}-${nextM}-${nextD}`);
  };

  const handleNextDay = () => {
    if (isToday) return;
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + 1);
    const nextY = dateObj.getFullYear();
    const nextM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nextD = String(dateObj.getDate()).padStart(2, '0');
    const nextDate = `${nextY}-${nextM}-${nextD}`;
    if (nextDate <= todayStr) {
      setSelectedDate(nextDate);
    }
  };

  const handleToday = () => {
    setSelectedDate(todayStr);
  };

  const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="bg-[#7E9F85] text-white sticky top-0 z-30 shadow-[0_2px_12px_rgba(0,0,0,0.06)] select-none pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight truncate">
                Toko SS Telur & Sembako
              </h1>
              <p className="text-[11px] text-white/80 truncate">
                {isAdmin ? 'Admin' : 'Pegawai'} · {currentUser.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenUserSwitch}
              className="w-10 h-10 rounded-full bg-white text-[#46664D] flex items-center justify-center text-sm font-bold active:scale-95"
              title="Ganti pengguna / kasir"
            >
              {currentUser.name.charAt(0)}
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Keluar dari akun dan kembali ke halaman login?')) {
                  logout();
                }
              }}
              className="w-10 h-10 rounded-xl bg-white/15 active:bg-white/25 border border-white/20 text-white flex items-center justify-center"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pb-2.5 pt-0.5 border-t border-white/15 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevDay}
            className="w-9 h-9 rounded-full bg-white/15 active:bg-white/25 text-white flex items-center justify-center shrink-0"
            title="Hari sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0 flex items-center justify-center gap-2 bg-white/15 px-3 h-9 rounded-full border border-white/15">
            <Calendar className="w-3.5 h-3.5 text-white/80 shrink-0" />
            <span className="font-semibold text-white text-xs truncate">
              {dateLabel}
            </span>
            {isToday ? (
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium shrink-0">
                Hari ini
              </span>
            ) : (
              <button
                type="button"
                onClick={handleToday}
                className="text-[11px] bg-white text-[#46664D] font-bold px-2 py-0.5 rounded-full shrink-0"
              >
                Hari ini
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            disabled={isToday}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              isToday
                ? 'bg-white/5 text-white/30'
                : 'bg-white/15 active:bg-white/25 text-white'
            }`}
            title="Hari berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
