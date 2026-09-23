import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  X,
  UserPlus,
  Trash2,
  Lock
} from 'lucide-react';
import { useToast } from './Toast';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const { users, currentUser, addUser, deleteUser, updateUser, isAdmin } = useApp();

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('pegawai');
  const [newPin, setNewPin] = useState('');

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('pegawai');
  const [editPin, setEditPin] = useState('');

  const { showToast } = useToast();

  if (!isOpen) return null;

  const startEditUser = (u: any) => {
    setEditingUserId(u.id);
    setEditName(u.name || '');
    setEditEmail(u.email || '');
    setEditPhone(u.phone || '');
    setEditRole(u.role || 'pegawai');
    setEditPin(u.pin || '');
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingUserId) return;
    if (!editName.trim() || !editEmail.trim()) {
      showToast('Mohon lengkapi nama dan email.', 'error');
      return;
    }

    updateUser(editingUserId, {
      name: editName.trim(),
      phone: editPhone.trim() || undefined,
      role: editRole,
      pin: editPin.trim() || '1234'
});

    setEditingUserId(null);
    showToast('Data akun berhasil diperbarui.', 'success');
  };
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      showToast('Mohon lengkapi nama, email, dan password login.', 'error');
      return;
    }

    addUser({
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      password: newPassword.trim(),
      phone: newPhone.trim() || undefined,
      role: newRole,
      pin: newPin.trim() || '1234',
      active: true
});

    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewPhone('');
    setNewPin('');
    showToast('Akun pegawai baru berhasil didaftarkan ke sistem & database.', 'success');
  };


  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full border border-neutral-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal: Judul tebal + tombol close (X) sederhana di kanan atas */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-black">
              Kelola pegawai & shift
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Daftar akun kasir dan hak akses operasional
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Info detail daftar akun dalam baris rapi */}
          <div>
            <h4 className="font-bold text-sm text-black mb-3">
              Daftar akun aktif
            </h4>
            <div className="space-y-2.5">
              {users.map((u) => {
                const isCur = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl border border-neutral-100 bg-[#FAFAFA] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#7E9F85] text-white flex items-center justify-center text-xs font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-black text-xs">{u.name}</span>
                          {isCur && (
                            <span className="text-[10px] bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded-full font-medium">
                              Sedang aktif
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>{u.role === 'admin' ? 'Admin / Pemilik' : 'Kasir / Staf'}</span>
                          {u.email && <span className="font-mono text-neutral-600">({u.email})</span>}
                          {u.pin && <span className="text-neutral-400">PIN: {u.pin}</span>}
                          {u.phone && <span className="text-neutral-400">• {u.phone}</span>}
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditUser(u)}
                          className="px-3 py-1.5 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold transition-colors text-[10px]"
                        >
                          Edit
                        </button>
                        {!isCur && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus akun pegawai "${u.name}"?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            className="p-2 rounded-full hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors"
                            title="Hapus akun"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Edit atau Tambah Pegawai */}
          {isAdmin ? (
            editingUserId ? (
              <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-black">
                    Edit Akun: {editName}
                  </h4>
                  <button type="button" onClick={() => setEditingUserId(null)} className="text-xs text-neutral-500 font-bold">Batal</button>
                </div>
                <form onSubmit={handleSaveUserEdit} className="space-y-3">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 font-medium">Nama lengkap</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-2xl px-3.5 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 font-medium">Email login (Tetap)</label>
                      <input
                        type="email"
                        disabled
                        value={editEmail}
                        className="w-full bg-neutral-100 border border-neutral-200 rounded-2xl px-3.5 py-2 text-xs text-neutral-500 cursor-not-allowed"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block">Sistem keamanan Firebase tidak mengizinkan perubahan email/password tanpa verifikasi ulang pengguna.</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 font-medium">PIN keamanan (4 digit)</label>
                      <input
                        type="password"
                        maxLength={6}
                        required
                        value={editPin}
                        onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-2xl px-3.5 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85] font-mono tracking-widest"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 font-medium">Nomor WhatsApp / HP</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-2xl px-3.5 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 font-medium">Hak akses</label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-2xl px-3.5 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                      >
                        <option value="pegawai">Kasir / Pegawai</option>
                        <option value="admin">Admin / Pemilik</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-full bg-[#7E9F85] hover:bg-[#6F8F75] text-white font-bold text-xs tracking-wide transition-colors cursor-pointer text-center"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-[#FAFAFA] p-5 rounded-3xl border border-neutral-100 space-y-3.5">
                <h4 className="font-bold text-sm text-black">
                  Tambah pegawai baru
                </h4>
                <p className="text-[11px] text-neutral-500 -mt-1">
                  Daftarkan akun karyawan untuk login dengan email, password & PIN kasir
                </p>
                <form onSubmit={handleAddUser} className="space-y-3">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 font-medium">Nama lengkap</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama pegawai baru (contoh: Ahmad Fauzi)..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-2xl px-3.5 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 font-medium">Email login</label>
                      <input
                        type="email"
                        required
                        placeholder="contoh: ahmad@toko.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded-2xl px-3.5 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 font-medium">Kata sandi / password</label>
                      <input
                        type="text"
                        required
                        placeholder="Minimal 6 karakter..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded-2xl px-3.5 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 font-medium">PIN keamanan (4 digit)</label>
                      <input
                        type="password"
                        maxLength={6}
                        required
                        placeholder="Contoh: 1234"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white border border-neutral-200 rounded-2xl px-3.5 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85] font-mono tracking-widest"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 font-medium">Nomor WhatsApp / HP</label>
                      <input
                        type="text"
                        placeholder="0812..."
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded-2xl px-3.5 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 font-medium">Hak akses</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full bg-white border border-neutral-200 rounded-2xl px-3.5 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                      >
                        <option value="pegawai">Kasir / Pegawai</option>
                        <option value="admin">Admin / Pemilik</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-full bg-[#7E9F85] hover:bg-[#6F8F75] text-white font-bold text-xs tracking-wide transition-colors cursor-pointer text-center"
                    >
                      Daftarkan pegawai
                    </button>
                  </div>
                </form>
              </div>
            )
          ) : (
            <div className="p-6 text-center bg-neutral-50 rounded-3xl text-neutral-500">
              <Lock className="w-6 h-6 mx-auto text-neutral-400 mb-2" />
              <p className="text-xs">Hanya admin yang dapat menambah atau menghapus akun pegawai.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
