import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import {
  Users,
  Package,
  Download,
  RotateCcw,
  Smartphone,
  ChevronRight,
  Check,
  Info,
  Cloud,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileMenuViewProps {
  onOpenProductMgmt: () => void;
  onOpenUserMgmt: () => void;
  onOpenUserSwitch: () => void;
}

export const MobileMenuView: React.FC<MobileMenuViewProps> = ({
  onOpenProductMgmt,
  onOpenUserMgmt,
  onOpenUserSwitch,
}) => {
  const {
    currentUser,
    isAdmin,
    products,
    categories,
    resetToSampleData,
    exportDataJSON,
    wipeDatabase,
    isCloudConnected,
    logout,
  } = useApp();

  const { isInstallable, install, isInstalled } = usePWAInstall();
  const { showToast } = useToast();
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleDownloadBackup = () => {
    exportDataJSON();
    showToast('Cadangan data berhasil diunduh!', 'success');
  };

  const handleWipeDatabase = async () => {
    if (
      window.confirm(
        'PERINGATAN! Apakah Anda yakin ingin menghapus SELURUH data produk, stok, kategori, dan transaksi? Ini tidak dapat dibatalkan!'
      )
    ) {
      if (window.confirm('Tekan OK sekali lagi untuk mengkonfirmasi penghapusan semua data.')) {
        await wipeDatabase();
        setResetSuccess(true);
        showToast('Semua data berhasil dikosongkan. Aplikasi siap digunakan dari awal.', 'success', 5000);
        setTimeout(() => setResetSuccess(false), 5000);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24 sm:pb-10">
      {/* 1. Header Profil Petugas Aktif */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#7E9F85] text-white flex items-center justify-center text-lg font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-black">{currentUser.name}</h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-[#F2F6F3] text-[#44634B]">
                {currentUser.role === 'admin' ? 'Admin / Pemilik' : 'Kasir / Staf'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {isAdmin
                ? 'Akses penuh: Kelola harga, edit stok, dan laporan keuangan'
                : 'Akses operasional: Catat stok masuk & pengeluaran kasir'}
            </p>
          </div>
        </div>

        {/* Switch User & Logout Buttons */}
        <div className="mt-5 pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onOpenUserSwitch}
            className="w-full py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-neutral-600" />
            <span>Ganti shift kasir</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Keluar dari akun dan kembali ke halaman login?')) {
                logout();
              }
            }}
            className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Keluar / Logout</span>
          </button>
        </div>
      </div>

      {/* 2. Status Cloud Database Online */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#EDF3EE] text-[#527459] flex items-center justify-center shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-black">
                Database Online & Sinkronisasi
              </h4>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                isCloudConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {isCloudConnected ? 'Aktif Terhubung' : 'Mode Offline'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Data tersinkronisasi otomatis secara online ke cloud Firestore. Anda bisa mengakses dan mencatat stok dari beberapa HP atau komputer sekaligus secara real-time.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-neutral-600 bg-neutral-50 px-3.5 py-2 rounded-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Real-time listener aktif: Perubahan data langsung terupdate tanpa perlu refresh</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PWA App Installation */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#EDF3EE] text-[#527459] flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-black">
              Pasang di layar utama HP
            </h4>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Buka aplikasi langsung dari ikon di layar HP tanpa perlu membuka browser berulang kali.
            </p>

            <div className="mt-4">
              {isInstalled ? (
                <div className="flex items-center gap-2 bg-[#F2F6F3] text-[#44634B] px-4 py-2.5 rounded-full text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Aplikasi sudah terpasang di perangkat</span>
                </div>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={install}
                  className="w-full py-3.5 bg-[#7E9F85] hover:bg-[#6F8F75] text-white font-bold text-xs rounded-full shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Pasang aplikasi ke layar HP</span>
                </button>
              ) : (
                <div className="bg-neutral-50 p-3 rounded-2xl text-xs text-neutral-500 flex items-start gap-2">
                  <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <span>Buka menu browser HP Anda (titik tiga atau Share) lalu pilih <strong>Tambahkan ke Layar Utama</strong>.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Pengaturan Master Data (Admin Only) */}
      {isAdmin && (
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <span className="text-sm font-bold text-black">
            Pengaturan master data
          </span>
          <span className="text-xs text-neutral-400">
            {products.length} produk • {categories.length} kategori
          </span>
        </div>

        <div className="divide-y divide-neutral-100 text-xs">
          {/* Kelola Produk */}
          <button
            type="button"
            onClick={onOpenProductMgmt}
            className="w-full p-5 hover:bg-neutral-50 flex items-center justify-between text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#EDF3EE] text-[#527459] flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-black text-xs">Katalog barang & harga</h5>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  Ubah harga modal (HPP), harga jual, dan batas stok aman
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-300" />
          </button>

          {/* Kelola Pegawai */}
          <button
            type="button"
            onClick={onOpenUserMgmt}
            className="w-full p-5 hover:bg-neutral-50 flex items-center justify-between text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#EDF3EE] text-[#527459] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-black text-xs">Kelola akun kasir & pegawai</h5>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  Tambah staf baru, atur hak akses, dan PIN keamanan
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-300" />
          </button>
        </div>
      </div>
      )}

      {/* 4. Cadangkan & Atur Ulang Data */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <h4 className="text-sm font-bold text-black">
          Penyimpanan & cadangan data
        </h4>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Semua transaksi dan data stok tersimpan otomatis di perangkat browser ini. Anda dapat mengunduh cadangan sewaktu-waktu.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex-1 py-3.5 px-5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh cadangan data (JSON)</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={handleWipeDatabase}
              className="py-3.5 px-5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Hapus Semua Data (Kosongkan)</span>
            </button>
          )}
        </div>

        {resetSuccess && (
          <div className="p-3 bg-[#F2F6F3] text-[#44634B] text-xs font-semibold rounded-2xl text-center">
            ✅ Semua data berhasil dikosongkan. Aplikasi siap digunakan dari awal.
          </div>
        )}
      </div>
    </div>
  );
};
