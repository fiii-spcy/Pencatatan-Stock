import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check, LogOut } from 'lucide-react';

interface UserSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSwitchModal: React.FC<UserSwitchModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-100 max-h-[92vh] flex flex-col">
        {/* Header Modal */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-black">
            Ganti shift petugas
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-2">
             <LogOut className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-bold text-black">Keamanan Ditingkatkan</h4>
          <p className="text-neutral-500 leading-relaxed">
            Untuk menjaga keamanan data transaksi dan stok, fitur ganti shift kini membutuhkan proses <strong>Logout</strong> dan login ulang menggunakan email dan password petugas bersangkutan.
          </p>

          {/* Tombol aksi */}
          <div className="pt-4 space-y-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun ({currentUser.name})</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-semibold text-xs transition-colors cursor-pointer text-center"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
