import { formatRupiah } from '../utils/formatters';
import React, { useState, useMemo } from 'react';
import {
  Boxes,
  PackagePlus,
  PackageMinus,
  TrendingUp,
  Search,
  Clock,
  Archive,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LowStockAlertBanner } from './LowStockAlertBanner';

interface DashboardViewProps {
  onNavigateTab: (tab: 'masuk' | 'keluar' | 'laporan' | 'menu') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const {
    products,
    categories,
    dailyStockList,
    dailyTotals,
    selectedDate,
    currentUser,
    isAdmin,
    transactions
} = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Aggregate totals across all products for selectedDate
  const aggregatedStats = useMemo(() => {
    let totalInitial = 0;
    let totalIn = 0;
    let totalOutSale = 0;
    let totalOutDamaged = 0;
    let totalFinal = 0;

    for (const item of dailyStockList) {
      totalInitial += item.initialStock;
      totalIn += item.stockIn;
      totalOutSale += item.stockOutSale;
      totalOutDamaged += item.stockOutDamaged;
      totalFinal += item.finalStock;
    }

    const totalOut = totalOutSale + totalOutDamaged;

    return {
      totalInitial,
      totalIn,
      totalOutSale,
      totalOutDamaged,
      totalOut,
      totalFinal
};
  }, [dailyStockList]);

