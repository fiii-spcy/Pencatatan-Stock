import { useHistoryTransactions } from '../hooks/useHistoryTransactions';
import { formatRupiah } from '../utils/formatters';
import React, { useState, useMemo } from 'react';
import {
  Lock,
  PackageMinus,
  ShoppingCart,
  AlertOctagon,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';

export const PageKeluar: React.FC = () => {
  const {
    categories,
    products,
    dailyStockList,
    addStockOut,
    currentUser,
    transactions,
    isAdmin,
    updateTransaction,
    deleteTransaction
  } = useApp();
  const { showToast } = useToast();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || ''
  );

  const [selectedProductId, setSelectedProductId] = useState<string>(
    products.find((p) => p.categoryId === categories[0]?.id)?.id || products[0]?.id || ''
  );

  const [outType, setOutType] = useState<'out_sale' | 'out_damaged'>('out_sale');
  const [quantity, setQuantity] = useState<string>('');

  // Helper: parse desimal — support koma (157,5) dan titik (157.5)
  const parseDecimal = (val: string): number => {
    const normalized = val.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Validasi input: izinkan kosong, angka, satu koma atau titik
  const handleDecimalInput = (
    val: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (val === '' || /^[\d]*[,.]?[\d]*$/.test(val)) {
      setter(val);
    }
  };
  const [damagedReason, setDamagedReason] = useState<string>('Pecah saat sortasi/pengiriman');
  const [note, setNote] = useState<string>('');

  const currentCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return products;
    return products.filter((p) => p.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

  const currentProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const currentDailyStock = useMemo(() => {
    if (!selectedProductId) return null;
    return dailyStockList.find((d) => d.productId === selectedProductId);
  }, [dailyStockList, selectedProductId]);

  const [useAltUnit, setUseAltUnit] = useState<boolean>(false);

  // Edit History State
  const [editingTx, setEditingTx] = useState<any>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editOutType, setEditOutType] = useState<'out_sale' | 'out_damaged'>('out_sale');
  const [editPrice, setEditPrice] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editNote, setEditNote] = useState('');

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    const qtyNum = parseFloat(editQuantity.replace(',', '.'));
    if (isNaN(qtyNum) || qtyNum <= 0) {
      showToast('Jumlah tidak valid', 'error');
      return;
    }
    const res = updateTransaction(editingTx.id, {
      quantity: qtyNum,
      type: editOutType,
      sellPrice: parseFloat(editPrice) || 0,
      reason: editReason.trim() || undefined,
      note: editNote.trim() || undefined
    });
    if (res.success) {
      showToast('Transaksi berhasil diubah', 'success');
      setEditingTx(null);
    } else {
      showToast(res.message || 'Gagal mengubah', 'error');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Yakin ingin menghapus riwayat ini?')) {
      const res = deleteTransaction(id);
      if (res.success) showToast('Transaksi dihapus', 'success');
      else showToast(res.message || 'Gagal menghapus', 'error');
    }
  };

  // Reset pilihan satuan saat produk diganti
  React.useEffect(() => {
    setUseAltUnit(false);
    setQuantity('');
  }, [selectedProductId]);

  const hasAltUnit = Boolean(
    currentProduct?.altUnit && currentProduct?.altSellPrice && currentProduct?.altUnitConversion
  );

  const fixedSellPrice = useAltUnit && hasAltUnit
    ? currentProduct!.altSellPrice!
    : currentProduct?.sellPrice || 0;

  const qtyNumber = parseDecimal(quantity);
  const calculatedPengeluaran = qtyNumber * fixedSellPrice;

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handleSwitchType = (type: 'out_sale' | 'out_damaged') => {
    setOutType(type);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId || !currentProduct) {
      showToast('Silakan pilih produk terlebih dahulu', 'warning');
      return;
    }

    const qty = parseDecimal(quantity);
    if (!qty || qty <= 0) {
      showToast('Jumlah pengeluaran harus lebih besar dari 0', 'warning');
      return;
    }

    let qtyInMainUnit = qty;
    let sellPriceInMainUnit = fixedSellPrice;
    let autoNote = note.trim();
    let displayUnit = currentProduct.unit;

    if (useAltUnit && hasAltUnit && currentProduct.altUnitConversion) {
      qtyInMainUnit = qty / currentProduct.altUnitConversion;
      // Konversi ekuivalen harga per satuan utama
      sellPriceInMainUnit = currentProduct.altSellPrice! * currentProduct.altUnitConversion;
      autoNote = `[Jual ${qty} ${currentProduct.altUnit}] ${autoNote}`.trim();
      displayUnit = currentProduct.altUnit!;
    }

    const res = addStockOut({
      productId: selectedProductId,
      quantity: qtyInMainUnit,
      type: outType,
      sellPrice: outType === 'out_sale' ? sellPriceInMainUnit : 0,
      reason:
        outType === 'out_sale'
          ? 'Penjualan Kasir'
          : damagedReason.trim() || 'Barang Rusak / Pecah',
      note: autoNote || undefined,
    });

    if (res.success) {
      showToast(
        `✅ ${qty} ${displayUnit} ${currentProduct.name} berhasil dicatat (${
          outType === 'out_sale' ? formatRupiah(calculatedPengeluaran) : 'Afkir'
        })`,
        'success'
      );
      setQuantity('');
      setNote('');
    } else {
      showToast(res.message || 'Gagal mencatat stok keluar', 'error');
    }
  };

  // Total pengeluaran hari ini untuk kategori terpilih
  const categoryTotalPengeluaran = useMemo(() => {
    return filteredProducts.reduce((acc, p) => {
      const itemDaily = dailyStockList.find((d) => d.productId === p.id);
      const todayOutSaved = itemDaily?.totalStockOut ?? 0;
      const inputQty = p.id === selectedProductId && qtyNumber > 0 ? qtyNumber : 0;
      return acc + (todayOutSaved + inputQty) * p.sellPrice;
    }, 0);
  }, [filteredProducts, dailyStockList, selectedProductId, qtyNumber]);

  // History transaksi keluar hari ini untuk kategori ini dengan running balance
  const historyTransactions = useHistoryTransactions(transactions, products, selectedCategoryId, 'out');

  return (
    <div className="w-full space-y-4">
      {/* Page Title */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
          <PackageMinus className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg sm:text-2xl font-bold text-black tracking-tight">
          Stok keluar
        </h2>
      </div>

      {/* ======================== MOBILE LAYOUT (single column) ======================== */}
      <div className="block lg:hidden space-y-4">
        {/* 1. Tipe Pengeluaran */}
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
              Jenis Pengeluaran
            </span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSwitchType('out_sale')}
              className={`p-4 rounded-xl border text-left min-h-[72px] transition-all active:scale-[0.97] ${
                outType === 'out_sale'
                  ? 'border-[#7E9F85] bg-[#F2F6F3] ring-1 ring-[#7E9F85]/30'
                  : 'border-neutral-200 bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className={`w-4 h-4 ${outType === 'out_sale' ? 'text-[#527459]' : 'text-neutral-400'}`} />
                <h4 className="font-bold text-black text-sm">Penjualan</h4>
              </div>
              <p className="text-[11px] text-neutral-500">Kasir / toko</p>
              {outType === 'out_sale' && (
                <span className="inline-block mt-1.5 text-[10px] bg-[#7E9F85] text-white px-2 py-0.5 rounded-full font-bold">
                  Dipilih ✓
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSwitchType('out_damaged')}
              className={`p-4 rounded-xl border text-left min-h-[72px] transition-all active:scale-[0.97] ${
                outType === 'out_damaged'
                  ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-200'
                  : 'border-neutral-200 bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertOctagon className={`w-4 h-4 ${outType === 'out_damaged' ? 'text-rose-500' : 'text-neutral-400'}`} />
                <h4 className="font-bold text-black text-sm">Rusak / Afkir</h4>
              </div>
              <p className="text-[11px] text-neutral-500">Pecah / cacat</p>
              {outType === 'out_damaged' && (
                <span className="inline-block mt-1.5 text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">
                  Dipilih ✓
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2. Pilih Kategori */}
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
              Pilih Kategori
            </span>
          </div>
          <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  const firstP = products.find((p) => p.categoryId === cat.id);
                  if (firstP) handleSelectProduct(firstP.id);
                }}
                className={`min-h-[40px] px-4 py-1.5 rounded-full text-sm font-semibold shrink-0 transition-all active:scale-95 ${
                  selectedCategoryId === cat.id
                    ? 'bg-[#7E9F85] text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Pilih Produk */}
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
              Pilih Produk
            </span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {filteredProducts.map((p) => {
              const isSelected = p.id === selectedProductId;
              const itemDaily = dailyStockList.find((d) => d.productId === p.id);
              const currentStock = itemDaily?.finalStock ?? 0;
              const isLow = itemDaily?.isLowStock || false;
              const isOut = itemDaily?.isOutOfStock || false;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProduct(p.id)}
                  className={`p-3.5 rounded-xl border text-left min-h-[72px] transition-all active:scale-[0.97] ${
                    isSelected
                      ? 'border-[#7E9F85] bg-[#F2F6F3] ring-1 ring-[#7E9F85]/30'
                      : isOut
                      ? 'border-rose-200 bg-rose-50/50'
                      : isLow
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-neutral-200 bg-neutral-50'
                  }`}
                >
                  <h4 className="font-bold text-black text-sm leading-tight">{p.name}</h4>
                  <span
                    className={`text-[11px] mt-1 block font-semibold ${
                      isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-neutral-500'
                    }`}
                  >
                    Sisa: {currentStock} {p.unit}
                    {isOut ? ' ⚠ Habis' : isLow ? ' ⚠ Menipis' : ''}
                  </span>
                  {isSelected && (
                    <span className="inline-block mt-1.5 text-[10px] bg-[#7E9F85] text-white px-2 py-0.5 rounded-full font-bold">
                      Dipilih ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Form Input */}
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
              Detail Pengeluaran
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Product Info */}
            {currentProduct && (
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                <div className="w-9 h-9 rounded-lg bg-neutral-200 flex items-center justify-center shrink-0">
                  <PackageMinus className="w-4 h-4 text-neutral-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-black truncate">{currentProduct.name}</p>
                  <p className="text-[11px] text-neutral-500">
                    Stok saat ini:{' '}
                    <strong
                      className={
                        currentDailyStock?.isOutOfStock
                          ? 'text-rose-600'
                          : currentDailyStock?.isLowStock
                          ? 'text-amber-700'
                          : 'text-neutral-700'
                      }
                    >
                      {currentDailyStock?.finalStock ?? 0} {currentProduct.unit}
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {/* Unit Toggle (Mobile) */}
            {hasAltUnit && (
              <div className="mb-4">
                <label className="block text-sm font-bold text-black mb-2">Satuan penjualan</label>
                <div className="flex bg-neutral-100/70 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUseAltUnit(false)}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                      !useAltUnit ? 'bg-white shadow-sm text-black' : 'text-neutral-500'
                    }`}
                  >
                    {currentProduct?.unit}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseAltUnit(true)}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                      useAltUnit ? 'bg-white shadow-sm text-black' : 'text-neutral-500'
                    }`}
                  >
                    {currentProduct?.altUnit}
                  </button>
                </div>
              </div>
            )}

            {/* Jumlah Keluar */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Jumlah keluar ({useAltUnit ? currentProduct?.altUnit : (currentProduct?.unit || 'satuan')})
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="Contoh: 157,5"
                  value={quantity}
                  onChange={(e) => handleDecimalInput(e.target.value, setQuantity)}
                  className="flex-1 bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 h-14 text-xl font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#7E9F85] focus:bg-white"
                />
                <div className="w-16 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-neutral-600 text-sm">
                  {useAltUnit ? currentProduct?.altUnit : (currentProduct?.unit || 'pcs')}
                </div>
              </div>
              {/* Over-stock warning */}
              {currentDailyStock &&
                (useAltUnit && currentProduct?.altUnitConversion
                  ? qtyNumber / currentProduct.altUnitConversion
                  : qtyNumber) > currentDailyStock.finalStock && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5">
                  ⚠ Melebihi stok ({currentDailyStock.finalStock} {currentProduct?.unit})
                </p>
              )}
            </div>

            {/* Harga Jual (locked) atau Alasan Rusak */}
            {outType === 'out_sale' ? (
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-xs text-neutral-500 font-medium">
                    Harga jual (ditetapkan)
                  </span>
                  <span className="ml-auto text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full font-semibold">
                    Terkunci
                  </span>
                </div>
                <div className="text-lg font-bold text-black">
                  {formatRupiah(fixedSellPrice)}
                  <span className="text-xs font-normal text-neutral-400 ml-1">
                    / {useAltUnit ? currentProduct?.altUnit : (currentProduct?.unit || 'satuan')}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-2">
                  Penyebab kerusakan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pecah saat sortasi..."
                  value={damagedReason}
                  onChange={(e) => setDamagedReason(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 h-11 text-sm text-black focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white"
                />
              </div>
            )}

            {/* Catatan */}
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-2">
                Catatan tambahan (opsional)
              </label>
              <input
                type="text"
                placeholder="Keterangan transaksi jika ada..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 h-11 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#7E9F85] focus:bg-white"
              />
            </div>

            {/* Kalkulasi Realtime */}
            {qtyNumber > 0 && outType === 'out_sale' && (
              <div className="p-4 rounded-xl bg-[#F2F6F3] border border-[#7E9F85]/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#3E6047] font-medium">
                    {qtyNumber} × {formatRupiah(fixedSellPrice)}
                  </span>
                  <strong className="text-[#2E4F36] text-base">
                    {formatRupiah(calculatedPengeluaran)}
                  </strong>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full min-h-[52px] rounded-xl font-bold text-base text-white transition-all active:scale-[0.98] shadow-sm ${
                outType === 'out_sale'
                  ? 'bg-[#7E9F85] hover:bg-[#6F8F75]'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {outType === 'out_sale' ? 'Simpan Penjualan' : 'Simpan Barang Rusak'}
            </button>
          </form>
        </div>
      </div>

      {/* ======================== DESKTOP LAYOUT (two columns) ======================== */}
      <div className="hidden lg:grid grid-cols-12 gap-6">
        {/* LEFT: Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-8 border border-neutral-100 space-y-4">
            <div>
              <span className="text-xs text-neutral-400 font-medium block mb-2.5">
                Pilih jenis pengeluaran
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSwitchType('out_sale')}
                  className={`p-3 rounded-2xl border text-left min-h-[76px] ${
                    outType === 'out_sale'
                      ? 'border-[#7E9F85] bg-[#F2F6F3]'
                      : 'border-neutral-100 bg-[#FAFAFA]'
                  }`}
                >
                  <h4 className="font-bold text-black text-xs">Penjualan</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Kasir</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchType('out_damaged')}
                  className={`p-3 rounded-2xl border text-left min-h-[76px] ${
                    outType === 'out_damaged'
                      ? 'border-neutral-800 bg-neutral-100'
                      : 'border-neutral-100 bg-[#FAFAFA]'
                  }`}
                >
                  <h4 className="font-bold text-black text-xs">Rusak / afkir</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Pecah / cacat</p>
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs text-neutral-400 font-medium block mb-2.5">
                Pilih kategori
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      const firstP = products.find((p) => p.categoryId === cat.id);
                      if (firstP) handleSelectProduct(firstP.id);
                    }}
                    className={`min-h-11 px-4 py-2 rounded-full text-sm font-semibold shrink-0 ${
                      selectedCategoryId === cat.id
                        ? 'bg-[#7E9F85] text-white'
                        : 'bg-[#FAFAFA] text-neutral-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-neutral-400 font-medium block mb-2.5">
                Pilih produk yang dikeluarkan
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((p) => {
                  const isSelected = p.id === selectedProductId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProduct(p.id)}
                      className={`p-3 rounded-2xl border text-left min-h-11 ${
                        isSelected
                          ? 'border-[#7E9F85] bg-[#F2F6F3] font-semibold'
                          : 'border-neutral-100 bg-[#FAFAFA]'
                      }`}
                    >
                      <h4 className="font-bold text-black text-xs">{p.name}</h4>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form detail */}
          <div className="bg-white rounded-2xl p-8 border border-neutral-100">
            <h3 className="text-base font-bold text-black mb-4">Rincian pengeluaran</h3>
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Unit Toggle (Desktop) */}
              {hasAltUnit && (
                <div>
                  <label className="block text-xs font-bold text-black mb-1.5">Satuan penjualan</label>
                  <div className="flex bg-neutral-100/70 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setUseAltUnit(false)}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors ${
                        !useAltUnit ? 'bg-white shadow-sm text-black' : 'text-neutral-500'
                      }`}
                    >
                      {currentProduct?.unit}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseAltUnit(true)}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors ${
                        useAltUnit ? 'bg-white shadow-sm text-black' : 'text-neutral-500'
                      }`}
                    >
                      {currentProduct?.altUnit}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  Jumlah barang keluar ({useAltUnit ? currentProduct?.altUnit : (currentProduct?.unit || 'satuan')})
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="Contoh: 157,5"
                    value={quantity}
                    onChange={(e) => handleDecimalInput(e.target.value, setQuantity)}
                    className="flex-1 bg-[#FAFAFA] border border-neutral-200 rounded-2xl px-4 h-12 text-base font-bold text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85] focus:bg-white"
                  />
                  <div className="w-20 rounded-2xl bg-neutral-100 flex items-center justify-center font-bold text-neutral-600 text-xs">
                    {useAltUnit ? currentProduct?.altUnit : (currentProduct?.unit || 'pcs')}
                  </div>
                </div>
                {/* Over-stock warning */}
                {currentDailyStock &&
                  (useAltUnit && currentProduct?.altUnitConversion
                    ? qtyNumber / currentProduct.altUnitConversion
                    : qtyNumber) > currentDailyStock.finalStock && (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5">
                    ⚠ Melebihi stok ({currentDailyStock.finalStock} {currentProduct?.unit})
                  </p>
                )}
              </div>

              {outType === 'out_sale' ? (
                <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Harga jual satuan (Telah ditetapkan)</span>
                    </span>
                    <span className="text-[10px] bg-neutral-200/70 text-neutral-600 px-2 py-0.5 rounded-full font-semibold">
                      Terkunci
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <div className="text-lg font-bold text-black">
                      {formatRupiah(fixedSellPrice)}{' '}
                      <span className="text-xs font-normal text-neutral-400">
                        / {useAltUnit ? currentProduct?.altUnit : (currentProduct?.unit || 'satuan')}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400">Ubah di menu Kelola Barang</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">
                    Penyebab kerusakan / afkir
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pecah saat sortasi, bocor kemasan..."
                    value={damagedReason}
                    onChange={(e) => setDamagedReason(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-2xl px-4 py-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85] focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">
                  Catatan tambahan (opsional)
                </label>
                <input
                  type="text"
                  placeholder="Keterangan transaksi jika ada..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-2xl px-4 py-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85] focus:bg-white"
                />
              </div>

              {qtyNumber > 0 && (
                <div className="p-4 rounded-2xl bg-[#F2F6F3] border border-[#7E9F85]/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#3E6047] font-medium">
                      Pengeluaran diinput ({qtyNumber} × {formatRupiah(fixedSellPrice)})
                    </span>
                    <strong className="text-[#2E4F36] text-sm">
                      {formatRupiah(calculatedPengeluaran)}
                    </strong>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-12 rounded-full bg-[#7E9F85] text-white font-bold text-sm"
                >
                  Simpan pencatatan stok keluar
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: Summary table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-7 border border-neutral-100">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-base font-bold text-black truncate">
                {currentCategory?.name || 'Kategori'}
              </h4>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 shrink-0">
                {filteredProducts.length} barang
              </span>
            </div>

            {filteredProducts.length > 0 ? (
              <>
                <div className="overflow-x-auto rounded-2xl border border-neutral-200/80">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-[#FAFAFA] text-[11px] font-semibold text-neutral-600 border-b border-neutral-200">
                        <th className="py-3 px-4 text-left font-bold text-neutral-800">Nama barang</th>
                        <th className="py-3 px-3 text-center">Stok</th>
                        <th className="py-3 px-3 text-center text-rose-600">Jumlah keluar</th>
                        <th className="py-3 px-3 text-center">Sisa stok</th>
                        <th className="py-3 px-4 text-right font-bold text-[#2E4F36] bg-[#EDF3EE]/80">
                          Pengeluaran
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredProducts.map((prod) => {
                        const isSelected = prod.id === selectedProductId;
                        const itemDaily = dailyStockList.find((d) => d.productId === prod.id);
                        const currentStock = itemDaily?.finalStock ?? 0;
                        const todayOutSaved = itemDaily?.totalStockOut ?? 0;
                        const inputQty = isSelected && qtyNumber > 0 ? qtyNumber : 0;
                        const totalOutDisplay = todayOutSaved + inputQty;
                        const sisaStok = Math.max(0, currentStock - inputQty);
                        const pengeluaranTotal = totalOutDisplay * prod.sellPrice;

                        return (
                          <tr
                            key={prod.id}
                            onClick={() => handleSelectProduct(prod.id)}
                            className={`cursor-pointer ${
                              isSelected ? 'bg-[#F2F6F3] font-medium' : 'hover:bg-neutral-50/80'
                            }`}
                          >
                            <td className="py-3.5 px-4 font-bold text-black">
                              <div className="flex items-center gap-2">
                                <span>{prod.name}</span>
                                {isSelected && (
                                  <span className="text-[10px] bg-[#7E9F85] text-white px-2 py-0.5 rounded-full font-bold">
                                    Aktif
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center font-semibold">
                              {currentStock} {prod.unit}
                            </td>
                            <td className="py-3.5 px-3 text-center font-bold text-rose-600">
                              {totalOutDisplay > 0 ? (
                                `${totalOutDisplay} ${prod.unit}`
                              ) : (
                                <span className="text-neutral-300 font-normal">0</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-center font-bold">
                              {sisaStok} {prod.unit}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-[#2E4F36] bg-[#EDF3EE]/60">
                              {totalOutDisplay > 0 ? (
                                formatRupiah(pengeluaranTotal)
                              ) : (
                                <span className="text-neutral-300">0</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-50/80 border-t border-neutral-200 text-xs">
                        <td colSpan={4} className="py-3 px-4 font-bold text-neutral-700 text-right">
                          Total pengeluaran hari ini
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#2E4F36] bg-[#EDF3EE] text-sm">
                          {formatRupiah(categoryTotalPengeluaran)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {currentDailyStock && qtyNumber > currentDailyStock.finalStock && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200/60 rounded-2xl text-xs text-amber-800">
                    Jumlah keluar ({qtyNumber}) melebihi stok {currentProduct?.name} (
                    {currentDailyStock.finalStock} {currentProduct?.unit}).
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-neutral-400 text-sm">
                Belum ada produk di kategori ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================== HISTORY TABLE (Shared Mobile & Desktop) ======================== */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mt-6 shadow-sm">
        <div className="px-4 py-3.5 border-b border-neutral-100 flex items-center justify-between bg-[#FAFAFA]">
          <h3 className="text-sm font-bold text-black flex items-center gap-2">
            <PackageMinus className="w-4 h-4 text-neutral-600" />
            <span>Riwayat Keluar - {currentCategory?.name || 'Kategori'}</span>
          </h3>
          <span className="text-[10px] font-semibold bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">
            Hari ini
          </span>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-white text-[11px] text-neutral-400 border-b border-neutral-100">
              <tr>
                <th className="py-2.5 px-4 font-semibold w-1/5">Waktu</th>
                <th className="py-2.5 px-3 font-semibold w-1/5">Petugas</th>
                <th className="py-2.5 px-3 font-semibold w-2/5">Barang</th>
                <th className="py-2.5 px-3 text-right font-semibold w-1/5">Jumlah</th>
                <th className="py-2.5 px-4 text-right font-semibold w-1/5 text-[#3E6047]">Sisa</th>
                {isAdmin && <th className="py-2.5 px-4 text-center font-semibold w-1/5">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {historyTransactions.length > 0 ? (
                historyTransactions.map((tx) => {
                  const prod = products.find((p) => p.id === tx.productId);
                  const isDamaged = tx.type === 'out_damaged';
                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4 text-neutral-500">
                        {tx.time}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-black">{tx.userName}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-black truncate max-w-[120px] block">
                          {prod?.name || 'Produk'}
                        </span>
                        <span className={`text-[9px] font-semibold mt-0.5 block ${isDamaged ? 'text-rose-500' : 'text-neutral-400'}`}>
                          {isDamaged ? 'Rusak/Afkir' : 'Penjualan'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-bold px-2 py-1 rounded-lg ${
                          isDamaged ? 'text-rose-600 bg-rose-50' : 'text-neutral-700 bg-neutral-100'
                        }`}>
                          -{tx.quantity} {tx.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-black">
                          {tx.currentBalance} {tx.unit}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingTx(tx);
                                setEditQuantity(tx.quantity.toString());
                                setEditOutType(tx.type as any);
                                setEditPrice((tx.sellPrice || 0).toString());
                                setEditReason(tx.reason || '');
                                setEditNote(tx.note || '');
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Transaksi"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400 text-xs">
                    Belum ada barang keluar di kategori ini hari ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-black">Edit Transaksi Keluar</h3>
              <button onClick={() => setEditingTx(null)} className="p-2 hover:bg-neutral-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Tipe Keluar</label>
                <select
                  value={editOutType}
                  onChange={(e) => setEditOutType(e.target.value as any)}
                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7E9F85]/20 focus:border-[#7E9F85] outline-none"
                >
                  <option value="out_sale">Terjual</option>
                  <option value="out_damaged">Barang Rusak/Pecah</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Jumlah</label>
                <input
                  type="number"
                  step="any"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7E9F85]/20 focus:border-[#7E9F85] outline-none"
                  required
                />
              </div>
              {editOutType === 'out_sale' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Harga Jual</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7E9F85]/20 focus:border-[#7E9F85] outline-none"
                  />
                </div>
              )}
              {editOutType === 'out_damaged' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Alasan Rusak</label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7E9F85]/20 focus:border-[#7E9F85] outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7E9F85]/20 focus:border-[#7E9F85] outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#7E9F85] text-white font-bold py-3 rounded-xl mt-2 hover:bg-[#6F8F75]"
              >
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
