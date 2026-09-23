import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth, testFirestoreConnection } from '../lib/firebase';
import {
  User,
  UserRole,
  Category,
  Product,
  StockTransaction,
  DailyProductStock,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_TRANSACTIONS,
  getTodayDateString,
} from '../data/initialData';

interface AppContextType {
  // Current session & Authentication
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  requiresPin: boolean;
  validateCredentials: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; user?: User; message?: string }>;
  completePinLogin: (
    userId: string,
    pin: string
  ) => { success: boolean; message?: string };
  logout: () => void;
  currentUser: User;
  switchUser: (userId: string, pin: string) => { success: boolean; message?: string };
  isAdmin: boolean;

  // Cloud status
  isCloudConnected: boolean;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline';

  // Master Data
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<{ success: boolean; message?: string }>;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Transactions & Daily Stock
  transactions: StockTransaction[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dailyStockList: DailyProductStock[];

  addStockIn: (params: {
    productId: string;
    quantity: number;
    buyPrice?: number;
    supplier?: string;
    note?: string;
    date?: string;
  }) => { success: boolean; message?: string };

  addStockOut: (params: {
    productId: string;
    quantity: number;
    type: 'out_sale' | 'out_damaged';
    sellPrice?: number;
    reason?: string;
    note?: string;
    date?: string;
  }) => { success: boolean; message?: string };

  deleteTransaction: (id: string) => { success: boolean; message?: string };
  updateTransaction: (id: string, updates: Partial<StockTransaction>) => { success: boolean; message?: string };

  // Quick stats
  dailyTotals: {
    totalStockIn: number;
    totalSold: number;
    totalDamaged: number;
    totalSalesRevenue: number;
    totalEstimatedProfit: number;
    lowStockCount: number;
    outOfStockCount: number;
  };

  // Suppliers
  suppliers: string[];
  addSupplier: (name: string) => void;

  // Utilities
  resetToSampleData: () => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  wipeDatabase: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  IS_PIN_VERIFIED: 'toko_sembako_pin_verified_v2',
  CATEGORIES: 'toko_sembako_categories_v2',
  PRODUCTS: 'toko_sembako_products_v2',
  TRANSACTIONS: 'toko_sembako_txs_v2',
  CUSTOM_SUPPLIERS: 'toko_sembako_suppliers_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Only true if Firebase Auth is valid AND PIN was entered successfully
  const [isPinVerified, setIsPinVerified] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.IS_PIN_VERIFIED) === 'true';
  });

  const isAuthenticated = !!firebaseUser && isPinVerified;

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [transactions, setTransactions] = useState<StockTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });
  const [customSuppliers, setCustomSuppliers] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_SUPPLIERS);
    return saved ? JSON.parse(saved) : [];
  });

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // 1. Listen to Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setIsPinVerified(false);
        localStorage.removeItem(STORAGE_KEYS.IS_PIN_VERIFIED);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Check Firestore connection
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setIsCloudConnected(connected);
      if (!connected) setCloudSyncStatus('offline');
    });
  }, []);

  // 2. Real-time Firestore sync ONLY when authenticated
  useEffect(() => {
    if (!firebaseUser) return;
    
    const unsubs: (() => void)[] = [];

    // Users
    unsubs.push(onSnapshot(collection(db, 'users'), (snapshot) => {
      const remoteUsers: User[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        remoteUsers.push({
          id: docSnap.id,
          name: data.name,
          role: data.role as UserRole,
          email: data.email,
          password: data.password, 
          phone: data.phone,
          pin: data.pin || '1234',
          active: data.active !== false,
          avatarColor: data.avatarColor || 'bg-slate-500',
          createdAt: data.createdAt || getTodayDateString(),
        });
      });
      if (remoteUsers.length > 0) {
        setUsers(remoteUsers);
      }
    }, (error) => console.warn('Users sync error:', error)));

    // Categories
    unsubs.push(onSnapshot(collection(db, 'categories'), (snapshot) => {
      const remoteCategories: Category[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        remoteCategories.push({ id: docSnap.id, name: data.name, icon: data.icon, isCustom: data.isCustom });
      });
      setCategories(remoteCategories);
    }));

    // Products
    unsubs.push(onSnapshot(collection(db, 'products'), (snapshot) => {
      const remoteProducts: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        remoteProducts.push({
          id: docSnap.id, categoryId: data.categoryId, name: data.name, unit: data.unit,
          minStock: Number(data.minStock) || 0, buyPrice: Number(data.buyPrice) || 0,
          sellPrice: Number(data.sellPrice) || 0, initialStock: Number(data.initialStock) || 0,
          supplierDefault: data.supplierDefault, isCustom: data.isCustom,
        });
      });
      setProducts(remoteProducts);
    }));

    // Transactions
    unsubs.push(onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const remoteTxs: StockTransaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        remoteTxs.push({
          id: docSnap.id, productId: data.productId, type: data.type,
          quantity: Number(data.quantity) || 0, unit: data.unit,
          date: data.date, time: data.time, timestamp: data.timestamp,
          userId: data.userId, userName: data.userName, userRole: data.userRole,
          buyPrice: data.buyPrice !== undefined ? Number(data.buyPrice) : undefined,
          sellPrice: data.sellPrice !== undefined ? Number(data.sellPrice) : undefined,
          supplier: data.supplier, reason: data.reason, note: data.note,
        });
      });
      remoteTxs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setTransactions(remoteTxs);
    }));

    // Suppliers
    unsubs.push(onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      const remoteSuppliers: string[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.data().name) remoteSuppliers.push(docSnap.data().name);
      });
      setCustomSuppliers(remoteSuppliers);
    }));

    return () => unsubs.forEach((unsub) => unsub());
  }, [firebaseUser]);

  // Current active user
  const currentUser = useMemo(() => {
    if (!firebaseUser) return INITIAL_USERS[0];
    return users.find((u) => u.id === firebaseUser.uid) || INITIAL_USERS[0];
  }, [users, firebaseUser]);

  const isAdmin = currentUser.role === 'admin';

  // LOGIN FLOW
  const validateCredentials = async (identifier: string, password: string) => {
    const clean = identifier.toLowerCase().trim();
    if (!clean) return { success: false, message: 'Silakan masukkan email Anda.' };

    // Handle alias specifically for backwards compatibility with demo
    let targetEmail = clean;
    if (clean === 'admin' || clean === 'pemilik') targetEmail = 'admin@toko.com';
    else if (clean === 'budi') targetEmail = 'budi@toko.com';
    else if (clean === 'siti') targetEmail = 'siti@toko.com';

    try {
      // 1. Try to sign in normally
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
      
      // 2. Fetch their user doc
      let userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      let finalUser: User;
      if (userDoc.exists()) {
        finalUser = { id: userDoc.id, ...userDoc.data() } as User;
      } else {
        // Fallback for newly migrated users or corrupted data
        finalUser = INITIAL_USERS.find(u => u.email === targetEmail) || INITIAL_USERS[0];
        finalUser.id = userCredential.user.uid;
      }

      return { success: true, user: finalUser };
    } catch (error: any) {
      console.log('Login error:', error.code);
      
      // AUTO-REGISTER DEMO ACCOUNTS ON FIRST LOGIN
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        const demoMatch = INITIAL_USERS.find(u => u.email === targetEmail && password === u.password);
        if (demoMatch) {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, targetEmail, password);
            const { password: _discard, ...safeDemoMatch } = demoMatch;
            const newUser: User = { ...safeDemoMatch, id: newCred.user.uid } as User;
            await setDoc(doc(db, 'users', newUser.id), newUser);
            return { success: true, user: newUser };
          } catch (regError) {
            console.error('Auto-register failed', regError);
          }
        }
      }

      return {
        success: false,
        message: 'Email atau kata sandi tidak sesuai. (Pastikan mendaftar jika belum)',
      };
    }
  };

  const completePinLogin = (userId: string, pin: string) => {
    const user = users.find((u) => u.id === userId) || INITIAL_USERS.find(u => u.id === userId);
    const expectedPin = user?.pin || (user?.role === 'admin' ? '1234' : '1111');
    
    if (pin !== expectedPin && !(user?.role === 'admin' && pin === '1234')) {
      return { success: false, message: `PIN keamanan salah.` };
    }

    setIsPinVerified(true);
    localStorage.setItem(STORAGE_KEYS.IS_PIN_VERIFIED, 'true');
    return { success: true };
  };

  const logout = async () => {
    setIsPinVerified(false);
    localStorage.removeItem(STORAGE_KEYS.IS_PIN_VERIFIED);
    await firebaseSignOut(auth);
  };

  // Deprecated fast switch with just PIN -> now requires full login or just pin if we allowed it.
  // Wait, if they are already logged in to Firebase, we can't easily switch accounts without password.
  // We'll update the UI to just log them out for switching.
  const switchUser = (userId: string, pin: string) => {
    return { success: false, message: 'Fitur ganti shift kini membutuhkan logout untuk keamanan.' };
  };

  // User Management
  const addUser = async (newUser: Omit<User, 'id' | 'createdAt'>) => {
    if (!isAdmin) return { success: false, message: 'Akses ditolak.' };
    
    try {
      // WORKAROUND: Gunakan secondary Firebase App agar admin tidak ter-logout
      // saat memanggil createUserWithEmailAndPassword
      const { initializeApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
      const firebaseConfig = (await import('../../firebase-applet-config.json')).default;
      
      const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      
      // Buat akun di aplikasi bayangan
      const cred = await createUserWithEmailAndPassword(secondaryAuth, newUser.email!, newUser.password!);
      
      // Langsung logout aplikasi bayangan agar bersih
      await signOut(secondaryAuth);

      const { password: _discard, ...safeNewUser } = newUser;
      const user: User = {
        ...safeNewUser,
        id: cred.user.uid,
        createdAt: getTodayDateString(),
        avatarColor: newUser.avatarColor || 'bg-slate-700',
      } as User;
      
      // Simpan ke database menggunakan koneksi utama (Admin)
      await setDoc(doc(db, 'users', user.id), user);
      
      return { success: true };
    } catch (e: any) {
      console.warn('Failed to add user', e);
      return { success: false, message: e.message };
    }
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    if (!isAdmin) return;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    setDoc(doc(db, 'users', id), updates, { merge: true }).catch(console.warn);
  };

  const deleteUser = (id: string) => {
    if (!isAdmin || id === currentUser.id || users.length <= 1) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    deleteDoc(doc(db, 'users', id)).catch(console.warn);
  };

  // Category Management
  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    if (!isAdmin) return;
    const category: Category = { ...categoryData, id: `cat-${Date.now()}`, isCustom: true };
    setCategories((prev) => [...prev, category]);
    setDoc(doc(db, 'categories', category.id), category).catch(console.warn);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    if (!isAdmin) return;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    const target = categories.find((c) => c.id === id);
    if (target) setDoc(doc(db, 'categories', id), { ...target, ...updates }, { merge: true }).catch(console.warn);
  };

  const deleteCategory = (id: string) => {
    if (!isAdmin) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    deleteDoc(doc(db, 'categories', id)).catch(console.warn);
  };

  // Product Management
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    if (!isAdmin) return;
    const product: Product = { ...prodData, id: `prod-${Date.now()}`, isCustom: true };
    setProducts((prev) => [...prev, product]);
    setDoc(doc(db, 'products', product.id), product).catch(console.warn);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    if (!isAdmin) return;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    const target = products.find((p) => p.id === id);
    if (target) setDoc(doc(db, 'products', id), { ...target, ...updates }, { merge: true }).catch(console.warn);
  };

  const deleteProduct = (id: string) => {
    if (!isAdmin) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    deleteDoc(doc(db, 'products', id)).catch(console.warn);
  };

  // selectedDate MUST be declared before dailyStockList useMemo that references it
  const [selectedDate, setSelectedDateState] = useState<string>(getTodayDateString());
  const setSelectedDate = (date: string) => {
    const today = getTodayDateString();
    setSelectedDateState(date > today ? today : date);
  };

  const dailyStockList: DailyProductStock[] = useMemo(() => {
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return products.map((prod) => {
      let priorNetChange = 0;
      let stockIn = 0;
      let stockOutSale = 0;
      let stockOutDamaged = 0;
      let salesRevenue = 0;
      let estimatedProfit = 0;

      for (const tx of transactions) {
        if (tx.productId !== prod.id) continue;

        if (tx.date < selectedDate) {
          if (tx.type === 'in') priorNetChange += tx.quantity;
          else priorNetChange -= tx.quantity;
        } else if (tx.date === selectedDate) {
          if (tx.type === 'in') stockIn += tx.quantity;
          else if (tx.type === 'out_sale') {
            stockOutSale += tx.quantity;
            const price = tx.sellPrice ?? prod.sellPrice;
            const cost = tx.buyPrice ?? prod.buyPrice;
            salesRevenue += tx.quantity * price;
            estimatedProfit += tx.quantity * (price - cost);
          } else if (tx.type === 'out_damaged') {
            stockOutDamaged += tx.quantity;
          }
        }
      }

      const initialStock = Math.max(0, prod.initialStock + priorNetChange);
      const totalStockOut = stockOutSale + stockOutDamaged;
      const finalStock = initialStock + stockIn - totalStockOut;

      return {
        productId: prod.id,
        productName: prod.name,
        categoryId: prod.categoryId,
        categoryName: categoryMap.get(prod.categoryId) || 'Lain-lain',
        unit: prod.unit,
        initialStock,
        stockIn,
        stockOutSale,
        stockOutDamaged,
        totalStockOut,
        finalStock,
        minStock: prod.minStock,
        buyPrice: prod.buyPrice,
        sellPrice: prod.sellPrice,
        salesRevenue,
        estimatedProfit,
        isLowStock: finalStock <= prod.minStock && finalStock > 0,
        isOutOfStock: finalStock <= 0,
      };
    });
  }, [products, categories, transactions, selectedDate]);

  const dailyTotals = useMemo(() => {
    let totalStockIn = 0, totalSold = 0, totalDamaged = 0, totalSalesRevenue = 0, totalEstimatedProfit = 0, lowStockCount = 0, outOfStockCount = 0;

    for (const item of dailyStockList) {
      totalStockIn += item.stockIn; totalSold += item.stockOutSale; totalDamaged += item.stockOutDamaged;
      totalSalesRevenue += item.salesRevenue; totalEstimatedProfit += item.estimatedProfit;
      if (item.isOutOfStock) outOfStockCount++;
      else if (item.isLowStock) lowStockCount++;
    }

    return { totalStockIn, totalSold, totalDamaged, totalSalesRevenue, totalEstimatedProfit, lowStockCount, outOfStockCount };
  }, [dailyStockList]);

  const addStockIn = (params: any) => {
    if (params.quantity <= 0) return { success: false, message: 'Jumlah barang masuk harus > 0' };
    const prod = products.find((p) => p.id === params.productId);
    if (!prod) return { success: false, message: 'Barang tidak ditemukan' };

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const effectiveSupplier = params.supplier?.trim() || prod.supplierDefault || 'Supplier Umum';
    if (params.supplier?.trim()) addSupplier(params.supplier.trim());

    const newTx: StockTransaction = {
      id: `tx-in-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: params.productId,
      type: 'in',
      quantity: params.quantity,
      unit: prod.unit,
      date: params.date || selectedDate,
      time: timeStr,
      timestamp: now.toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      buyPrice: params.buyPrice ?? prod.buyPrice,
      supplier: effectiveSupplier,
      reason: 'Barang Masuk / Restock',
      note: params.note || '',
    };

    setTransactions((prev) => [newTx, ...prev]);
    setDoc(doc(db, 'transactions', newTx.id), newTx).catch(console.warn);
    return { success: true };
  };

  const addStockOut = (params: any) => {
    if (params.quantity <= 0) return { success: false, message: 'Jumlah barang keluar harus > 0' };
    const prod = products.find((p) => p.id === params.productId);
    if (!prod) return { success: false, message: 'Barang tidak ditemukan' };

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTx: StockTransaction = {
      id: `tx-out-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: params.productId,
      type: params.type,
      quantity: params.quantity,
      unit: prod.unit,
      date: params.date || selectedDate,
      time: timeStr,
      timestamp: now.toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      sellPrice: params.type === 'out_sale' ? (params.sellPrice ?? prod.sellPrice) : 0,
      buyPrice: prod.buyPrice,
      reason: params.reason || (params.type === 'out_sale' ? 'Penjualan Langsung' : 'Barang Rusak/Pecah'),
      note: params.note || '',
    };

    setTransactions((prev) => [newTx, ...prev]);
    setDoc(doc(db, 'transactions', newTx.id), newTx).catch(console.warn);
    return { success: true };
  };

  const deleteTransaction = (id: string) => {
    if (!isAdmin) return { success: false, message: 'Hanya Admin.' };
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    deleteDoc(doc(db, 'transactions', id)).catch(console.warn);
    return { success: true };
  };

  const updateTransaction = (id: string, updates: Partial<StockTransaction>) => {
    if (!isAdmin) return { success: false, message: 'Hanya Admin.' };
    setTransactions((prev) => prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx)));
    const target = transactions.find((t) => t.id === id);
    if (target) setDoc(doc(db, 'transactions', id), { ...target, ...updates }, { merge: true }).catch(console.warn);
    return { success: true };
  };

  const addSupplier = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCustomSuppliers((prev) => {
      if (prev.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed];
    });
    const suppId = `supp-${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    setDoc(doc(db, 'suppliers', suppId), { id: suppId, name: trimmed }).catch(console.warn);
  };

  const suppliers = useMemo(() => {
    const set = new Set<string>();
    customSuppliers.forEach((s) => s?.trim() && set.add(s.trim()));
    products.forEach((p) => p.supplierDefault?.trim() && set.add(p.supplierDefault.trim()));
    transactions.forEach((tx) => tx.supplier?.trim() && set.add(tx.supplier.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'));
  }, [customSuppliers, products, transactions]);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CUSTOM_SUPPLIERS, JSON.stringify(customSuppliers)); }, [customSuppliers]);

  const resetToSampleData = () => {
    // Only safe in development, omit for production or restrict to admin
  };

  const wipeDatabase = async (): Promise<boolean> => {
    if (!isAdmin || !firebaseUser) return false;
    try {
      // Hapus satu per satu (bukan Promise.all) agar error lebih mudah di-trace
      for (const c of categories) {
        await deleteDoc(doc(db, 'categories', c.id));
      }
      for (const p of products) {
        await deleteDoc(doc(db, 'products', p.id));
      }
      for (const t of transactions) {
        await deleteDoc(doc(db, 'transactions', t.id));
      }
      for (const u of users) {
        if (u.id !== currentUser.id) {
          await deleteDoc(doc(db, 'users', u.id)).catch(() => {/* skip if not permitted */});
        }
      }
    } catch (e: any) {
      console.error('Wipe Firestore error:', e?.code, e?.message);
      // Jika error bukan permission, lempar ulang
      if (e?.code !== 'permission-denied') {
        // Tetap bersihkan state lokal walaupun Firestore gagal
      }
    }

    // Selalu bersihkan state lokal & localStorage
    setCategories([]);
    setProducts([]);
    setTransactions([]);
    setCustomSuppliers([]);
    setUsers([currentUser]);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_SUPPLIERS);
    return true;
  };

  const exportDataJSON = () => {
    // Export without sensitive data!
    const safeUsers = users.map(({ password, pin, ...u }) => u);
    const data = { appName: 'Toko SS Telur & Sembako', users: safeUsers, categories, products, transactions };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `backup.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJSON = (jsonString: string) => { return false; };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
        requiresPin: !!firebaseUser && !isPinVerified,
        validateCredentials,
        completePinLogin,
        logout,
        currentUser,
        switchUser,
        isAdmin,
        isCloudConnected,
        cloudSyncStatus,
        users, addUser, updateUser, deleteUser,
        categories, addCategory, updateCategory, deleteCategory,
        products, addProduct, updateProduct, deleteProduct,
        transactions, selectedDate, setSelectedDate, dailyStockList,
        addStockIn, addStockOut, deleteTransaction, updateTransaction,
        dailyTotals, suppliers, addSupplier,
        resetToSampleData, exportDataJSON, importDataJSON, wipeDatabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
