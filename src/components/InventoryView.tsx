import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Check, 
  X, 
  RotateCcw,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  Info
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { ProductIcon } from './ProductIcon';

interface InventoryViewProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onUpdateProducts,
}) => {
  // Inventory UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'All'>('All');
  const [stockLevelFilter, setStockLevelFilter] = useState<'All' | 'Low' | 'Out'>('All');
  
  // Create / Edit Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form input bindings
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('Coffee');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCost, setFormCost] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(0);
  const [formMinStock, setFormMinStock] = useState<number>(5);
  const [formIcon, setFormIcon] = useState<string>('Coffee');
  const [formColor, setFormColor] = useState<string>('amber');
  const [formError, setFormError] = useState('');

  // Currency formattor helper
  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
      
      let matchesStock = true;
      if (stockLevelFilter === 'Low') {
        matchesStock = product.stock > 0 && product.stock <= product.minStock;
      } else if (stockLevelFilter === 'Out') {
        matchesStock = product.stock === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, stockLevelFilter]);

  // Handle opening form for Create
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormName('');
    // Auto generate logical SKU
    setFormSku(`COF-${Math.floor(100 + Math.random() * 900)}`);
    setFormCategory('Coffee');
    setFormPrice(25000);
    setFormCost(8000);
    setFormStock(50);
    setFormMinStock(10);
    setFormIcon('Coffee');
    setFormColor('amber');
    setFormError('');
    setIsFormOpen(true);
  };

  // Handle opening form for Edit
  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormSku(product.sku);
    setFormCategory(product.category);
    setFormPrice(product.price);
    setFormCost(product.cost);
    setFormStock(product.stock);
    setFormMinStock(product.minStock);
    setFormIcon(product.icon);
    setFormColor(product.color);
    setFormError('');
    setIsFormOpen(true);
  };

  // Save Add / Edit
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!formName.trim()) {
      setFormError('Nama menu tidak boleh kosong');
      return;
    }
    if (!formSku.trim()) {
      setFormError('Kode SKU tidak boleh kosong');
      return;
    }
    if (formPrice <= 0) {
      setFormError('Harga jual harus lebih besar dari 0');
      return;
    }
    if (formCost < 0) {
      setFormError('Harga modal tidak boleh negatif');
      return;
    }
    if (formCost >= formPrice) {
      // Prompt warning about profit erosion with optional bypass
      setFormError('Peringatan: Harga modal lebih tinggi atau sama dengan harga jual (Gagal Profit)');
      return;
    }
    if (formStock < 0) {
      setFormError('Jumlah stok tidak boleh negatif');
      return;
    }

    // Check SKU Duplicity (except for the editing product itself)
    const skuExists = products.some((p) => p.sku === formSku && (!editingProduct || p.id !== editingProduct.id));
    if (skuExists) {
      setFormError('Kode SKU sudah digunakan oleh produk lain');
      return;
    }

    if (editingProduct) {
      // Edit mode
      const updatedList = products.map((p) => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: formName,
            sku: formSku,
            category: formCategory,
            price: formPrice,
            cost: formCost,
            stock: formStock,
            minStock: formMinStock,
            icon: formIcon,
            color: formColor,
          };
        }
        return p;
      });
      onUpdateProducts(updatedList);
    } else {
      // Create mode
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: formName,
        sku: formSku,
        category: formCategory,
        price: formPrice,
        cost: formCost,
        stock: formStock,
        minStock: formMinStock,
        icon: formIcon,
        color: formColor,
      };
      onUpdateProducts([...products, newProduct]);
    }

    setIsFormOpen(false);
  };

  // Quick Inline Restock adjustment (indonesian "Restok Cepat", say +10 or +50)
  const handleQuickRestock = (productId: string, amount: number) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          stock: Math.max(0, p.stock + amount),
        };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  // Delete product action
  const handleDeleteProduct = (productId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini dari daftar kasir?')) {
      const filtered = products.filter((p) => p.id !== productId);
      onUpdateProducts(filtered);
    }
  };

  // Quick stats computed
  const totalItemsCount = products.length;
  const outOfStockItems = useMemo(() => products.filter((p) => p.stock === 0), [products]);
  const lowStockItems = useMemo(() => products.filter((p) => p.stock > 0 && p.stock <= p.minStock), [products]);

  return (
    <div className="flex flex-col gap-6 font-sans h-full min-h-[calc(100vh-140px)]" id="inventory-root">
      
      {/* QUICK STATUS KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="inventory-kpi-row">
        
        {/* Total Item SKU */}
        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-xs flex items-center justify-between" id="inv-total-card">
          <div className="flex items-center gap-3">
            <div className="bg-stone-50 border border-stone-100 p-2.5 rounded-xl text-stone-700">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium font-sans">Total Menu Terdaftar</p>
              <h3 className="text-xl font-bold text-stone-800 tracking-tight mt-0.5">{totalItemsCount} SKU</h3>
            </div>
          </div>
        </div>

        {/* Low Stock count card */}
        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-xs flex items-center justify-between" id="inv-low-card">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${lowStockItems.length > 0 ? 'bg-orange-50 border border-orange-100 text-orange-700' : 'bg-stone-50 text-stone-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium font-sans">Stok Hampir Habis</p>
              <h3 className={`text-xl font-bold tracking-tight mt-0.5 ${lowStockItems.length > 0 ? 'text-orange-700' : 'text-stone-800'}`}>
                {lowStockItems.length} Menu
              </h3>
            </div>
          </div>
          {lowStockItems.length > 0 && (
            <button
              id="filter-low-btn"
              onClick={() => { setStockLevelFilter('Low'); setCategoryFilter('All'); }}
              className="text-[10px] font-bold text-orange-810 bg-orange-50 hover:bg-orange-100 transition-colors px-2.5 py-1 rounded-lg border border-orange-200"
            >
              Lihat Detail
            </button>
          )}
        </div>

        {/* Out of stock card */}
        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-xs flex items-center justify-between" id="inv-out-card">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${outOfStockItems.length > 0 ? 'bg-red-50 border border-red-100 text-red-700' : 'bg-stone-50 text-stone-400'}`}>
              <Package className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Stok Melompong (Habis)</p>
              <h3 className={`text-xl font-bold tracking-tight mt-0.5 ${outOfStockItems.length > 0 ? 'text-red-700' : 'text-stone-800'}`}>
                {outOfStockItems.length} Menu
              </h3>
            </div>
          </div>
          {outOfStockItems.length > 0 && (
            <button
              id="filter-out-btn"
              onClick={() => { setStockLevelFilter('Out'); setCategoryFilter('All'); }}
              className="text-[10px] font-bold text-red-810 bg-red-50 hover:bg-red-100 transition-colors px-2.5 py-1 rounded-lg border border-red-200"
            >
              Lihat Detail
            </button>
          )}
        </div>

      </div>

      {/* FILTER & OPERATIONS HEADER MODULE */}
      <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center" id="inventory-toolbar">
        
        {/* Left Side: Category filter tabs + stock warning dropdown filter */}
        <div className="flex flex-wrap items-center gap-3" id="inv-toolbar-left">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-64" id="inv-search-wrapper">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              id="inv-search-input"
              type="text"
              placeholder="Cari SKU atau nama produk..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-sans"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category SELECT filter */}
          <select
            id="inv-category-select-filter"
            className="bg-stone-50 border border-stone-200 rounded-xl text-sm py-2 pl-3 pr-8 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-700 font-semibold"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | 'All')}
          >
            <option value="All">Semua Kategori</option>
            <option value="Coffee">☕ Coffee</option>
            <option value="Non-Coffee">🍵 Non-Coffee</option>
            <option value="Pastry">🥐 Pastry</option>
            <option value="Other">🛍️ Lain-lain</option>
          </select>

          {/* Stock state filter */}
          <select
            id="inv-stock-select-filter"
            className="bg-stone-50 border border-stone-200 rounded-xl text-sm py-2 pl-3 pr-8 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-700 font-semibold"
            value={stockLevelFilter}
            onChange={(e) => setStockLevelFilter(e.target.value as 'All' | 'Low' | 'Out')}
          >
            <option value="All">Semua Kondisi Stok</option>
            <option value="Low">⚠️ Stok Tipis (Hampir Habis)</option>
            <option value="Out">❌ Stok Habis</option>
          </select>

          {/* Reset Filters button */}
          {(searchQuery || categoryFilter !== 'All' || stockLevelFilter !== 'All') && (
            <button
              id="reset-all-inv-filters"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('All');
                setStockLevelFilter('All');
              }}
              className="text-stone-400 hover:text-stone-700 flex items-center gap-1 text-xs font-semibold px-2 py-2 hover:bg-stone-100 rounded-xl"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filter
            </button>
          )}

        </div>

        {/* Right Side: Primary CTA Add Product */}
        <button
          id="add-new-product-cta-btn"
          onClick={handleOpenAddProduct}
          className="bg-amber-950 hover:bg-amber-900 text-white font-bold py-2.5 px-5 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-sm cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu Baru</span>
        </button>

      </div>

      {/* CORE PRODUCTS INVENTORY GRID/TABLE */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-xs overflow-hidden" id="inventory-table-container">
        <div className="overflow-x-auto" id="table-scroll-wrapper">
          <table className="w-full text-left border-collapse" id="inventory-data-table">
            <thead>
              <tr className="bg-stone-50/75 border-b border-stone-150 text-stone-500 text-xs font-bold font-sans uppercase tracking-wider" id="table-header-row">
                <th className="py-4 px-6">Produk & SKU</th>
                <th className="py-4 px-4">Kategori</th>
                <th className="py-4 px-4 text-right">Biaya Modal (COGS)</th>
                <th className="py-4 px-4 text-right">Harga Jual</th>
                <th className="py-4 px-4 text-center">Stok Fisik</th>
                <th className="py-4 px-4 text-center">Aksi Manajemen Stok</th>
                <th className="py-4 px-6 text-right">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm text-stone-700 font-sans" id="table-body">
              {filteredProducts.length === 0 ? (
                <tr id="empty-table-fallback">
                  <td colSpan={7} className="text-center py-16 text-stone-500 font-medium">
                    Tidak ada menu yang sesuai dengan filter pencarian stok.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.stock === 0;
                  const isLowStock = product.stock > 0 && product.stock <= product.minStock;

                  return (
                    <tr 
                      id={`inv-row-${product.id}`}
                      key={product.id}
                      className={`hover:bg-stone-50/50 transition-colors ${
                        isOutOfStock ? 'bg-red-50/10' : isLowStock ? 'bg-orange-55/10' : ''
                      }`}
                    >
                      {/* Product SKU and visual icon */}
                      <td className="py-4 px-6" id={`inv-col-product-${product.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            product.category === 'Coffee' ? 'bg-amber-100 text-amber-900' :
                            product.category === 'Non-Coffee' ? 'bg-emerald-100 text-emerald-900' :
                            product.category === 'Pastry' ? 'bg-orange-100 text-orange-900' :
                            'bg-stone-100 text-stone-900'
                          }`} id={`inv-icon-grid-${product.id}`}>
                            <ProductIcon name={product.icon} className="w-4 h-4" />
                          </div>
                          <div className="min-w-0" id={`inv-title-col-${product.id}`}>
                            <h4 className="font-bold text-stone-850 truncate text-[14px]">{product.name}</h4>
                            <p className="text-[10px] text-stone-400 font-mono font-medium tracking-wide leading-none">{product.sku}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-4 px-4" id={`inv-col-category-${product.id}`}>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          product.category === 'Coffee' ? 'bg-amber-100/70 text-amber-900 border border-amber-200/50' :
                          product.category === 'Non-Coffee' ? 'bg-emerald-100/70 text-emerald-900 border border-emerald-200/50' :
                          product.category === 'Pastry' ? 'bg-orange-100/70 text-orange-900 border border-orange-200/50' :
                          'bg-stone-150 text-stone-600 border border-stone-200/50'
                        }`}>
                          {product.category}
                        </span>
                      </td>

                      {/* COGS Modal Biaya */}
                      <td className="py-4 px-4 text-right font-mono font-medium text-stone-500 text-xs" id={`inv-col-cost-${product.id}`}>
                        {formatIDR(product.cost)}
                      </td>

                      {/* Sales Price */}
                      <td className="py-4 px-4 text-right font-mono font-bold text-stone-800" id={`inv-col-price-${product.id}`}>
                        {formatIDR(product.price)}
                      </td>

                      {/* Stock Level Counter */}
                      <td className="py-4 px-4 text-center" id={`inv-col-stock-${product.id}`}>
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-mono font-black text-sm px-2.5 py-1 rounded-lg ${
                            isOutOfStock 
                              ? 'bg-red-100 text-red-800' 
                              : isLowStock 
                                ? 'bg-orange-100 text-orange-850' 
                                : 'text-stone-850'
                          }`}>
                            {product.stock}
                          </span>
                          
                          {/* Low warning tooltip text */}
                          {isOutOfStock && (
                            <span className="text-[9px] text-red-650 font-bold tracking-tight uppercase mt-1">HABIS TOTAL</span>
                          )}
                          {isLowStock && (
                            <span className="text-[9px] text-orange-750 font-bold tracking-tight uppercase mt-1">Limit: {product.minStock}</span>
                          )}
                        </div>
                      </td>

                      {/* Quick Restock Adjust buttons in row */}
                      <td className="py-4 px-4 text-center" id={`inv-col-adjusts-${product.id}`}>
                        <div className="flex items-center justify-center gap-1.5" id={`adjusts-group-${product.id}`}>
                          <button
                            id={`restock-decrease-${product.id}`}
                            title="Kurangi Stok (-1)"
                            onClick={() => handleQuickRestock(product.id, -1)}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded-md text-xs font-bold transition-all"
                          >
                            -1
                          </button>
                          <button
                            id={`restock-10-${product.id}`}
                            title="Tambah Stok (+10)"
                            onClick={() => handleQuickRestock(product.id, 10)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md text-xs font-bold transition-all border border-amber-200"
                          >
                            +10
                          </button>
                          <button
                            id={`restock-50-${product.id}`}
                            title="Restok Besar (+50)"
                            onClick={() => handleQuickRestock(product.id, 50)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md text-xs font-bold transition-all border border-emerald-200"
                          >
                            +50
                          </button>
                        </div>
                      </td>

                      {/* Edit / Delete rows context */}
                      <td className="py-4 px-6 text-right" id={`inv-col-actions-${product.id}`}>
                        <div className="flex items-center justify-end gap-2" id={`inv-actions-wrapper-${product.id}`}>
                          <button
                            id={`inv-edit-row-${product.id}`}
                            onClick={() => handleOpenEditProduct(product)}
                            className="text-stone-400 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                            title="Edit Data SKU"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            id={`inv-delete-row-${product.id}`}
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Hapus Menu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL: ADD / EDIT DIALOG DRAWER */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="form-modal-backdrop">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-100 flex flex-col max-h-[90vh]"
              id="form-modal-container"
            >
              {/* Header */}
              <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50" id="form-header">
                <div>
                  <h3 className="font-bold text-stone-800 text-base">
                    {editingProduct ? 'Ubah Data Menu Kopi/Pastry' : 'Daftarkan Menu Baru'}
                  </h3>
                  <p className="text-stone-500 text-xs">Atur parameter SKU, modal, dan level limit stok minimum.</p>
                </div>
                <button
                  id="close-form-modal-btn"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4" id="inv-form-controls">
                
                {/* Visual Error label */}
                {formError && (
                  <div className="bg-red-50 text-red-800 border border-red-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2" id="form-error-display">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* SKU Code (unique) & category inside a 2-col row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="form-row-1">
                  <div className="flex flex-col gap-1.5" id="form-group-sku">
                    <label className="text-xs font-bold text-stone-600">Kode SKU Produk:</label>
                    <input
                      id="form-input-sku"
                      type="text"
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl font-mono text-sm uppercase text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                      placeholder="Contoh: COF-LAT"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5" id="form-group-category">
                    <label className="text-xs font-bold text-stone-600">Kategori Menu:</label>
                    <select
                      id="form-select-category"
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                    >
                      <option value="Coffee">☕ Coffee</option>
                      <option value="Non-Coffee">🍵 Non-Coffee</option>
                      <option value="Pastry">🥐 Pastry</option>
                      <option value="Other">🛍️ Lain-lain</option>
                    </select>
                  </div>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5" id="form-group-name">
                  <label className="text-xs font-bold text-stone-600">Nama Menu / Produk:</label>
                  <input
                    id="form-input-name"
                    type="text"
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 font-sans"
                    placeholder="Contoh: Hot Vanilla Latte XL"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                {/* Price (Sell) vs Cost (COGS) row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="form-row-2">
                  <div className="flex flex-col gap-1.5" id="form-group-cost">
                    <label className="text-xs font-bold text-stone-600">Biaya Modal (COGS) per Unit (Rp):</label>
                    <input
                      id="form-input-cost"
                      type="number"
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 font-mono"
                      placeholder="Contoh: 8000"
                      value={formCost || ''}
                      onChange={(e) => setFormCost(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5" id="form-group-price">
                    <label className="text-xs font-bold text-stone-600">Harga Jual Kasir (Rp):</label>
                    <input
                      id="form-input-price"
                      type="number"
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 font-mono"
                      placeholder="Contoh: 28000"
                      value={formPrice || ''}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                {/* Initial Stock vs Low Stock warning limits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="form-row-3">
                  <div className="flex flex-col gap-1.5" id="form-group-stock">
                    <label className="text-xs font-bold text-stone-600">Stok Berjalan Saat Ini:</label>
                    <input
                      id="form-input-stock"
                      type="number"
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 font-mono"
                      placeholder="Contoh: 100"
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5" id="form-group-minstock">
                    <label className="text-xs font-bold text-stone-600">Limit Minimum Stok (Peringatan):</label>
                    <input
                      id="form-input-minstock"
                      type="number"
                      className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 font-mono"
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                {/* Graphical Customization (Lucide Icon mapping selection & Theme Color Accent) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-100 pt-4" id="form-visual-customizers">
                  {/* Icon Selector list */}
                  <div className="flex flex-col gap-1.5" id="icon-picker-group">
                    <label className="text-xs font-bold text-stone-600">Pilih Icon Menu visual:</label>
                    <div className="grid grid-cols-4 gap-2 bg-stone-50 p-2 rounded-xl border border-stone-250" id="icon-selector-pills">
                      {['Coffee', 'CupSoda', 'GlassWater', 'Leaf', 'Cookie', 'Cake', 'Wine', 'Sparkles'].map((icName) => (
                        <button
                          key={icName}
                          type="button"
                          id={`icon-pill-${icName}`}
                          onClick={() => setFormIcon(icName)}
                          className={`p-2.5 rounded-lg flex justify-center items-center transition-all cursor-pointer ${
                            formIcon === icName
                              ? 'bg-amber-900 text-white shadow-xs'
                              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-150'
                          }`}
                        >
                          <ProductIcon name={icName} className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color Picker list */}
                  <div className="flex flex-col gap-1.5" id="color-picker-group">
                    <label className="text-xs font-bold text-stone-600">Aksen Warna Kartu:</label>
                    <div className="grid grid-cols-4 gap-2 bg-stone-50 p-2 rounded-xl border border-stone-250" id="color-selector-pills">
                      {[
                        { id: 'amber', bg: 'bg-amber-500' },
                        { id: 'yellow', bg: 'bg-yellow-500' },
                        { id: 'emerald', bg: 'bg-emerald-500' },
                        { id: 'orange', bg: 'bg-orange-550 bg-orange-500' },
                        { id: 'stone', bg: 'bg-stone-500' },
                      ].map((colObj) => (
                        <button
                          key={colObj.id}
                          type="button"
                          id={`color-pill-${colObj.id}`}
                          onClick={() => setFormColor(colObj.id)}
                          className={`h-9 rounded-lg flex items-center justify-center border transition-all cursor-pointer relative ${
                            formColor === colObj.id
                              ? 'border-black ring-2 ring-stone-900/15'
                              : 'border-transparent'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full ${colObj.bg}`} />
                          {formColor === colObj.id && (
                            <Check className="absolute w-3 h-3 text-white pointer-events-none" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Modal Action Buttons inside form */}
                <div className="p-4 border-t border-stone-100 bg-stone-50 -mx-6 -mb-6 flex gap-3 pt-4 px-6 mt-6 justify-end" id="form-actions">
                  <button
                    id="form-cancel-btn"
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="py-2.5 px-4 text-xs font-semibold border border-stone-200 hover:bg-stone-100 rounded-xl text-stone-500 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    id="form-submit-btn"
                    type="submit"
                    className="py-2.5 px-5 text-xs font-bold bg-amber-950 hover:bg-amber-900 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {editingProduct ? 'Simpan Perubahan' : 'Masukkan ke Kasir'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