  // Filtered daily stock list
  const filteredStockList = useMemo(() => {
    return dailyStockList.filter((item) => {
      const matchCat =
        selectedCategoryFilter === 'all' || item.categoryId === selectedCategoryFilter;
      const matchSearch =
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [dailyStockList, selectedCategoryFilter, searchQuery]);

  // Critical stock items (out of stock items take highest precedence)
  const criticalItems = useMemo(() => {
    return dailyStockList.filter((item) => item.isOutOfStock || item.isLowStock);
  }, [dailyStockList]);

  // Category breakdown for minimalist bar chart
  const categoryChartData = useMemo(() => {
    return categories.map((cat) => {
      const catProducts = dailyStockList.filter((item) => item.categoryId === cat.id);
      const catSold = catProducts.reduce((sum, item) => sum + item.stockOutSale, 0);
      const catStock = catProducts.reduce((sum, item) => sum + item.finalStock, 0);
      return {
        id: cat.id,
        name: cat.name,
        sold: catSold,
        stock: catStock
};
    });
  }, [categories, dailyStockList]);

  const maxCategorySold = useMemo(() => {
    const max = Math.max(...categoryChartData.map((c) => c.sold), 1);
    return max;
  }, [categoryChartData]);

  // Today's recent transactions
  const recentTodayTx = useMemo(() => {
    return transactions.filter((t) => t.date === selectedDate).slice(0, 5);
  }, [transactions, selectedDate]);

  // Format currency
return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* 1. ALERT STOK KRITIS */}
      <LowStockAlertBanner
        onQuickRestock={() => onNavigateTab('masuk')}
        onFilterLowStockOnly={() => setSelectedCategoryFilter('all')}
      />

      {/* 2. STAT CARDS — 2x2 grid on mobile, 4 columns on lg */}
      <div>
        <h2 className="text-base sm:text-2xl font-bold text-black tracking-tight mb-3">
          Status stok
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Stok sekarang */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#7E9F85]/30 ring-1 ring-[#7E9F85]/15">
            <div className="w-8 h-8 rounded-full bg-[#EDF3EE] text-[#527459] flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-bold text-black tracking-tight">
              {aggregatedStats.totalFinal.toLocaleString('id-ID')}
            </div>
            <div className="text-xs font-semibold text-[#44634B] mt-0.5">
              Stok sekarang
            </div>
          </div>

          {/* Masuk */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-100">
            <div className="w-8 h-8 rounded-full bg-[#EDF3EE] text-[#527459] flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-bold text-black tracking-tight">
              {aggregatedStats.totalIn.toLocaleString('id-ID')}
            </div>
            <div className="text-xs font-medium text-neutral-600 mt-0.5">
              Masuk hari ini
            </div>
          </div>

          {/* Keluar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-100">
            <div className="w-8 h-8 rounded-full bg-[#EDF3EE] text-[#527459] flex items-center justify-center">
              <PackageMinus className="w-4 h-4" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-bold text-black tracking-tight">
              {aggregatedStats.totalOut.toLocaleString('id-ID')}
            </div>
            <div className="text-xs font-medium text-neutral-600 mt-0.5">
              Keluar hari ini
            </div>
          </div>

          {/* Stok awal */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-100">
            <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-bold text-black tracking-tight">
              {aggregatedStats.totalInitial.toLocaleString('id-ID')}
            </div>
            <div className="text-xs font-medium text-neutral-600 mt-0.5">
              Stok awal
            </div>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTIONS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={() => onNavigateTab('masuk')}
          className="col-span-1 p-4 sm:p-5 rounded-2xl bg-[#7E9F85] text-white text-left flex items-center justify-between min-h-[80px] active:scale-[0.98] transition-transform"
        >
          <div className="min-w-0 pr-2">
            <span className="text-xs text-white/80 font-medium block">Masuk</span>
            <span className="text-base sm:text-lg font-bold block leading-tight">Catat stok</span>
          </div>
          <PackagePlus className="w-6 h-6 shrink-0 opacity-90" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('keluar')}
          className="col-span-1 p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 text-left flex items-center justify-between min-h-[80px] active:scale-[0.98] transition-transform"
        >
          <div className="min-w-0 pr-2">
            <span className="text-xs text-neutral-400 font-medium block">Keluar</span>
            <span className="text-base sm:text-lg font-bold text-black block leading-tight">Catat stok</span>
          </div>
          <PackageMinus className="w-6 h-6 text-neutral-700 shrink-0" />
        </button>

        {/* Omzet card - full width on mobile, 1 col on md */}
        <div className="col-span-2 md:col-span-1 bg-white rounded-2xl p-4 sm:p-5 border border-neutral-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs text-neutral-400 font-medium">Omzet hari ini</span>
            <div className="text-xl sm:text-2xl font-bold text-black tracking-tight truncate mt-0.5">
              {formatRupiah(dailyTotals.totalSalesRevenue)}
            </div>
            <div className="text-xs text-neutral-400">
              {aggregatedStats.totalOutSale} unit terjual
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#EDF3EE] text-[#527459] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. RECENT TRANSACTIONS (mobile-prominent) */}
      <div className="bg-white rounded-2xl border border-neutral-100">
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-neutral-100">
          <h4 className="text-sm font-bold text-black flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span>Transaksi hari ini</span>
          </h4>
          <button
            type="button"
            onClick={() => onNavigateTab('laporan')}
            className="flex items-center gap-0.5 text-xs text-[#527459] font-bold hover:underline"
          >
            <span>Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-neutral-100 text-xs">
          {recentTodayTx.length === 0 ? (
            <div className="py-10 text-center text-neutral-400 text-xs">
              Belum ada transaksi di tanggal ini.
            </div>
          ) : (
            recentTodayTx.map((tx) => {
              const prod = products.find((p) => p.id === tx.productId);
              const isIn = tx.type === 'in';
              const isSale = tx.type === 'out_sale';

              return (
                <div key={tx.id} className="px-4 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isIn
                            ? 'bg-[#7E9F85]'
                            : isSale
                            ? 'bg-neutral-800'
                            : 'bg-rose-400'
                        }`}
                      />
                      <span className="font-semibold text-black truncate text-xs">
                        {prod?.name || 'Produk'}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 block mt-0.5 ml-4">
                      {tx.time} · {tx.userName}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-xs text-black block">
                      {tx.quantity} {tx.unit}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        isIn ? 'text-[#44634B]' : isSale ? 'text-neutral-500' : 'text-rose-500'
                      }`}
                    >
                      {isIn ? 'Masuk' : isSale ? 'Jual' : 'Rusak'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. BAR CHART + CATALOG — Desktop only */}
      <div className="hidden md:block space-y-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl p-8 border border-neutral-100">
          <div className="flex items-baseline justify-between gap-2 mb-4">
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-black">Penjualan kategori</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Perbandingan barang keluar hari ini
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-bold text-black tracking-tight">
                {aggregatedStats.totalOutSale}
                <span className="text-xs font-normal text-neutral-400 ml-1">unit</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar items-end pt-2 pb-1">
            {categoryChartData.map((item) => {
              const heightPercent =
                maxCategorySold > 0
                  ? Math.max(12, Math.round((item.sold / maxCategorySold) * 100))
                  : 12;
              return (
                <div key={item.id} className="flex flex-col items-center min-w-[64px] flex-1">
                  <span className="text-[11px] font-bold text-black mb-1.5">{item.sold}</span>
                  <div className="w-full bg-[#F2F6F3] rounded-t-xl h-36 flex items-end p-1">
                    <div
                      className="w-full bg-[#7E9F85] rounded-t-lg"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-600 font-medium mt-1.5 text-center truncate w-full">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-neutral-400">Sisa {item.stock}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Catalog */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl p-8 border border-neutral-100">
              <div className="mb-3">
                <h3 className="text-base font-bold text-black">Katalog stok</h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {filteredStockList.length} produk
                </p>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-3">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium shrink-0 ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-[#7E9F85] text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  Semua
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(c.id)}
                    className={`px-3.5 py-2 rounded-full text-xs font-medium shrink-0 ${
                      selectedCategoryFilter === c.id
                        ? 'bg-[#7E9F85] text-white'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="relative mb-4">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full bg-[#F9FAF9] border border-neutral-200 rounded-full pl-10 pr-4 h-11 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredStockList.map((item) => {
                  const stockPercent = Math.min(
                    100,
                    Math.max(0, (item.finalStock / (item.minStock * 2 || 20)) * 100)
                  );
                  const isZeroStock = item.finalStock <= 0;

                  return (
                    <div
                      key={item.productId}
                      className="p-3.5 rounded-2xl border border-neutral-100 bg-[#FAFAFA]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] text-neutral-400 font-medium">
                            {item.categoryName}
                          </span>
                          <h4 className="font-bold text-black text-sm mt-0.5 truncate">
                            {item.productName}
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-bold ${
                              isZeroStock ? 'text-rose-600' : 'text-black'
                            }`}
                          >
                            {item.finalStock} {item.unit}
                          </span>
                          <span
                            className={`block text-[10px] font-medium ${
                              isZeroStock ? 'text-rose-600' : 'text-neutral-500'
                            }`}
                          >
                            {isZeroStock ? 'Habis' : item.isLowStock ? 'Menipis' : 'Aman'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 grid grid-cols-3 gap-1 text-[11px] text-neutral-500">
                        <div>
                          Awal{' '}
                          <span className="font-semibold text-neutral-800">
                            {item.initialStock}
                          </span>
                        </div>
                        <div>
                          Masuk{' '}
                          <span className="font-semibold text-neutral-800">{item.stockIn}</span>
                        </div>
                        <div>
                          Keluar{' '}
                          <span className="font-semibold text-neutral-800">
                            {item.totalStockOut}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 w-full h-1.5 rounded-full bg-neutral-200/70 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isZeroStock
                              ? 'bg-rose-500'
                              : item.isLowStock
                              ? 'bg-[#A8BAA6]'
                              : 'bg-[#7E9F85]'
                          }`}
                          style={{ width: `${Math.max(5, stockPercent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
