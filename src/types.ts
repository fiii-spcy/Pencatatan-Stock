export type UserRole = 'admin' | 'pegawai';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  password?: string;
  phone?: string;
  pin?: string;
  active: boolean;
  avatarColor?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  isCustom?: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  unit: string; // kg, butir, pouch, karung, pcs, dus, botol, pack, peti
  minStock: number; // batas notifikasi stok menipis
  buyPrice: number; // harga beli / modal HPP
  sellPrice: number; // harga jual
  initialStock: number; // stok pembuka sistem
  supplierDefault?: string;
  isCustom?: boolean;
}

export type TransactionType = 'in' | 'out_sale' | 'out_damaged';

export interface StockTransaction {
  id: string;
  productId: string;
  type: TransactionType;
  quantity: number;
  unit: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timestamp: string; // ISO string
  userId: string;
  userName: string;
  userRole: UserRole;
  buyPrice?: number;
  sellPrice?: number;
  supplier?: string;
  reason?: string; // 'Penjualan Langsung', 'Pecah saat muat', 'Busuk/Kadaluarsa', 'Restock Supplier', dll
  note?: string;
}

export interface DailyProductStock {
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  initialStock: number; // Stok awal hari yang dipilih
  stockIn: number;      // Total masuk di hari itu
  stockOutSale: number; // Total terjual di hari itu
  stockOutDamaged: number; // Total rusak/pecah di hari itu
  totalStockOut: number;   // Total keluar (terjual + rusak)
  finalStock: number;   // Stok akhir hari itu = initial + in - out
  minStock: number;
  buyPrice: number;
  sellPrice: number;
  salesRevenue: number; // total omzet terjual
  estimatedProfit: number; // (sellPrice - buyPrice) * stockOutSale
  isLowStock: boolean;
  isOutOfStock: boolean;
}
