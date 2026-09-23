import { useMemo } from 'react';
import { StockTransaction, Product } from '../types';

export const useHistoryTransactions = (
  transactions: StockTransaction[],
  products: Product[],
  selectedCategoryId: string,
  filterType: 'in' | 'out'
) => {
  return useMemo(() => {
    // 1. Sort all chronologically
    const sortedAll = [...transactions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // 2. Compute running balance
    const productBalances: Record<string, number> = {};
    products.forEach((p) => {
      productBalances[p.id] = p.initialStock;
    });

    const enrichedTxs = sortedAll.map((tx) => {
      if (tx.type === 'in') {
        productBalances[tx.productId] += tx.quantity;
      } else {
        productBalances[tx.productId] -= tx.quantity;
      }
      return { ...tx, currentBalance: productBalances[tx.productId] };
    });

    // 3. Filter and sort latest first
    return enrichedTxs
      .filter((t) => {
        const isMatch = filterType === 'in' ? t.type === 'in' : t.type.startsWith('out');
        const prod = products.find((p) => p.id === t.productId);
        return isMatch && prod?.categoryId === selectedCategoryId;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, products, selectedCategoryId, filterType]);
};
