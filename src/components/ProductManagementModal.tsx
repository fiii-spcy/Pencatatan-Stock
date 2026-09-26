import { formatRupiah } from '../utils/formatters';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import { Product } from '../types';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Lock
} from 'lucide-react';

interface ProductManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper: parse angka desimal dengan koma atau titik
const parseDecimal = (val: string): number => {
  // Ganti koma jadi titik agar parseFloat bisa baca
  const normalized = val.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

export const ProductManagementModal: React.FC<ProductManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    dailyStockList,
    isAdmin
} = useApp();

  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // New Product Form State — pakai string supaya angka 0 bisa dihapus dan koma bisa dipakai
  const [newProdName, setNewProdName] = useState('');
  const [newProdCatId, setNewProdCatId] = useState(categories[0]?.id || '');
  const [newProdUnit, setNewProdUnit] = useState('kg');
  const [newProdBuyPrice, setNewProdBuyPrice] = useState<string>('');
  const [newProdSellPrice, setNewProdSellPrice] = useState<string>('');
  const [newProdInitialStock, setNewProdInitialStock] = useState<string>('');
  const [newProdSupplier, setNewProdSupplier] = useState('');
  // Multi-satuan jual tambahan
  const [newProdAltUnit, setNewProdAltUnit] = useState<string>('');
  const [newProdAltSellPrice, setNewProdAltSellPrice] = useState<string>('');
  const [newProdAltConversion, setNewProdAltConversion] = useState<string>('');

  // Category Form & Edit State
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<{ id: string; name: string } | null>(null);

  // Editing Product State — pakai string supaya angka 0 bisa dihapus dan koma bisa dipakai
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editUnit, setEditUnit] = useState<string>('kg');
  const [editCatId, setEditCatId] = useState<string>('');
  const [editBuyPrice, setEditBuyPrice] = useState<string>('');
  const [editSellPrice, setEditSellPrice] = useState<string>('');
  const [editInitialStock, setEditInitialStock] = useState<string>('');
  const [editSupplier, setEditSupplier] = useState<string>('');
  // Multi-satuan jual tambahan (edit)
  const [editAltUnit, setEditAltUnit] = useState<string>('');
  const [editAltSellPrice, setEditAltSellPrice] = useState<string>('');
  const [editAltConversion, setEditAltConversion] = useState<string>('');

  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newProdName.trim()) {
      return;
    }

    addProduct({
      name: newProdName.trim(),
      categoryId: newProdCatId || categories[0]?.id || 'cat-custom',
      unit: newProdUnit.trim() || 'kg',
      minStock: 0,
      buyPrice: parseDecimal(newProdBuyPrice),
      sellPrice: parseDecimal(newProdSellPrice),
      initialStock: parseDecimal(newProdInitialStock),
      supplierDefault: newProdSupplier.trim() || undefined,
      altUnit: newProdAltUnit.trim() || undefined,
      altSellPrice: newProdAltUnit.trim() ? parseDecimal(newProdAltSellPrice) : undefined,
      altUnitConversion: newProdAltUnit.trim() ? parseDecimal(newProdAltConversion) : undefined,
});

    setNewProdName('');
    setNewProdBuyPrice('');
    setNewProdSellPrice('');
    setNewProdInitialStock('');
    setNewProdAltUnit('');
    setNewProdAltSellPrice('');
    setNewProdAltConversion('');
    showToast('Produk berhasil didaftarkan dengan stok awal toko.', 'success');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newCatName.trim()) {
      return;
    }

    addCategory({
      name: newCatName.trim(),
      isCustom: true
});

    setNewCatName('');
    showToast('Kategori baru berhasil dibuat.', 'success');
  };

  const handleSaveCategoryEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingCat || !editingCat.name.trim()) return;

    updateCategory(editingCat.id, { name: editingCat.name.trim() });
    
    setEditingCat(null);
    showToast('Nama kategori berhasil diperbarui.', 'success');
  };

  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProd || !isAdmin) return;
    if (!editName.trim()) return;

    updateProduct(editingProd.id, {
      name: editName.trim(),
      unit: editUnit.trim() || 'kg',
      categoryId: editCatId || categories[0]?.id,
      buyPrice: parseDecimal(editBuyPrice),
      sellPrice: parseDecimal(editSellPrice),
      minStock: 0,
      initialStock: parseDecimal(editInitialStock),
      supplierDefault: editSupplier.trim() || undefined,
      altUnit: editAltUnit.trim() || undefined,
      altSellPrice: editAltUnit.trim() ? parseDecimal(editAltSellPrice) : undefined,
      altUnitConversion: editAltUnit.trim() ? parseDecimal(editAltConversion) : undefined,
});

    setEditingProd(null);
    showToast('Data produk berhasil diperbarui.', 'success');
  };

  const startEditProduct = (p: Product) => {
    setEditingProd(p);
    setEditName(p.name);
    setEditUnit(p.unit);
    setEditCatId(p.categoryId);
    setEditBuyPrice(String(p.buyPrice));
    setEditSellPrice(String(p.sellPrice));
    setEditInitialStock(String(p.initialStock));
    setEditSupplier(p.supplierDefault || '');
    setEditAltUnit(p.altUnit || '');
    setEditAltSellPrice(p.altSellPrice !== undefined ? String(p.altSellPrice) : '');
    setEditAltConversion(p.altUnitConversion !== undefined ? String(p.altUnitConversion) : '');
  };

  // Validasi input: hanya izinkan angka, koma, dan titik
  const handleDecimalInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const val = e.target.value;
    // Izinkan kosong, angka, satu koma/titik
    if (val === '' || /^[\d]*[,.]?[\d]*$/.test(val)) {
      setter(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full border border-neutral-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-black">
              Kelola barang &amp; master stok
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Input stok awal toko (cukup sekali), harga beli modal &amp; harga jual
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-100 px-6 pt-3 bg-[#FAFAFA] gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'products'
                ? 'border-[#7E9F85] text-black'
                : 'border-transparent text-neutral-400 hover:text-black'
            }`}
          >
            Daftar &amp; tambah produk
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'categories'
                ? 'border-[#7E9F85] text-black'
                : 'border-transparent text-neutral-400 hover:text-black'
            }`}
          >
            Kelola kategori
          </button>
        </div>

        {/* Content Area — scrollable, termasuk form edit produk */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {!isAdmin ? (
            <div className="p-8 text-center bg-neutral-50 rounded-3xl text-neutral-600">
              <Lock className="w-6 h-6 mx-auto text-neutral-400 mb-2" />
              <h4 className="font-bold text-sm text-black">Akses khusus admin / owner</h4>
              <p className="text-xs text-neutral-400 mt-1">
                Perubahan master data barang dan stok awal toko hanya dapat dilakukan oleh admin toko.
              </p>
            </div>
          ) : activeTab === 'products' ? (
            <>
              {/* Form Tambah Produk Baru */}
              <div className="bg-[#FAFAFA] p-5 rounded-3xl border border-neutral-100">
                <div className="mb-3">
                  <h4 className="font-bold text-sm text-black">
                    Tambah produk baru
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Input nama barang dan stok fisik yang saat ini ada di toko (stok awal diinput sekali).
                  </p>
                </div>
                <form onSubmit={handleCreateProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-neutral-500 mb-1">Nama produk / varian</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Telur ayam negeri grade A (1 ikat/15kg)"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Kategori</label>
                    <select
                      value={newProdCatId}
                      onChange={(e) => setNewProdCatId(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Satuan jual</label>
                    <select
                      value={newProdUnit}
                      onChange={(e) => setNewProdUnit(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                    >
                      <option value="kg">kg (Kilogram)</option>
                      <option value="butir">butir</option>
                      <option value="karung">karung</option>
                      <option value="pouch">pouch</option>
                      <option value="botol">botol</option>
                      <option value="dus">dus / karton</option>
                      <option value="pack">pack</option>
                      <option value="pcs">pcs</option>
                    </select>
                  </div>

                  {/* STOK AWAL TOKO */}
                  <div className="bg-[#F2F6F3] p-3 rounded-2xl border border-[#7E9F85]/20 sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#3E6047]">
                        Stok awal di toko (diinput sekali)
                      </label>
                      <span className="text-[10px] bg-white text-[#45684E] px-2 py-0.5 rounded-full font-semibold">
                        Hanya diinput sekali
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      placeholder="Contoh: 157,5"
                      value={newProdInitialStock}
                      onChange={(e) => handleDecimalInput(e, setNewProdInitialStock)}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                    />
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Jumlah barang fisik yang ada sekarang di toko. Selanjutnya angka ini otomatis berjalan dan dinamakan <strong>&ldquo;Stok yang tersedia sekarang&rdquo;</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Harga modal (HPP)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={newProdBuyPrice}
                      onChange={(e) => handleDecimalInput(e, setNewProdBuyPrice)}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-neutral-500 mb-1">
                      Harga jual tetap ke konsumen (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Contoh: 31000"
                      value={newProdSellPrice}
                      onChange={(e) => handleDecimalInput(e, setNewProdSellPrice)}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                    />
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Ditetapkan di awal. Di menu <strong>Stok Keluar</strong>, karyawan tidak perlu menginput harga jual lagi, omzet dan laba akan otomatis terhitung.
                    </p>
                  </div>

                  {/* ===== SATUAN JUAL TAMBAHAN ===== */}
                  <div className="sm:col-span-2 bg-[#FAFAFA] border border-neutral-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-neutral-700">Satuan jual tambahan</span>
                      <span className="text-[10px] bg-neutral-200 text-neutral-500 px-2 py-0.5 rounded-full">Opsional</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mb-3">
                      Jika produk bisa dijual dalam 2 satuan (contoh: per <strong>kg</strong> dan per <strong>butir</strong>), isi bagian ini. Kosongkan jika tidak perlu.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-neutral-500 mb-1">Nama satuan alt.</label>
                        <input
                          type="text"
                          placeholder="Contoh: butir"
                          value={newProdAltUnit}
                          onChange={(e) => setNewProdAltUnit(e.target.value)}
                          className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-neutral-500 mb-1">Harga jual / satuan alt. (Rp)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Contoh: 2000"
                          value={newProdAltSellPrice}
                          onChange={(e) => handleDecimalInput(e, setNewProdAltSellPrice)}
                          className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-neutral-500 mb-1">Konversi (X satuan alt = 1 utama)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Contoh: 16"
                          value={newProdAltConversion}
                          onChange={(e) => handleDecimalInput(e, setNewProdAltConversion)}
                          className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                        />
                        <p className="text-[10px] text-neutral-400 mt-1">Misal: 16 butir = 1 kg</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-2 text-right pt-2">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#7E9F85] hover:bg-[#6F8F75] text-white font-bold rounded-full transition-colors cursor-pointer"
                    >
                      Simpan produk ke katalog
                    </button>
                  </div>
                </form>
              </div>

              {/* Daftar Produk Terdaftar */}
              <div>
                <h4 className="font-bold text-sm text-black mb-3">
                  Daftar produk terdaftar
                </h4>
                <div className="space-y-2.5">
                  {products.map((prod) => {
                    const daily = dailyStockList.find((d) => d.productId === prod.id);
                    const stockAvailableNow = daily?.finalStock ?? prod.initialStock;

                    return (
                      <div
                        key={prod.id}
                        className="p-4 rounded-2xl border border-neutral-100 bg-[#FAFAFA] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-black text-xs truncate">{prod.name}</span>
                            <span className="text-[10px] text-neutral-500 bg-white px-2 py-0.5 rounded-full border border-neutral-100">
                              {categories.find((c) => c.id === prod.categoryId)?.name}
                            </span>
                          </div>

                          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                            <div className="bg-white p-2 rounded-xl border border-neutral-100">
                              <span className="text-neutral-400 block text-[10px]">Stok awal toko:</span>
                              <strong className="text-neutral-800">{prod.initialStock} {prod.unit}</strong>
                            </div>
                            <div className="bg-[#EDF3EE] p-2 rounded-xl border border-[#7E9F85]/20">
                              <span className="text-[#45684E] block text-[10px] font-semibold">Stok tersedia sekarang:</span>
                              <strong className="text-[#3E6047] text-xs">{stockAvailableNow} {prod.unit}</strong>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-neutral-100">
                              <span className="text-neutral-400 block text-[10px]">Harga jual tetap:</span>
                              <strong className="text-black">{formatRupiah(prod.sellPrice)} /{prod.unit}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditProduct(prod)}
                            className="p-2 rounded-full hover:bg-neutral-200/60 text-neutral-600 transition-colors cursor-pointer"
                            title="Edit data produk"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Hapus produk "${prod.name}" dari katalog? Data transaksi lama tetap tersimpan.`)) {
                                deleteProduct(prod.id);
                                showToast(`Produk "${prod.name}" berhasil dihapus.`, 'success');
                              }
                            }}
                            className="p-2 rounded-full hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Hapus produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Form Edit Produk — ditampilkan inline di dalam scroll area */}
                        {editingProd?.id === prod.id && (
                          <form
                            onSubmit={handleSaveProductEdit}
                            className="w-full mt-3 pt-3 border-t border-neutral-200"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-black text-sm">Edit Produk</h4>
                              <button
                                type="button"
                                onClick={() => setEditingProd(null)}
                                className="text-neutral-400 hover:text-black text-xs font-medium cursor-pointer"
                              >
                                Tutup
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] text-neutral-500 mb-1">Nama produk</label>
                                <input
                                  type="text"
                                  required
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-neutral-500 mb-1">Kategori</label>
                                <select
                                  value={editCatId}
                                  onChange={(e) => setEditCatId(e.target.value)}
                                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                                >
                                  {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] text-neutral-500 mb-1">Satuan</label>
                                <select
                                  value={editUnit}
                                  onChange={(e) => setEditUnit(e.target.value)}
                                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                                >
                                  <option value="kg">kg</option>
                                  <option value="butir">butir</option>
                                  <option value="karung">karung</option>
                                  <option value="pouch">pouch</option>
                                  <option value="botol">botol</option>
                                  <option value="pack">pack</option>
                                  <option value="pcs">pcs</option>
                                  <option value="dus">dus</option>
                                  <option value="peti">peti</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] text-neutral-500 mb-1">Stok awal toko</label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="Contoh: 157,5"
                                  value={editInitialStock}
                                  onChange={(e) => handleDecimalInput(e, setEditInitialStock)}
                                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-neutral-500 mb-1">Harga modal (Rp)</label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0"
                                  value={editBuyPrice}
                                  onChange={(e) => handleDecimalInput(e, setEditBuyPrice)}
                                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-neutral-500 mb-1">Harga jual tetap (Rp)</label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0"
                                  value={editSellPrice}
                                  onChange={(e) => handleDecimalInput(e, setEditSellPrice)}
                                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] text-neutral-500 mb-1">Supplier default</label>
                                <input
                                  type="text"
                                  placeholder="Nama supplier..."
                                  value={editSupplier}
                                  onChange={(e) => setEditSupplier(e.target.value)}
                                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                                />
                              </div>
                            </div>

                            {/* ===== SATUAN JUAL TAMBAHAN (EDIT) ===== */}
                            <div className="mt-3 bg-white border border-neutral-200 rounded-2xl p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-neutral-700">Satuan jual tambahan</span>
                                <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">Opsional</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] text-neutral-500 mb-1">Satuan alt.</label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: butir"
                                    value={editAltUnit}
                                    onChange={(e) => setEditAltUnit(e.target.value)}
                                    className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-neutral-500 mb-1">Harga (Rp)</label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Contoh: 2000"
                                    value={editAltSellPrice}
                                    onChange={(e) => handleDecimalInput(e, setEditAltSellPrice)}
                                    className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-neutral-500 mb-1">Konversi (X alt = 1 utama)</label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Contoh: 16"
                                    value={editAltConversion}
                                    onChange={(e) => handleDecimalInput(e, setEditAltConversion)}
                                    className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end mt-4">
                              <button
                                type="button"
                                onClick={() => setEditingProd(null)}
                                className="px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="submit"
                                className="px-5 py-2 rounded-full bg-[#7E9F85] hover:bg-[#6F8F75] text-white text-xs font-bold transition-colors cursor-pointer"
                              >
                                Simpan perubahan
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Kategori */
            <div className="space-y-4">
              <div className="bg-[#FAFAFA] p-5 rounded-3xl border border-neutral-100">
                <h4 className="font-bold text-sm text-black mb-3">
                  Tambah kategori baru
                </h4>
                <form onSubmit={handleCreateCategory} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bumbu dapur, Minuman kemasan..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 bg-white border border-neutral-200 rounded-2xl px-4 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#7E9F85] hover:bg-[#6F8F75] text-white font-bold rounded-full transition-colors cursor-pointer shrink-0"
                  >
                    Buat kategori
                  </button>
                </form>
              </div>

              <div>
                <h4 className="font-bold text-sm text-black mb-3">
                  Daftar kategori
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {categories.map((c) => {
                    const prodCount = products.filter((p) => p.categoryId === c.id).length;
                    const isEditing = editingCat?.id === c.id;

                    return (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-neutral-100 flex items-center justify-between gap-3"
                      >
                        {isEditing ? (
                          <form onSubmit={handleSaveCategoryEdit} className="flex-1 flex gap-2">
                            <input
                              type="text"
                              autoFocus
                              value={editingCat.name}
                              onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                              className="flex-1 bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                            />
                            <button
                              type="button"
                              onClick={() => setEditingCat(null)}
                              className="text-neutral-400 hover:text-black text-[10px] font-medium"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-[#7E9F85] text-white rounded-xl text-[10px] font-bold"
                            >
                              Simpan
                            </button>
                          </form>
                        ) : (
                          <>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-black text-xs truncate">{c.name}</span>
                              <span className="text-[11px] text-neutral-400">
                                {prodCount} produk
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setEditingCat({ id: c.id, name: c.name })}
                                className="p-1.5 rounded-full hover:bg-neutral-200/60 text-neutral-500 transition-colors"
                                title="Edit nama kategori"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (prodCount > 0) {
                                    showToast(`Kategori "${c.name}" tidak bisa dihapus karena masih memiliki ${prodCount} produk. Pindahkan atau hapus produk terlebih dahulu.`, 'error');
                                    return;
                                  }
                                  if (window.confirm(`Hapus kategori "${c.name}"?`)) {
                                    deleteCategory(c.id);
                                    showToast(`Kategori "${c.name}" berhasil dihapus.`, 'success');
                                  }
                                }}
                                className={`p-1.5 rounded-full transition-colors ${
                                  prodCount > 0 
                                    ? 'text-neutral-300 cursor-not-allowed' 
                                    : 'text-neutral-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer'
                                }`}
                                title={prodCount > 0 ? "Kosongkan produk terlebih dahulu" : "Hapus kategori"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
