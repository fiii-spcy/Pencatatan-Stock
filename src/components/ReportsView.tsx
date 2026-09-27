import { formatRupiah } from '../utils/formatters';
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayDateString } from '../data/initialData';
import {
  FileText,
  Calendar,
  Download,
  Layers
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    products,
    categories,
    transactions,
    selectedDate,
    isAdmin
} = useApp();

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportDate, setReportDate] = useState<string>(selectedDate);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const dateRange = useMemo(() => {
    if (period === 'daily') {
      return { start: reportDate, end: reportDate };
    }
    
    const [yearStr, monthStr, dayStr] = reportDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (period === 'weekly') {
      const start = new Date(year, month - 1, day);
      start.setDate(start.getDate() - 6);
      const startYear = start.getFullYear();
      const startMonth = String(start.getMonth() + 1).padStart(2, '0');
      const startDay = String(start.getDate()).padStart(2, '0');
      
      return {
        start: `${startYear}-${startMonth}-${startDay}`,
        end: reportDate
};
    } else {
      // Bulanan: ambil full 1 bulan
      const lastDay = new Date(year, month, 0).getDate();
      return {
        start: `${yearStr}-${monthStr}-01`,
        end: `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`
};
    }
  }, [period, reportDate]);

  const reportItems = useMemo(() => {
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return products
      .filter((p) => selectedCategory === 'all' || p.categoryId === selectedCategory)
      .map((p) => {
        let priorNet = 0;
        let stockIn = 0;
        let stockOutSale = 0;
        let stockOutDamaged = 0;
        let revenue = 0;
        let cost = 0;

        for (const tx of transactions) {
          if (tx.productId !== p.id) continue;

          if (tx.date < dateRange.start) {
            if (tx.type === 'in') {
              priorNet += tx.quantity;
            } else {
              priorNet -= tx.quantity;
            }
          } else if (tx.date >= dateRange.start && tx.date <= dateRange.end) {
            if (tx.type === 'in') {
              stockIn += tx.quantity;
            } else if (tx.type === 'out_sale') {
              stockOutSale += tx.quantity;
              const isAltSale = tx.note?.includes('[Jual '); const currentAltEquivalent = (p.altSellPrice && p.altUnitConversion) ? (p.altSellPrice * p.altUnitConversion) : null; const sellP = (isAltSale && currentAltEquivalent) ? currentAltEquivalent : p.sellPrice;
              const buyP = p.buyPrice;
              revenue += tx.quantity * sellP;
              cost += tx.quantity * buyP;
            } else if (tx.type === 'out_damaged') {
              stockOutDamaged += tx.quantity;
            }
          }
        }

        const initialStock = Math.max(0, p.initialStock + priorNet);
        const totalStockOut = stockOutSale + stockOutDamaged;
        const finalStock = initialStock + stockIn - totalStockOut;

        return {
          productId: p.id,
          productName: p.name,
          categoryName: categoryMap.get(p.categoryId) || 'Lain-lain',
          unit: p.unit,
          initialStock,
          stockIn,
          stockOutSale,
          stockOutDamaged,
          totalStockOut,
          finalStock,
          minStock: p.minStock,
          revenue,
          cost,
          profit: revenue - cost
};
      });
  }, [products, categories, transactions, dateRange, selectedCategory]);

  const aggregated = useMemo(() => {
    let totalInitial = 0;
    let totalIn = 0;
    let totalSale = 0;
    let totalDamaged = 0;
    let totalOut = 0;
    let totalFinal = 0;
    let totalRevenue = 0;
    let totalProfit = 0;

    for (const item of reportItems) {
      totalInitial += item.initialStock;
      totalIn += item.stockIn;
      totalSale += item.stockOutSale;
      totalDamaged += item.stockOutDamaged;
      totalOut += item.totalStockOut;
      totalFinal += item.finalStock;
      totalRevenue += item.revenue;
      totalProfit += item.profit;
    }

    return {
      totalInitial,
      totalIn,
      totalSale,
      totalDamaged,
      totalOut,
      totalFinal,
      totalRevenue,
      totalProfit
};
  }, [reportItems]);
