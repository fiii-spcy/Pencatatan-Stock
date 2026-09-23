import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface LowStockAlertBannerProps {
  onQuickRestock: (productId: string) => void;
  onFilterLowStockOnly: () => void;
}

export const LowStockAlertBanner: React.FC<LowStockAlertBannerProps> = ({
  onQuickRestock,
  onFilterLowStockOnly,
}) => {
  const { dailyStockList } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);

  const outOfStockItems = dailyStockList.filter((item) => item.isOutOfStock);
  const lowStockItems = dailyStockList.filter((item) => item.isLowStock && !item.isOutOfStock);

  if (isDismissed || (outOfStockItems.length === 0 && lowStockItems.length === 0)) {
    return null;
  }

  const hasUrgentEmergency = outOfStockItems.length > 0;
  const targetProduct = outOfStockItems[0] || lowStockItems[0];

  return (
    <div className="bg-white rounded-2xl p-4 border border-neutral-100">
      <div className="flex items-start gap-3">
        <span
          className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
            hasUrgentEmergency ? 'bg-rose-500' : 'bg-[#7E9F85]'
          }`}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-black">
            {hasUrgentEmergency ? 'Stok habis' : 'Stok menipis'}
          </h3>
          <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
            {hasUrgentEmergency
              ? `${outOfStockItems.map((p) => p.productName).join(', ')} sudah habis.`
              : `${lowStockItems.length} produk di bawah batas minimum.`}
          </p>

          <div className="mt-3 space-y-2">
            {hasUrgentEmergency && targetProduct && (
              <button
                type="button"
                onClick={() => onQuickRestock(targetProduct.productId)}
                className="w-full min-h-11 rounded-full bg-rose-600 text-white font-semibold text-sm"
              >
                Restock {targetProduct.productName}
              </button>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onFilterLowStockOnly}
                className="flex-1 min-h-11 rounded-full bg-neutral-900 text-white font-semibold text-sm"
              >
                Lihat daftar
              </button>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="min-h-11 px-4 rounded-full bg-neutral-100 text-neutral-700 font-medium text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
