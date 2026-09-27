import { Category, Product, StockTransaction, User } from '../types';

export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Admin Utama',
    role: 'admin',
    email: 'sstelursembako@gmail.com',
    password: 'Sstelur09',
    phone: '',
    pin: '1234',
    active: true,
    avatarColor: 'bg-slate-900',
    createdAt: '2026-01-01',
  }
];

// Generate seed transactions for today
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_TRANSACTIONS: StockTransaction[] = [];