const handleExportCSV = () => {
    const headers = [
      'Nama Produk',
      'Kategori',
      'Satuan',
      'Stok Awal Toko (Input Sekali)',
      'Stok Masuk',
      'Barang Keluar (Jual)',
      'Barang Keluar (Rusak)',
      'Total Barang Keluar',
      'Stok yang Tersedia Sekarang',
      'Total Omzet (Rp)',
      ...(isAdmin ? ['Estimasi Laba (Rp)'] : []),
    ];

    const rows = reportItems.map((item) => [
      `"${item.productName}"`,
      `"${item.categoryName}"`,
      `"${item.unit}"`,
      item.initialStock,
      item.stockIn,
      item.stockOutSale,
      item.stockOutDamaged,
      item.totalStockOut,
      item.finalStock,
      item.revenue,
      ...(isAdmin ? [item.profit] : []),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `laporan-stok-${period}-${dateRange.start}-sampai-${dateRange.end}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Top products for minimal bar chart
  const topProductsBySales = useMemo(() => {
    return [...reportItems]
      .sort((a, b) => b.stockOutSale - a.stockOutSale)
      .slice(0, 6);
  }, [reportItems]);

  const maxSale = Math.max(...topProductsBySales.map((p) => p.stockOutSale), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-2xl border border-neutral-100 p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-2xl font-bold text-black tracking-tight">
            Laporan stok
          </h2>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 min-h-11 px-6 bg-[#7E9F85] text-white text-sm font-bold rounded-full transition-all hover:bg-[#6F8F75]"
          >
            <Download className="w-4 h-4" />
            Unduh CSV
          </button>
        </div>

        {/* Filter Controls (Sentence Case & Clean Styling) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-100 text-xs">
          <div>
            <label className="block text-xs text-neutral-400 font-medium mb-1.5">
              Periode laporan
            </label>
            <div className="grid grid-cols-3 gap-1 bg-[#FAFAFA] p-1 rounded-2xl border border-neutral-200">
              <button
                type="button"
                onClick={() => setPeriod('daily')}
                className={`py-1.5 rounded-xl text-xs font-semibold text-center transition-colors cursor-pointer ${
                  period === 'daily'
                    ? 'bg-[#7E9F85] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                Harian
              </button>
              <button
                type="button"
                onClick={() => setPeriod('weekly')}
                className={`py-1.5 rounded-xl text-xs font-semibold text-center transition-colors cursor-pointer ${
                  period === 'weekly'
                    ? 'bg-[#7E9F85] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                7 hari
              </button>
              <button
                type="button"
                onClick={() => setPeriod('monthly')}
                className={`py-1.5 rounded-xl text-xs font-semibold text-center transition-colors cursor-pointer ${
                  period === 'monthly'
                    ? 'bg-[#7E9F85] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                }`}
              >
                Bulanan
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 font-medium mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>Tanggal acuan</span>
            </label>
            <input
              type="date"
              value={reportDate}
              max={getTodayDateString()}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-2xl px-4 py-2 text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 font-medium mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              <span>Kategori</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-2xl px-4 py-2 text-xs font-semibold text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85]"
            >
              <option value="all">Semua kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. REKAPITULASI RUMUS */}
      <div className="bg-white rounded-2xl p-4 sm:p-8 border border-neutral-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-black">
              Rekapitulasi total neraca stok
            </h3>
            <p className="text-xs text-neutral-400">
              Periode: {dateRange.start} s/d {dateRange.end}
            </p>
          </div>
          <div className="text-xs text-neutral-400">
            Total omzet: <strong className="text-black text-sm font-bold">{formatRupiah(aggregated.totalRevenue)}</strong>
            {isAdmin && (
              <span className="ml-3">
                Margin laba: <strong className="text-black font-semibold">{formatRupiah(aggregated.totalProfit)}</strong>
              </span>
            )}
          </div>
        </div>

        {/* 4 Clean Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-neutral-100">
            <span className="text-xs text-neutral-400 font-medium block">
              Stok awal toko
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-black mt-2">
              {aggregated.totalInitial.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-neutral-400 block mt-1">
              Diinput sekali
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-neutral-100">
            <span className="text-xs text-neutral-400 font-medium block">
              Barang masuk
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-black mt-2">
              {aggregated.totalIn.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-neutral-400 block mt-1">
              Pasokan supplier
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-neutral-100">
            <span className="text-xs text-neutral-400 font-medium block">
              Barang keluar
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-black mt-2">
              {aggregated.totalOut.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-neutral-400 block mt-1">
              Jual & barang rusak
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#F2F6F3] border border-[#7E9F85]/20">
            <span className="text-xs text-[#527459] font-medium block">
              Stok yang tersedia sekarang
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-black mt-2">
              {aggregated.totalFinal.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-[#45684E] block mt-1">
              Fisik toko saat ini
            </span>
          </div>
        </div>
      </div>

      {/* 3. BAR CHART MINIMALIS: Batang rounded, warna soft, tanpa gridlines berlebihan, angka ringkasan besar di atas chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-black">
              Top produk terlaris
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Grafik barang dengan penjualan tertinggi di periode ini
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl font-bold text-black">
              {aggregated.totalSale} <span className="text-sm font-normal text-neutral-400">unit terjual</span>
            </div>
          </div>
        </div>

        {/* Minimalist Bar Chart */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-6 items-end pt-4 pb-2">
          {topProductsBySales.map((item) => {
            const heightPercent = maxSale > 0 ? Math.max(15, Math.round((item.stockOutSale / maxSale) * 100)) : 15;
            return (
              <div key={item.productId} className="flex flex-col items-center">
                <span className="text-xs font-bold text-black mb-2">
                  {item.stockOutSale} {item.unit}
                </span>
                <div className="w-full bg-[#F2F6F3] rounded-t-2xl h-36 flex items-end p-1">
                  <div
                    className="w-full bg-[#7E9F85] rounded-t-xl transition-all duration-500"
                    style={{ height: `${heightPercent}%` }}
                    title={`${item.productName}: ${item.stockOutSale} terjual`}
                  />
                </div>
                <span className="text-xs text-neutral-700 font-medium mt-2 text-center truncate w-full">
                  {item.productName}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {formatRupiah(item.revenue)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. TABEL LAPORAN LENGKAP */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-black">
            Rincian pergerakan seluruh produk
          </h3>
          <span className="text-xs text-neutral-400">
            {reportItems.length} produk
          </span>
        </div>

        {/* Desktop Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAFAFA] text-[11px] font-semibold text-neutral-400 border-b border-neutral-100">
                <th className="py-3 px-4">Nama produk</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3 text-center">
                  <span>Stok awal toko</span>
                  <span className="block text-[9px] font-normal text-neutral-400">input sekali</span>
                </th>
                <th className="py-3 px-3 text-center">Masuk</th>
                <th className="py-3 px-3 text-center">Terjual</th>
                <th className="py-3 px-3 text-center">Rusak</th>
                <th className="py-3 px-3 text-center">Total keluar</th>
                <th className="py-3 px-3 text-center font-bold text-[#3E6047] bg-[#EDF3EE]">
                  Stok yang tersedia sekarang
                </th>
                <th className="py-3 px-4 text-right">Total omzet</th>
                {isAdmin && <th className="py-3 px-4 text-right">Margin laba</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {reportItems.map((item) => {
                const isZeroStock = item.finalStock <= 0;
                return (
                  <tr key={item.productId} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-black">{item.productName}</td>
                    <td className="py-3 px-3 text-neutral-400">{item.categoryName}</td>
                    <td className="py-3 px-3 text-center text-neutral-600">
                      {item.initialStock} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-black">
                      {item.stockIn}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-black">
                      {item.stockOutSale}
                    </td>
                    <td className="py-3 px-3 text-center text-neutral-600">
                      {item.stockOutDamaged}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-black">
                      {item.totalStockOut}
                    </td>
                    <td className="py-3 px-3 text-center font-bold bg-[#F2F6F3]">
                      <span className={isZeroStock ? 'text-rose-600 font-bold' : 'text-black'}>
                        {item.finalStock} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-black">
                      {formatRupiah(item.revenue)}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right font-semibold text-black">
                        {formatRupiah(item.profit)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#FAFAFA] font-bold border-t border-neutral-200 text-black">
                <td className="py-3.5 px-4" colSpan={2}>Total rekapitulasi</td>
                <td className="py-3.5 px-3 text-center">{aggregated.totalInitial}</td>
                <td className="py-3.5 px-3 text-center">{aggregated.totalIn}</td>
                <td className="py-3.5 px-3 text-center">{aggregated.totalSale}</td>
                <td className="py-3.5 px-3 text-center">{aggregated.totalDamaged}</td>
                <td className="py-3.5 px-3 text-center">{aggregated.totalOut}</td>
                <td className="py-3.5 px-3 text-center bg-[#F2F6F3] font-bold">
                  {aggregated.totalFinal}
                </td>
                <td className="py-3.5 px-4 text-right font-bold">{formatRupiah(aggregated.totalRevenue)}</td>
                {isAdmin && (
                  <td className="py-3.5 px-4 text-right font-bold">
                    {formatRupiah(aggregated.totalProfit)}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
