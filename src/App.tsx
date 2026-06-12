import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Clock, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { Product, SaleTransaction } from './types';
import { INITIAL_PRODUCTS, getSeedTransactions } from './data';
import { POSView } from './components/POSView';
import { InventoryView } from './components/InventoryView';
import { DashboardView } from './components/DashboardView';

export default function App() {
  // Navigation active state
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'dashboard'>('pos');
  
  // Shared States (persisted in localStorage)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('cs_pos_products_v1');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => {
    const saved = localStorage.getItem('cs_pos_transactions_v1');
    return saved ? JSON.parse(saved) : getSeedTransactions();
  });

  const [cashierName, setCashierName] = useState<string>('Andi');

  // Real-Time Clock state
  const [timeState, setTimeState] = useState<Date>(new Date());

  // Clock tick interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeState(new Date());
    }, 1000); // Tick every second for premium fidelity!
    return () => clearInterval(timer);
  }, []);

  // Save changes to physical store (real-time sync preservation)
  useEffect(() => {
    localStorage.setItem('cs_pos_products_v1', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('cs_pos_transactions_v1', JSON.stringify(transactions));
  }, [transactions]);

  const handleUpdateProducts = (updated: Product[]) => {
    setProducts(updated);
  };

  const handleAddTransaction = (newTrx: SaleTransaction) => {
    setTransactions((prev) => [newTrx, ...prev]);
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda ingin mereset seluruh data stok dan histori transaksi ke setelan awal?')) {
      localStorage.removeItem('cs_pos_products_v1');
      localStorage.removeItem('cs_pos_transactions_v1');
      setProducts(INITIAL_PRODUCTS);
      setTransactions(getSeedTransactions());
      setActiveTab('pos');
    }
  };

  // Human date format
  const formattedDate = timeState.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Human clock format
  const formattedTime = timeState.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }) + ' WIB';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col font-sans antialiased selection:bg-[#2C1E1A] selection:text-white" id="app-root-frame">
      
      {/* BRANDING TOPBAR INTEGRATION */}
      <header className="bg-[#2C1E1A] text-white p-6 rounded-3xl border-2 border-stone-900 shadow-[6px_6px_0px_0px_rgba(44,30,26,0.2)] sticky top-4 z-40 mx-4 md:mx-8 my-4 flex flex-col md:flex-row justify-between items-center gap-3" id="app-header-nav">
        
        {/* Coffeeshop Title Logo */}
        <div className="flex items-center gap-3" id="header-brand-logo">
          <div className="bg-[#A67B5B] border-2 border-white p-2 text-white rounded-2xl" id="brand-avatar-box">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase italic leading-tight">
              KOPI SENJA // <span className="text-stone-300">POS SYSTEM</span>
            </h1>
            <p className="text-xs text-stone-450 font-mono">STATION ID: BARISTA-01 • {formattedDate.toUpperCase()}</p>
          </div>
        </div>

        {/* Real-Time Live Clock Widget */}
        <div className="flex items-center gap-4 bg-[#1C1210] px-4 py-2 rounded-2xl border-2 border-stone-950 text-xs text-stone-200 font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]" id="header-live-clock">
          <div className="flex items-center gap-1.5" id="clock-date-group">
            <Calendar className="w-3.5 h-3.5 text-[#E5D3B3]" />
            <span className="font-semibold">{formattedDate}</span>
          </div>
          <div className="h-4 w-[1px] bg-stone-700 hidden sm:block" id="clock-separator" />
          <div className="flex items-center gap-1.5" id="clock-time-group">
            <Clock className="w-3.5 h-3.5 text-[#E5D3B3]" />
            <span className="font-extrabold text-white">{formattedTime}</span>
          </div>
        </div>

      </header>

      {/* PRIMARY CONTROLS & CHASSIS CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6" id="app-main-view">
        
        {/* TAB NAVIGATION CHANGER */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-3xl border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(44,30,26,1)]" id="navigation-tabs-box">
          
          <div className="flex flex-wrap gap-2 p-1 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200" id="navigation-tabs-list">
            {[
              { id: 'pos', label: 'Mesin Kasir (POS)', icon: ShoppingBag },
              { id: 'inventory', label: 'Kelola Stok', icon: Package },
              { id: 'dashboard', label: 'Laporan Real-Time', icon: TrendingUp },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  id={`nav-tab-${tab.id}`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'pos' | 'inventory' | 'dashboard')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-tight transition-all relative cursor-pointer border-2 ${
                    isActive
                      ? 'bg-[#2C1E1A] text-white border-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]'
                      : 'bg-transparent text-stone-600 border-transparent hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Reset button to default data */}
          <button
            id="reset-raw-db-btn"
            onClick={handleResetData}
            className="text-xs font-black uppercase tracking-wider text-stone-500 hover:text-red-700 px-4 py-2.5 rounded-xl hover:bg-red-50 border-2 border-dashed border-stone-200 hover:border-red-300 transition-all font-sans cursor-pointer whitespace-nowrap"
          >
            Reset Setelan Pabrik
          </button>

        </div>

        {/* TRANSITIONING COMPONENT VIEW-PORT */}
        <div className="flex-1" id="component-viewport">
          <AnimatePresence mode="wait">
            <motion.div
              id={`tab-wrapper-${activeTab}`}
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'pos' && (
                <POSView
                  products={products}
                  onUpdateProducts={handleUpdateProducts}
                  transactions={transactions}
                  onAddTransaction={handleAddTransaction}
                  cashierName={cashierName}
                  onChangeCashier={setCashierName}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryView
                  products={products}
                  onUpdateProducts={handleUpdateProducts}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardView
                  transactions={transactions}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* FOOTER METADATA BRANDING */}
      <footer className="py-6 border-t border-stone-200/50 text-center text-xs text-stone-400 mt-auto font-sans" id="app-footer">
        <p className="font-semibold">Kopi Hari Ini POS & Stok © 2026</p>
        <p className="text-[10px] text-stone-350 mt-1">Didesain dengan perhatian estetika tinggi. Dikompilasi menggunakan Vite + React 19 + Tailwind v4.</p>
      </footer>

    </div>
  );
}
