import { useHistoryTransactions } from '../hooks/useHistoryTransactions';
import { formatRupiah } from '../utils/formatters';
import React, { useState, useMemo } from 'react';
import { PackagePlus, ChevronDown, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SupplierCombobox } from './SupplierCombobox';
import { useToast } from './Toast';

export const PageMasuk: React.FC = () => {
  const {
    categories,
    products,
    dailyStockList,
    addStockIn,
    currentUser,
    transactions
} = useApp();
  const { showToast } = useToast();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || ''
  );

  const [selectedProductId, setSelectedProductId] = useState<string>(
    products.find((p) => p.categoryId === categories[0]?.id)?.id || products[0]?.id || ''
  );

  const [quantity, setQuantity] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [supplier, setSupplier] = useState<string>('');
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

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setPrice(prod.buyPrice);
      setSupplier(prod.supplierDefault || '');
    }
  };
const qtyNumber = typeof quantity === 'number' && !isNaN(quantity) ? quantity : 0;
  const currentBuyPrice = price !== '' ? Number(price) : (currentProduct?.buyPrice || 0);
  const calculatedTotalBelanja = qtyNumber * currentBuyPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId || !currentProduct) {
      showToast('Silakan pilih produk terlebih dahulu', 'warning');
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      showToast('Jumlah masuk harus lebih besar dari 0', 'warning');
      return;
    }

    const res = addStockIn({
      productId: selectedProductId,
      quantity: qty,
      buyPrice: price !== '' ? Number(price) : undefined,
      supplier: supplier.trim() || undefined,
      note: note.trim() || undefined
});

    if (res.success) {
      showToast(
        `✅ ${qty} ${currentProduct.unit} ${currentProduct.name} berhasil dicatat (${formatRupiah(calculatedTotalBelanja)})`,
        'success'
      );
      setQuantity('');
      setNote('');
    } else {
      showToast(res.message || 'Gagal menambahkan stok masuk', 'error');
    }
  };

  // Total pembelian modal hari ini untuk kategori terpilih
  const categoryTotalPembelian = useMemo(() => {
    return filteredProducts.reduce((acc, p) => {
      const itemDaily = dailyStockList.find((d) => d.productId === p.id);
      const todayInSaved = itemDaily?.stockIn ?? 0;
      const inputQty = (p.id === selectedProductId && qtyNumber > 0) ? qtyNumber : 0;
      const pBuyPrice = (p.id === selectedProductId && price !== '') ? Number(price) : p.buyPrice;
      return acc + ((todayInSaved + inputQty) * pBuyPrice);
    }, 0);
  }, [filteredProducts, dailyStockList, selectedProductId, qtyNumber, price]);

  // History transaksi masuk hari ini untuk kategori ini dengan running balance
  const historyTransactions = useHistoryTransactions(transactions, products, selectedCategoryId, 'in');

  return (
    <div className="w-full space-y-4">

      {/* Page Title */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#7E9F85] flex items-center justify-center shrink-0">
          <PackagePlus className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg sm:text-2xl font-bold text-black tracking-tight">
          Stok masuk
        </h2>
      </div>

      {/* ======================== MOBILE LAYOUT (single column) ======================== */}
      <div className="block lg:hidden space-y-4">
        {/* 1. Pilih Kategori */}
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

        {/* 2. Pilih Produk — large tap targets */}
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
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProduct(p.id)}
                  className={`p-3.5 rounded-xl border text-left min-h-[72px] transition-all active:scale-[0.97] ${
                    isSelected
                      ? 'border-[#7E9F85] bg-[#F2F6F3] ring-1 ring-[#7E9F85]/30'
                      : 'border-neutral-200 bg-neutral-50'
                  }`}
                >
                  <h4 className="font-bold text-black text-sm leading-tight">{p.name}</h4>
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Stok: <strong className="text-neutral-800">{currentStock} {p.unit}</strong>
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

        {/* 3. Form Input */}
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
              Detail Masuk
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Produk Terpilih Info */}
            {currentProduct && (
              <div className="flex items-center gap-3 p-3 bg-[#F2F6F3] rounded-xl border border-[#7E9F85]/20">
                <div className="w-9 h-9 rounded-lg bg-[#7E9F85]/20 flex items-center justify-center shrink-0">
                  <PackagePlus className="w-4 h-4 text-[#527459]" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-black truncate">{currentProduct.name}</p>
                  <p className="text-[11px] text-neutral-500">
                    Stok saat ini:{' '}
                    <strong className="text-neutral-700">
                      {currentDailyStock?.finalStock ?? 0} {currentProduct.unit}
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {/* Jumlah Masuk — large input */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Jumlah masuk ({currentProduct?.unit || 'satuan'})
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="flex-1 bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 h-14 text-xl font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#7E9F85] focus:bg-white"
                />
                <div className="w-16 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-neutral-600 text-sm">
                  {currentProduct?.unit || 'pcs'}
                </div>
              </div>
            </div>

            {/* Harga Beli */}
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-2">
                Harga beli modal / {currentProduct?.unit || 'satuan'} (Rp)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 28000"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 h-12 text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-[#7E9F85] focus:bg-white"
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-2">
                Supplier / peternakan
              </label>
              <SupplierCombobox
                value={supplier}
                onChange={setSupplier}
                placeholder="Pilih atau ketik nama supplier..."
              />
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-2">
                Catatan (opsional)
              </label>
              <input
                type="text"
                placeholder="Nomor nota, kondisi kemasan, dll..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 h-11 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#7E9F85] focus:bg-white"
              />
            </div>

            {/* Total Belanja Realtime */}
            {qtyNumber > 0 && (
              <div className="p-4 rounded-xl bg-[#F2F6F3] border border-[#7E9F85]/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#3E6047] font-medium">
                    {qtyNumber} × {formatRupiah(currentBuyPrice)}
                  </span>
                  <strong className="text-[#2E4F36] text-base">
                    {formatRupiah(calculatedTotalBelanja)}
                  </strong>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full min-h-[52px] rounded-xl bg-[#7E9F85] hover:bg-[#6F8F75] active:scale-[0.98] text-white font-bold text-base transition-all shadow-sm"
            >
              Simpan Stok Masuk
            </button>
          </form>
        </div>
      </div>

      {/* ======================== DESKTOP LAYOUT (two columns) ======================== */}
      <div className="hidden lg:grid grid-cols-12 gap-6">
        {/* LEFT: Pilih Produk + Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pilih Kategori & Produk */}
          <div className="bg-white rounded-2xl p-8 border border-neutral-100 space-y-4">
            <div>
              <span className="text-xs text-neutral-400 font-medium block mb-2.5">
                Pilih kategori barang
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
                Pilih produk yang datang
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

          {/* Form Detail */}
          <div className="bg-white rounded-2xl p-8 border border-neutral-100">
            <h3 className="text-base font-bold text-black mb-4">Rincian kulakan</h3>
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  Jumlah barang masuk ({currentProduct?.unit || 'satuan'})
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    placeholder="Contoh: 50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="flex-1 bg-[#FAFAFA] border border-neutral-200 rounded-2xl px-4 h-12 text-base font-bold text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85] focus:bg-white"
                  />
                  <div className="w-16 rounded-2xl bg-neutral-100 flex items-center justify-center font-bold text-neutral-600 text-xs">
                    {currentProduct?.unit || 'pcs'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">
                    Harga beli modal per {currentProduct?.unit || 'satuan'} (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 28000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">
                    Asal supplier / peternakan
                  </label>
                  <SupplierCombobox
                    value={supplier}
                    onChange={setSupplier}
                    placeholder="Pilih supplier atau ketik nama baru..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">
                  Catatan penerimaan (opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Nomor nota supplier, kondisi kemasan baik..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-2xl px-4 py-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85] focus:bg-white"
                />
              </div>

              {qtyNumber > 0 && (
                <div className="p-4 rounded-2xl bg-[#F2F6F3] border border-[#7E9F85]/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#3E6047] font-medium">
                      Total belanja modal ({qtyNumber} × {formatRupiah(currentBuyPrice)})
                    </span>
                    <strong className="text-[#2E4F36] text-sm">
                      {formatRupiah(calculatedTotalBelanja)}
                    </strong>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-12 rounded-full bg-[#7E9F85] text-white font-bold text-sm"
                >
                  Simpan catatan stok masuk
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: Product summary table */}
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
              <div className="overflow-x-auto rounded-2xl border border-neutral-200/80">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#FAFAFA] text-[11px] font-semibold text-neutral-600 border-b border-neutral-200">
                      <th className="py-3 px-4 text-left font-bold text-neutral-800">Nama barang</th>
                      <th className="py-3 px-3 text-center">Stok</th>
                      <th className="py-3 px-3 text-center text-[#3E6047]">Jumlah masuk</th>
                      <th className="py-3 px-3 text-center">Estimasi stok</th>
                      <th className="py-3 px-4 text-right font-bold text-[#2E4F36] bg-[#EDF3EE]/80">Pembelian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredProducts.map((prod) => {
                      const isSelected = prod.id === selectedProductId;
                      const itemDaily = dailyStockList.find((d) => d.productId === prod.id);
                      const currentStock = itemDaily?.finalStock ?? 0;
                      const todayInSaved = itemDaily?.stockIn ?? 0;
                      const inputQty = isSelected && qtyNumber > 0 ? qtyNumber : 0;
                      const totalInDisplay = todayInSaved + inputQty;
                      const estimasiStok = currentStock + inputQty;
                      const pBuyPrice = (isSelected && price !== '') ? Number(price) : prod.buyPrice;
                      const pembelianTotal = totalInDisplay * pBuyPrice;

                      return (
                        <tr
                          key={prod.id}
                          onClick={() => handleSelectProduct(prod.id)}
                          className={`cursor-pointer ${isSelected ? 'bg-[#F2F6F3] font-medium' : 'hover:bg-neutral-50/80'}`}
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
                          <td className="py-3.5 px-3 text-center font-bold text-[#3E6047]">
                            {totalInDisplay > 0 ? (
                              `${totalInDisplay} ${prod.unit}`
                            ) : (
                              <span className="text-neutral-300 font-normal">0</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold">
                            {estimasiStok} {prod.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#2E4F36] bg-[#EDF3EE]/60">
                            {totalInDisplay > 0 ? (
                              formatRupiah(pembelianTotal)
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
                        Total pembelian hari ini
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#2E4F36] bg-[#EDF3EE] text-sm">
                        {formatRupiah(categoryTotalPembelian)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
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
            <Check className="w-4 h-4 text-[#7E9F85]" />
            <span>Riwayat Masuk - {currentCategory?.name || 'Kategori'}</span>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {historyTransactions.length > 0 ? (
                historyTransactions.map((tx) => {
                  const prod = products.find((p) => p.id === tx.productId);
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
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-[#3E6047] bg-[#EDF3EE] px-2 py-1 rounded-lg">
                          +{tx.quantity} {tx.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-black">
                          {tx.currentBalance} {tx.unit}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400 text-xs">
                    Belum ada barang masuk di kategori ini hari ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
