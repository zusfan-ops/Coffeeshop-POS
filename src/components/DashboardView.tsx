import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Activity, 
  FileText, 
  Receipt, 
  User, 
  CreditCard, 
  QrCode, 
  Coins, 
  Clock, 
  Eye, 
  ArrowUpRight,
  Filter,
  CheckCircle,
  X
} from 'lucide-react';
import { SaleTransaction, ProductCategory } from '../types';

interface DashboardViewProps {
  transactions: SaleTransaction[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ transactions }) => {
  const [selectedTrxForReceipt, setSelectedTrxForReceipt] = useState<SaleTransaction | null>(null);
  const [cashierFilter, setCashierFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');

  // Currency formattor helper
  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter transactions for report logs
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesCashier = cashierFilter === 'All' || t.cashierName === cashierFilter;
      const matchesPayment = paymentFilter === 'All' || t.paymentMethod === paymentFilter;
      return matchesCashier && matchesPayment;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, cashierFilter, paymentFilter]);

  // Real-Time KPIs Computations (relative to filtered or total transactions)
  const stats = useMemo(() => {
    let totalSales = 0;
    let totalProfit = 0; // Net margins
    
    transactions.forEach((t) => {
      totalSales += t.total;
      
      // Compute profit line item cogs subtraction
      let trxCost = 0;
      t.items.forEach((item) => {
        trxCost += (item.cost * item.quantity);
      });
      // Deduct discounts fractionally, add tax (tax isn't real profit, but totalSales includes tax, let's subtract COGS & Tax or just (price-cost)*quantity. Profit = (Subtotal - Discount) - COGS)
      const afterDiscount = t.subtotal - t.discount;
      const profit = afterDiscount - trxCost;
      totalProfit += profit;
    });

    const transactionCount = transactions.length;
    const orderAverage = transactionCount > 0 ? Math.round(totalSales / transactionCount) : 0;

    return {
      totalSales,
      totalProfit,
      transactionCount,
      orderAverage
    };
  }, [transactions]);

  // Hourly chart compilation
  const hourlyData = useMemo(() => {
    // Generate buckets for a typical coffee shop day: 07:00 to 22:00 (increments of 2-hours)
    const buckets = [
      { id: 7, label: '07:00-09:00', total: 0, transaksi: 0 },
      { id: 9, label: '09:00-11:00', total: 0, transaksi: 0 },
      { id: 11, label: '11:00-13:00', total: 0, transaksi: 0 },
      { id: 13, label: '13:00-15:00', total: 0, transaksi: 0 },
      { id: 15, label: '15:00-17:00', total: 0, transaksi: 0 },
      { id: 17, label: '17:00-19:00', total: 0, transaksi: 0 },
      { id: 19, label: '19:00-21:00', total: 0, transaksi: 0 },
      { id: 21, label: '21:00-23:00', total: 0, transaksi: 0 },
    ];

    transactions.forEach((t) => {
      const date = new Date(t.timestamp);
      const hr = date.getHours();

      // Find suitable bucket
      const bucket = buckets.find((b) => hr >= b.id && hr < b.id + 2);
      if (bucket) {
        bucket.total += t.total;
        bucket.transaksi += 1;
      } else if (hr < 7) {
        // Fallback into earliest
        buckets[0].total += t.total;
        buckets[0].transaksi += 1;
      } else {
        // Fallback into latest
        buckets[buckets.length - 1].total += t.total;
        buckets[buckets.length - 1].transaksi += 1;
      }
    });

    return buckets.map(b => ({
      name: b.label,
      'Penjualan (Rp)': b.total,
      'Jumlah Transaksi': b.transaksi
    }));
  }, [transactions]);

  // Category Pie Chart compilation
  const categoryData = useMemo(() => {
    const counts: Record<ProductCategory, number> = {
      'Coffee': 0,
      'Non-Coffee': 0,
      'Pastry': 0,
      'Other': 0
    };

    transactions.forEach((t) => {
      t.items.forEach((item) => {
        // Find category: since we only save name/price/quantity/cost in TransactionItem, let's map back to category
        // In real cases, we can store category in TransactionItem, but let's guess by name or a catalog look up.
        // A simple guess or mapping works perfectly, or we can look up products. 
        // Let's deduce category. If name contains coffee or cappuccino or latte -> Coffee. Matcha or cocoa -> Non-Coffee. Croissant, muffin, cheese cake -> Pastry.
        const nameLower = item.name.toLowerCase();
        if (nameLower.includes('espresso') || nameLower.includes('latte') && !nameLower.includes('matcha') || nameLower.includes('americano') || nameLower.includes('macchiato') || nameLower.includes('kopi')) {
          counts['Coffee'] += item.subtotal;
        } else if (nameLower.includes('matcha') || nameLower.includes('chocolate') || nameLower.includes('tea') || nameLower.includes('peach')) {
          counts['Non-Coffee'] += item.subtotal;
        } else if (nameLower.includes('croissant') || nameLower.includes('muffin') || nameLower.includes('cake') || nameLower.includes('pastry')) {
          counts['Pastry'] += item.subtotal;
        } else {
          counts['Other'] += item.subtotal;
        }
      });
    });

    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        name: key,
        value: value
      }));
  }, [transactions]);

  const COLORS = ['#78350f', '#10b981', '#f97316', '#6b7280']; // amber-900, emerald-500, orange-500, grey-500 matching the brand aesthetics

  // Custom tooltips inside Recharts
  const CustomTooltipIDR = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-stone-900 text-white p-3 rounded-xl shadow-lg border border-stone-850 text-xs font-mono">
          <p className="font-sans font-bold border-b border-stone-800 pb-1 mb-1">{payload[0].payload.name}</p>
          <p className="text-amber-400 font-bold">Sales: {formatIDR(payload[0].value)}</p>
          {payload[1] && <p className="text-stone-300">Trx Count: {payload[1].value}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 h-full min-h-[calc(100vh-140px)]" id="dashboard-root">
      
      {/* REAL-TIME OVERVIEW STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-metric-cards-row">
        
        {/* KPI 1: Total Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-100 shadow-xs flex flex-col justify-between" id="kpi-sales-card">
          <div className="flex items-center justify-between" id="kpi-sales-head">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-widest font-sans">Omzet Hari Ini</span>
            <div className="bg-amber-50 text-amber-900 p-2 rounded-xl border border-amber-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4" id="kpi-sales-body">
            <h3 className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> LIVE REAL-TIME
            </h3>
            <h2 className="text-lg sm:text-2xl font-black text-amber-950 font-mono tracking-tight mt-1">{formatIDR(stats.totalSales)}</h2>
          </div>
        </div>

        {/* KPI 2: Gross Profit margins */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-100 shadow-xs flex flex-col justify-between" id="kpi-profit-card">
          <div className="flex items-center justify-between" id="kpi-profit-head">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-widest font-sans">Profit Bersih</span>
            <div className="bg-emerald-50 text-emerald-900 p-2 rounded-xl border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4" id="kpi-profit-body">
            <p className="text-xs text-stone-400 font-medium">Estimasi (Omzet - HPP)</p>
            <h2 className="text-lg sm:text-2xl font-black text-emerald-700 font-mono tracking-tight mt-1">{formatIDR(stats.totalProfit)}</h2>
          </div>
        </div>

        {/* KPI 3: Transactions Count */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-100 shadow-xs flex flex-col justify-between" id="kpi-trx-card">
          <div className="flex items-center justify-between" id="kpi-trx-head">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-widest font-sans">Total Transaksi</span>
            <div className="bg-stone-50 text-stone-700 p-2 rounded-xl border border-stone-200/50">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4" id="kpi-trx-body">
            <p className="text-xs text-stone-400 font-medium">Pesanan Selesai</p>
            <h2 className="text-lg sm:text-2xl font-black text-stone-800 font-mono tracking-tight mt-1">{stats.transactionCount} Pesanan</h2>
          </div>
        </div>

        {/* KPI 4: Retail basket average */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-100 shadow-xs flex flex-col justify-between" id="kpi-average-card">
          <div className="flex items-center justify-between" id="kpi-avg-head">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-widest font-sans">Rata-rata Keranjang</span>
            <div className="bg-orange-50 text-orange-900 p-2 rounded-xl border border-orange-100">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4" id="kpi-avg-body">
            <p className="text-xs text-stone-400 font-medium">Nilai per Transaksi</p>
            <h2 className="text-lg sm:text-2xl font-black text-stone-850 font-mono tracking-tight mt-1">{formatIDR(stats.orderAverage)}</h2>
          </div>
        </div>

      </div>

      {/* RECHARTS DATA VISUALIZATION GRAPH PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-row">
        
        {/* Chart 1: Daily Revenue hourly bar/area (takes 2/3 width) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-stone-100 shadow-xs flex flex-col h-[350px]" id="hourly-chart-container">
          <div className="flex justify-between items-center mb-4" id="chart-hourly-header">
            <div>
              <h3 className="font-bold text-stone-850 text-sm sm:text-base">Grafik Penjualan Real-Time per Jam</h3>
              <p className="text-stone-400 text-xs font-medium">Histori kasir terakumulasi hari ini ({new Date().toLocaleDateString('id-ID')})</p>
            </div>
          </div>
          
          <div className="flex-1 w-full text-xs font-mono" id="chart-hourly-wrapper">
            {transactions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-stone-400 font-medium">Belum ada transaksi diinputkan.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#78350f" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#78350f" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis dataKey="name" stroke="#a8a29e" />
                  <YAxis stroke="#a8a29e" tickFormatter={(v) => `Rp${v/1000}k`} />
                  <Tooltip content={<CustomTooltipIDR />} />
                  <Area type="monotone" dataKey="Penjualan (Rp)" stroke="#78350f" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Category share pie chart (takes 1/3 width) */}
        <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-xs flex flex-col h-[350px]" id="category-chart-container">
          <h3 className="font-bold text-stone-850 text-sm sm:text-base mb-1" id="chart-cat-title">Kontribusi Kategori Penjualan</h3>
          <p className="text-stone-400 text-xs font-semibold mb-4">Pembagian porsi pendapatan omzet hari ini</p>
          
          <div className="flex-1 flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-4 text-xs" id="chart-cat-wrapper">
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center text-stone-400 text-center flex-1 font-medium">Belum ada data hidangan terjual.</div>
            ) : (
              <>
                <div className="w-40 h-40 shrink-0 relative" id="pie-responsive-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatIDR(value), 'Omzet']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center leading-none pointer-events-none" id="pie-center-stat">
                    <span className="text-stone-400 text-[10px] font-sans font-bold uppercase tracking-wider">Total</span>
                    <span className="text-stone-800 font-mono font-black text-sm mt-1">{formatIDR(stats.totalSales)}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2 w-full max-w-[180px]" id="pie-chart-labels">
                  {categoryData.map((entry, index) => (
                    <div key={entry.name} className="flex justify-between items-center text-xs" id={`pie-label-${entry.name}`}>
                      <div className="flex items-center gap-2 text-stone-650 font-semibold font-sans">
                        <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span>{entry.name}</span>
                      </div>
                      <span className="font-mono font-bold text-stone-800">{formatIDR(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* REPORT LOG LIST OF ALL HISTORIC TRANSACTIONS COMPLETED */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-xs overflow-hidden flex flex-col" id="dashboard-transactions-table-container">
        
        {/* Table Toolbar controls: Filter by cashier & filter by payment */}
        <div className="p-4 bg-stone-50/50 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" id="db-table-toolbar">
          <div>
            <h3 className="font-bold text-stone-850 text-sm sm:text-base">Logs Transaksi Hari Ini</h3>
            <p className="text-stone-400 text-xs font-mono">Daftar transaksi kasir terposting</p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto" id="db-table-filters">
            <div className="flex items-center gap-2 text-xs" id="db-cashier-filter-box">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <select
                id="db-cashier-select-filter"
                className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500/20 text-stone-750 font-bold"
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
              >
                <option value="All">Semua Kasir</option>
                <option value="Andi">Andi Pratama</option>
                <option value="Siti">Siti Aminah</option>
                <option value="Budi">Budi Santoso</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs" id="db-payment-filter-box">
              <select
                id="db-payment-select-filter"
                className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500/20 text-stone-750 font-bold"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="All">Semua Pembayaran</option>
                <option value="Cash">Cash</option>
                <option value="QRIS">QRIS</option>
                <option value="Debit">Debit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions log list */}
        <div className="overflow-x-auto" id="db-table-scroll">
          <table className="w-full text-left border-collapse" id="db-transactions-table">
            <thead>
              <tr className="bg-stone-50/40 border-b border-stone-150 text-stone-500 text-xs font-semibold uppercase font-sans tracking-wider" id="db-table-header-row">
                <th className="py-3.5 px-6">ID Bill</th>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Nama Kasir</th>
                <th className="py-3.5 px-6">Rincian Hidangan</th>
                <th className="py-3.5 px-4 text-center">Metode</th>
                <th className="py-3.5 px-4 text-right">Nilai Tagihan</th>
                <th className="py-3.5 px-6 text-center">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm text-stone-750 font-sans" id="db-table-body">
              {filteredTransactions.length === 0 ? (
                <tr id="empty-db-table-fallback">
                  <td colSpan={7} className="text-center py-10 text-stone-400 font-medium text-xs">
                    Tidak ada log transaksi terekam pada kriteria filter kasir.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const itemsDescr = trx.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
                  const formattedTime = new Date(trx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr id={`db-row-${trx.id}`} key={trx.id} className="hover:bg-stone-50/40 transition-colors">
                      {/* ID bill */}
                      <td className="py-3.5 px-6 font-mono font-bold text-stone-850" id={`db-col-id-${trx.id}`}>
                        {trx.id}
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 font-mono text-stone-400 text-xs" id={`db-col-time-${trx.id}`}>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>{formattedTime}</span>
                        </div>
                      </td>

                      {/* Cashier name */}
                      <td className="py-3.5 px-4 font-medium text-stone-600 font-sans" id={`db-col-cashier-${trx.id}`}>
                        {trx.cashierName}
                      </td>

                      {/* Items descriptions */}
                      <td className="py-3.5 px-6 text-xs text-stone-500 max-w-xs truncate font-sans" id={`db-col-items-${trx.id}`} title={itemsDescr}>
                        {itemsDescr}
                      </td>

                      {/* Payment Method Badge */}
                      <td className="py-3.5 px-4 text-center" id={`db-col-method-${trx.id}`}>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          trx.paymentMethod === 'Cash' ? 'bg-amber-100 text-amber-900' :
                          trx.paymentMethod === 'QRIS' ? 'bg-emerald-100 text-emerald-990 font-black text-emerald-800' :
                          'bg-indigo-100 text-indigo-990 text-indigo-800'
                        }`}>
                          {trx.paymentMethod === 'Cash' && <Coins className="w-2.5 h-2.5" />}
                          {trx.paymentMethod === 'QRIS' && <QrCode className="w-2.5 h-2.5" />}
                          {trx.paymentMethod === 'Debit' && <CreditCard className="w-2.5 h-2.5" />}
                          <span>{trx.paymentMethod}</span>
                        </span>
                      </td>

                      {/* Grand total */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-950" id={`db-col-total-${trx.id}`}>
                        {formatIDR(trx.total)}
                      </td>

                      {/* Actions link to display receipt */}
                      <td className="py-3.5 px-6 text-center" id={`db-col-action-${trx.id}`}>
                        <button
                          id={`db-receipt-btn-${trx.id}`}
                          onClick={() => setSelectedTrxForReceipt(trx)}
                          className="text-stone-400 hover:text-amber-800 inline-flex items-center gap-1 text-xs font-bold bg-neutral-100 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-amber-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Struk</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* POPUP / MODAL: VIEW DETAILED HISTORIC RECEIPT */}
      <AnimatePresence>
        {selectedTrxForReceipt && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="view-receipt-modal-backdrop">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border-t-8 border-amber-900 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
              id="view-receipt-modal-container"
            >
              {/* Receipt Header Style */}
              <div className="text-center flex flex-col items-center border-b border-dashed border-stone-200 pb-4" id="view-rec-branding">
                <Receipt className="w-6 h-6 text-amber-900 mb-1" />
                <h3 className="font-mono font-black text-amber-950 text-base tracking-tight uppercase">KOPI HARI INI</h3>
                <p className="text-stone-400 text-[10px] font-mono">Jl. Senopati Raya No. 45, Jakarta Selatan</p>
              </div>

              {/* Receipt Metadata */}
              <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 border-b border-stone-100 pb-2" id="view-rec-metadata">
                <div>
                  <p>BILL ID: {selectedTrxForReceipt.id}</p>
                  <p>CASHIER: {selectedTrxForReceipt.cashierName}</p>
                </div>
                <div className="text-right">
                  <p>{new Date(selectedTrxForReceipt.timestamp).toLocaleDateString('id-ID')}</p>
                  <p>{new Date(selectedTrxForReceipt.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              {/* Items row list */}
              <div className="space-y-2 border-b border-dashed border-stone-200 py-3 text-xs font-mono text-stone-700 font-sans" id="view-rec-items-yaml">
                {selectedTrxForReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start" id={`view-rec-row-${idx}`}>
                    <div className="flex-1 pr-3">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-stone-500 text-[10px]">{item.quantity} x {formatIDR(item.price)}</p>
                    </div>
                    <span className="font-semibold shrink-0">{formatIDR(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Totals math layout */}
              <div className="space-y-1 text-xs font-mono text-stone-600 border-b border-stone-100 pb-3" id="view-rec-total-breakdown">
                <div className="flex justify-between text-[11px]">
                  <span>Subtotal</span>
                  <span>{formatIDR(selectedTrxForReceipt.subtotal)}</span>
                </div>
                
                {selectedTrxForReceipt.discount > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-600 font-semibold">
                    <span>Diskon</span>
                    <span>-{formatIDR(selectedTrxForReceipt.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-[11px]">
                  <span>PPN 11%</span>
                  <span>{formatIDR(selectedTrxForReceipt.tax)}</span>
                </div>

                <div className="flex justify-between border-t border-stone-200 pt-2 font-black text-amber-950 text-sm">
                  <span>TOTAL BILL</span>
                  <span>{formatIDR(selectedTrxForReceipt.total)}</span>
                </div>
              </div>

              {/* Receipt payment */}
              <div className="space-y-1 text-[10px] font-mono text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-100" id="view-rec-paymethods">
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="font-semibold">{selectedTrxForReceipt.paymentMethod}</span>
                </div>
                {selectedTrxForReceipt.paymentMethod === 'Cash' && (
                  <>
                    <div className="flex justify-between font-medium">
                      <span>Tunai Diberikan:</span>
                      <span>{formatIDR(selectedTrxForReceipt.cashAmount)}</span>
                    </div>
                    <div className="flex justify-between text-stone-800 font-bold">
                      <span>Kembalian:</span>
                      <span>{formatIDR(selectedTrxForReceipt.changeAmount)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Close Button action */}
              <button
                id="receipt-details-close-btn"
                onClick={() => setSelectedTrxForReceipt(null)}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Tutup Jendela Struk</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
