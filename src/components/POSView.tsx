import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  CreditCard, 
  QrCode, 
  Coins, 
  Percent, 
  CheckCircle,
  FileText,
  AlertTriangle,
  X
} from 'lucide-react';
import { Product, CartItem, SaleTransaction, ProductCategory } from '../types';
import { ProductIcon } from './ProductIcon';

interface POSViewProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  transactions: SaleTransaction[];
  onAddTransaction: (transaction: SaleTransaction) => void;
  cashierName: string;
  onChangeCashier: (name: string) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  onUpdateProducts,
  transactions,
  onAddTransaction,
  cashierName,
  onChangeCashier,
}) => {
  // POS States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS' | 'Debit'>('Cash');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState<SaleTransaction | null>(null);

  // Categories
  const categories: (ProductCategory | 'All')[] = ['All', 'Coffee', 'Non-Coffee', 'Pastry', 'Other'];

  // Currency Formatter
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
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Functions
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      
      // Check if trying to add more than available stock
      const currentlyInCart = existingIndex >= 0 ? prevCart[existingIndex].quantity : 0;
      if (currentlyInCart >= product.stock) {
        return prevCart; // Can't add more than physical stock
      }

      if (existingIndex >= 0) {
        const itemCopy = { ...prevCart[existingIndex] };
        itemCopy.quantity += 1;
        const newCart = [...prevCart];
        newCart[existingIndex] = itemCopy;
        return newCart;
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      const index = prevCart.findIndex((item) => item.product.id === productId);
      if (index === -1) return prevCart;

      const item = { ...prevCart[index] };
      const newQuantity = item.quantity + delta;

      // Validate stock limits when adding
      if (delta > 0 && newQuantity > item.product.stock) {
        return prevCart;
      }

      if (newQuantity <= 0) {
        // Remove item
        return prevCart.filter((i) => i.product.id !== productId);
      }

      const newCart = [...prevCart];
      newCart[index] = { ...item, quantity: newQuantity };
      return newCart;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountPercent(0);
  };

  // Cart Computations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Math.round((subtotal * discountPercent) / 100);
  }, [subtotal, discountPercent]);

  const taxAmount = useMemo(() => {
    return Math.round(((subtotal - discountAmount) * 11) / 100); // 11% PPN in Indonesia
  }, [subtotal, discountAmount]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + taxAmount);
  }, [subtotal, discountAmount, taxAmount]);

  // Cash suggestions for cash payment
  const cashSuggestions = useMemo(() => {
    if (total <= 0) return [];
    
    const bills = [20000, 50000, 100000, 200000];
    const uniqueSuggestions = new Set<number>();
    
    // Add exact amount
    uniqueSuggestions.add(total);
    
    // Add standard bills higher than total
    bills.forEach((bill) => {
      if (bill > total) {
        uniqueSuggestions.add(bill);
      }
    });

    // Add combinations if total is higher than highest bill
    if (total > 100000) {
      const nextHundreths = Math.ceil(total / 50000) * 50000;
      uniqueSuggestions.add(nextHundreths);
      const nextFifty = Math.ceil(total / 100000) * 100000;
      uniqueSuggestions.add(nextFifty);
    }

    return Array.from(uniqueSuggestions).sort((a, b) => a - b).slice(0, 4);
  }, [total]);

  // Handlers for checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashReceived(paymentMethod === 'Cash' ? '' : total.toString());
    setIsCheckoutOpen(true);
  };

  const handleSelectCashSuggestion = (amount: number) => {
    setCashReceived(amount.toString());
  };

  const computedChange = useMemo(() => {
    const cash = parseFloat(cashReceived) || 0;
    return Math.max(0, cash - total);
  }, [cashReceived, total]);

  const isPaymentValid = useMemo(() => {
    if (paymentMethod !== 'Cash') return true;
    const cash = parseFloat(cashReceived) || 0;
    return cash >= total;
  }, [paymentMethod, cashReceived, total]);

  const handleCompleteTransaction = () => {
    if (!isPaymentValid) return;

    // 1. Generate Transaction Data
    const trxId = `TRX-${Date.now().toString().slice(-6)}`;
    const trxItems = cart.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      cost: item.product.cost,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));

    const cash = paymentMethod === 'Cash' ? (parseFloat(cashReceived) || total) : total;
    const change = paymentMethod === 'Cash' ? computedChange : 0;

    const newTransaction: SaleTransaction = {
      id: trxId,
      timestamp: new Date().toISOString(),
      items: trxItems,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      paymentMethod,
      cashAmount: cash,
      changeAmount: change,
      cashierName,
    };

    // 2. Decrement physical stock in global list
    const updatedProducts = products.map((prod) => {
      const cartItem = cart.find((item) => item.product.id === prod.id);
      if (cartItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartItem.quantity),
        };
      }
      return prod;
    });

    onUpdateProducts(updatedProducts);
    onAddTransaction(newTransaction);

    // Save for receipt view, clear cart, close modals
    setShowReceipt(newTransaction);
    setCart([]);
    setDiscountPercent(0);
    setIsCheckoutOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[calc(100vh-140px)]" id="pos-root-container">
      {/* LEFT PANEL: PRODUCTS ARCHITECTURE */}
      <div className="flex-1 flex flex-col gap-4" id="pos-products-panel">
        
        {/* Controls: Search & Cashier Selector */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-5 rounded-3xl border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(44,30,26,1)]" id="pos-filters-container">
          <div className="relative w-full sm:w-80" id="pos-search-wrapper">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-700" />
            <input
              id="pos-search-input"
              type="text"
              placeholder="Cari kopi, pastry, atau SKU..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FDFCF0] border-2 border-stone-900 rounded-xl text-xs font-bold uppercase tracking-tight focus:outline-hidden focus:bg-white transition-all font-sans text-stone-800 placeholder-stone-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                id="clear-search-btn"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-700 hover:text-red-600"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end" id="pos-cashier-selector-wrapper">
            <div className="flex items-center gap-2 bg-[#F2EDE4] border-2 border-stone-900 px-4 py-2 rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(44,30,26,1)]" id="current-cashier-display">
              <User className="w-3.5 h-3.5 text-stone-900" />
              <span className="text-stone-700">Kasir:</span>
              <select
                id="cashier-select"
                className="bg-transparent border-0 py-0 pl-1 pr-6 font-black text-stone-900 focus:ring-0 focus:outline-hidden cursor-pointer"
                value={cashierName}
                onChange={(e) => onChangeCashier(e.target.value)}
              >
                <option value="Andi">Andi Pratama</option>
                <option value="Siti">Siti Aminah</option>
                <option value="Budi">Budi Santoso</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Tab Control */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin" id="pos-categories-tabs">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                id={`cat-tab-${cat}`}
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all scroll-mx-4 border-2 border-stone-900 cursor-pointer ${
                  isActive
                    ? 'bg-[#2C1E1A] text-[#E5D3B3] shadow-[3px_3px_0px_0px_rgba(44,30,26,0.35)]'
                    : 'bg-white text-stone-800 hover:bg-stone-50 hover:translate-y-[-1px]'
                }`}
              >
                {cat === 'All' ? '☕ Semua Menu' : cat === 'Coffee' ? '☕ Coffee' : cat === 'Non-Coffee' ? '🍵 Non-Coffee' : cat === 'Pastry' ? '🥐 Pastry' : '✨ Lainnya'}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="flex-1" id="pos-products-grid-container">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[2rem] border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(44,30,26,1)] min-h-[350px]" id="empty-products-state">
              <div className="w-14 h-14 rounded-2xl bg-[#F2EDE4] border-2 border-stone-900 flex items-center justify-center mb-4 text-stone-700 shadow-[2px_2px_0px_0px_rgba(44,30,26,1)]">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-stone-850 font-black uppercase tracking-tight text-sm text-center">Menu tidak ditemukan</p>
              <p className="text-xs text-stone-500 mt-1 text-center">Coba masukkan kata kunci pencarian baru atau pilih kategori lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5" id="products-grid">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock === 0;
                const isLowStock = product.stock > 0 && product.stock <= product.minStock;
                const inCartItem = cart.find((item) => item.product.id === product.id);
                const isMaxInCart = inCartItem && inCartItem.quantity >= product.stock;

                // Category-specific Bento styling
                const bgClass = isOutOfStock
                  ? 'bg-stone-100'
                  : product.category === 'Coffee'
                    ? 'bg-[#FDFCF0]'
                    : product.category === 'Non-Coffee'
                      ? 'bg-[#F5EAD4]'
                      : product.category === 'Pastry'
                        ? 'bg-[#E5D3B3]'
                        : 'bg-[#F2EDE4]';

                return (
                  <motion.div
                    id={`product-card-${product.id}`}
                    key={product.id}
                    layoutId={`prod-card-anim-${product.id}`}
                    whileHover={!isOutOfStock && !isMaxInCart ? { y: -3 } : {}}
                    whileTap={!isOutOfStock && !isMaxInCart ? { scale: 0.97 } : {}}
                    onClick={() => !isOutOfStock && !isMaxInCart && handleAddToCart(product)}
                    className={`rounded-2xl p-4 border-2 transition-all relative select-none flex flex-col justify-between h-48 cursor-pointer ${bgClass} ${
                      isOutOfStock 
                        ? 'opacity-65 border-stone-400 cursor-not-allowed shadow-none' 
                        : isMaxInCart 
                          ? 'border-amber-600 ring-2 ring-amber-600/10 cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(44,30,26,1)]'
                          : 'border-stone-900 shadow-[3px_3px_0px_0px_rgba(44,30,26,1)] hover:shadow-[5px_5px_0px_0px_rgba(44,30,26,1)]'
                    }`}
                  >
                    {/* Badge Stock Alerts */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end" id={`badges-for-${product.id}`}>
                      {isOutOfStock ? (
                        <span className="bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-md border border-red-400 shadow-xs">
                          HABIS
                        </span>
                      ) : isMaxInCart ? (
                        <span className="bg-[#2C1E1A] text-[#E5D3B3] text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-md border border-stone-900 shadow-xs">
                          MAX DI TROLI
                        </span>
                      ) : isLowStock ? (
                        <span className="bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-md border border-red-300 flex items-center gap-0.5 shadow-xs animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Sisa {product.stock}
                        </span>
                      ) : null}
                    </div>

                    {/* Top: Icon + Title */}
                    <div id={`prod-top-${product.id}`}>
                      <div className={`w-9 h-9 rounded-xl border border-stone-900 flex items-center justify-center mb-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                        product.category === 'Coffee' ? 'bg-[#2C1E1A] text-white' :
                        product.category === 'Non-Coffee' ? 'bg-amber-900 text-amber-100' :
                        product.category === 'Pastry' ? 'bg-amber-700 text-amber-50' :
                        'bg-stone-800 text-white'
                      }`} id={`prod-icon-wrapper-${product.id}`}>
                        <ProductIcon name={product.icon} className="w-4 h-4" />
                      </div>
                      
                      <h4 className="font-extrabold text-[10px] text-stone-500 font-mono tracking-wider" id={`prod-sku-${product.id}`}>{product.sku}</h4>
                      <h3 className="font-black text-stone-900 text-[13px] sm:text-sm mt-1 line-clamp-2 leading-snug uppercase tracking-tight" id={`prod-name-${product.id}`}>{product.name}</h3>
                    </div>

                    {/* Bottom: Price + Cart badge */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-900/10" id={`prod-bottom-${product.id}`}>
                      <span className="font-black text-[#2C1E1A] text-sm sm:text-base font-mono" id={`prod-price-${product.id}`}>
                        {formatIDR(product.price)}
                      </span>
                      
                      {inCartItem && (
                        <div className="bg-[#2C1E1A] text-white w-6 h-6 rounded-full border border-stone-900 flex items-center justify-center text-[10px] font-black shadow-xs" id={`in-cart-count-${product.id}`}>
                          {inCartItem.quantity}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: BILLING CART SIDEBAR */}
      <div className="w-full lg:w-96 flex flex-col bg-[#2C1E1A] text-white rounded-[2rem] border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(44,30,26,1)] overflow-hidden" id="pos-billing-sidebar">
        
        {/* Header order cart */}
        <div className="p-5 border-b-2 border-stone-950 bg-[#1C1210] flex justify-between items-center" id="cart-header">
          <div>
            <h2 className="font-black text-white text-base uppercase italic tracking-tight flex items-center gap-2">
              🛒 Current Order
            </h2>
            <p className="text-[#E5D3B3] text-xs font-mono font-bold tracking-wide">ID: PENDING-TRX</p>
          </div>
          
          {cart.length > 0 && (
            <button
              id="clear-cart-btn"
              onClick={handleClearCart}
              className="text-stone-300 hover:text-red-400 transition-colors flex items-center gap-1 text-xs font-black uppercase tracking-tight px-3 py-1.5 rounded-lg bg-stone-800/60 border border-stone-700 hover:border-red-500 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-[220px]" id="cart-items-container">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 py-12" id="cart-empty-state">
              <div className="bg-[#1C1210] border border-stone-800 p-5 rounded-2xl mb-4 text-[#E5D3B3] shadow-inner flex items-center justify-center">
                <ProductIcon name="Cart" className="w-8 h-8 animate-bounce" />
              </div>
              <p className="text-white font-black uppercase text-sm tracking-tight text-center">Keranjang Kosong</p>
              <p className="text-stone-400 text-xs mt-2 max-w-[200px] text-center">Silakan pilih menu dari sebelah kiri!</p>
            </div>
          ) : (
            <div className="space-y-3" id="cart-items-list-wrapper">
              <AnimatePresence initial={false}>
                {cart.map((item) => (
                  <motion.div
                    id={`cart-item-${item.product.id}`}
                    key={item.product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    className="flex justify-between items-center py-2.5 border-b border-stone-800/80 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1 pr-2" id={`cart-item-detail-${item.product.id}`}>
                      <h4 className="font-black text-white text-xs sm:text-sm truncate uppercase tracking-tight italic">{item.product.name}</h4>
                      <span className="text-[#E5D3B3] font-bold text-xs font-mono">{formatIDR(item.product.price)}</span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0" id={`cart-item-actions-${item.product.id}`}>
                      {/* Controls Area */}
                      <div className="flex items-center bg-[#1C1210] border-2 border-stone-900 rounded-lg p-0.5" id={`quantity-controls-box-${item.product.id}`}>
                        <button
                          id={`qt-minus-btn-${item.product.id}`}
                          onClick={() => handleUpdateQuantity(item.product.id, -1)}
                          className="w-5 h-5 rounded-md hover:bg-stone-800 text-[#E5D3B3] flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        
                        <span className="w-6 text-center font-black text-xs text-white font-mono" id={`quantity-val-display-${item.product.id}`}>
                          {item.quantity}
                        </span>

                        <button
                          id={`qt-plus-btn-${item.product.id}`}
                          onClick={() => handleUpdateQuantity(item.product.id, 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-5 h-5 rounded-md hover:bg-stone-800 text-[#E5D3B3] flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Item Sum */}
                      <span className="w-20 text-right font-black text-xs text-white font-mono" id={`line-sum-${item.product.id}`}>
                        {formatIDR(item.product.price * item.quantity)}
                      </span>

                      {/* Remove Button */}
                      <button
                        id={`remove-item-${item.product.id}`}
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="text-stone-400 hover:text-red-400 p-1"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Calculation Summary Footer */}
        <div className="p-4 bg-[#1C1210] border-t border-stone-900/60 flex flex-col gap-2" id="cart-invoice-calculations">
          
          {/* Subtotal */}
          <div className="flex justify-between items-center text-xs text-stone-300 font-bold uppercase tracking-tight" id="calc-subtotal-row">
            <span>Subtotal</span>
            <span className="font-mono text-[#E5D3B3]">{formatIDR(subtotal)}</span>
          </div>

          {/* Discount Section */}
          <div className="flex flex-col gap-1.5 border-t border-dashed border-stone-800 pt-2 pb-1" id="calc-discount-section">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight" id="discount-labeled-row">
              <span className="text-stone-300 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-[#E5D3B3]" /> Diskon (%)
              </span>
              {discountPercent > 0 && (
                <span className="font-mono text-emerald-400 font-bold">-{formatIDR(discountAmount)}</span>
              )}
            </div>
            
            <div className="flex gap-1 overflow-x-auto pt-1 pb-0.5 scrollbar-none" id="discount-option-pills">
              {[0, 5, 10, 15, 20].map((disc) => {
                const isSelected = discountPercent === disc;
                return (
                  <button
                    id={`disc-pill-${disc}`}
                    key={disc}
                    onClick={() => setDiscountPercent(disc)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-2 ${
                      isSelected
                        ? 'bg-[#A67B5B] text-white border-stone-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white/5 text-stone-300 border-stone-900 hover:bg-white/10'
                    }`}
                  >
                    {disc === 0 ? '0%' : `${disc}%`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tax (PPN 11%) */}
          <div className="flex justify-between items-center text-xs text-[#E5D3B3] font-bold uppercase tracking-tight pt-1" id="calc-tax-row">
            <span>PPN (11%)</span>
            <span className="font-mono">{formatIDR(taxAmount)}</span>
          </div>

          {/* Final Grand Total */}
          <div className="flex justify-between items-center border-t border-stone-800 pt-3" id="calc-grand-total-row">
            <span className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider italic">TOTAL BILL</span>
            <span className="font-mono font-black text-[#E5D3B3] text-lg sm:text-xl" id="cart-grand-total">
              {formatIDR(total)}
            </span>
          </div>
        </div>

        {/* Selected Payment Method */}
        <div className="px-4 py-2.5 border-t-2 border-stone-950 bg-[#1C1210] flex gap-2" id="cart-payment-methods">
          {[
            { id: 'Cash', label: 'Cash', icon: Coins },
            { id: 'QRIS', label: 'QRIS', icon: QrCode },
            { id: 'Debit', label: 'Debit', icon: CreditCard },
          ].map((method) => {
            const MethodIcon = method.icon;
            const isSelected = paymentMethod === method.id;
            return (
              <button
                id={`pay-method-btn-${method.id}`}
                key={method.id}
                onClick={() => setPaymentMethod(method.id as 'Cash' | 'QRIS' | 'Debit')}
                className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-xl border-2 text-[10px] sm:text-xs font-black uppercase tracking-tight gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-stone-950 bg-[#A67B5B] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'border-stone-900 bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <MethodIcon className="w-4 h-4 text-[#E5D3B3]" />
                <span>{method.label}</span>
              </button>
            );
          })}
        </div>

        {/* Big Checkout Button */}
        <div className="p-4 pt-3 border-t-2 border-stone-950 bg-[#1C1210]" id="cart-checkout-action">
          <button
            id="checkout-cta-btn"
            disabled={cart.length === 0}
            onClick={handleOpenCheckout}
            className="w-full bg-[#A67B5B] hover:bg-[#8d674c] text-white border-2 border-stone-950 font-black uppercase text-xs tracking-widest py-3.5 px-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all active:translate-y-[1px] active:shadow-none flex justify-center items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span>Charge Payment ({cart.length} Item)</span>
          </button>
        </div>
      </div>

      {/* POPUP / MODAL: PROCESS INTENTIONAL PAYMENT FOR CASH */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="checkout-modal-backdrop">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[#FAF9F6] rounded-[2rem] max-w-md w-full overflow-hidden shadow-[6px_6px_0px_0px_rgba(44,30,26,1)] border-2 border-stone-900 flex flex-col"
              id="checkout-modal-container"
            >
              {/* Modal Header */}
              <div className="p-5 border-b-2 border-stone-900 flex justify-between items-center bg-[#2C1E1A] text-white" id="checkout-modal-header">
                <div>
                  <h3 className="font-extrabold text-white text-base uppercase tracking-tight italic">Confirm Payment</h3>
                  <p className="text-[#E5D3B3] text-xs font-mono font-bold uppercase">METHOD: {paymentMethod}</p>
                </div>
                <button
                  id="close-checkout-modal"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1 rounded-lg text-stone-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Calculations Body */}
              <div className="p-6 flex-1 flex flex-col gap-4" id="checkout-modal-body">
                
                {/* Total Bill Box */}
                <div className="bg-[#E5D3B3] border-2 border-stone-900 p-4 rounded-2xl flex flex-col items-center justify-center shadow-[3px_3px_0px_0px_rgba(44,30,26,1)]" id="checkout-bill-summary-box">
                  <span className="text-stone-850 text-xs font-black uppercase tracking-wider">TOTAL TAGIHAN</span>
                  <span className="text-[#2C1E1A] font-mono font-black text-2xl mt-1">{formatIDR(total)}</span>
                </div>

                {/* Conditional Cash Handling */}
                {paymentMethod === 'Cash' ? (
                  <div className="flex flex-col gap-4" id="checkout-cash-controls">
                    
                    {/* Amount Input */}
                    <div className="flex flex-col gap-1.5" id="checkout-cash-input-group">
                      <label className="text-xs font-black text-stone-700 uppercase tracking-wide">Uang Tunai Diberikan (Rp):</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-stone-600 text-sm">Rp</span>
                        <input
                          id="checkout-cash-amount-input"
                          type="number"
                          autoFocus
                          placeholder="Masukkan nominal uang tunai..."
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-stone-900 rounded-xl font-mono text-lg font-bold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Quick Cash Selection Bills */}
                    <div className="flex flex-col gap-1.5" id="quick-cash-selections">
                      <span className="text-xs font-black text-stone-500 uppercase tracking-wide">Pilihan Uang Cepat:</span>
                      <div className="grid grid-cols-2 gap-2" id="quick-cash-bills-grid">
                        {cashSuggestions.map((suggestion) => (
                          <button
                            id={`cash-suggest-btn-${suggestion}`}
                            key={suggestion}
                            type="button"
                            onClick={() => handleSelectCashSuggestion(suggestion)}
                            className={`py-2 px-3 rounded-xl border-2 font-mono text-xs font-black transition-all text-center cursor-pointer ${
                              parseFloat(cashReceived) === suggestion
                                ? 'bg-[#A67B5B] text-white border-stone-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                : 'bg-[#FDFCF0] text-[#2C1E1A] hover:bg-[#F5EAD4] border-stone-900 shadow-[2px_2px_0px_0px_rgba(44,30,26,1)]'
                            }`}
                          >
                            {formatIDR(suggestion)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Math Change Output Display */}
                    <div className="bg-[#FDFCF0] border-2 border-stone-900 p-4 rounded-2xl flex justify-between items-center shadow-[2px_2px_0px_0px_rgba(44,30,26,1)]" id="checkout-change-display">
                      <span className="text-xs font-black text-stone-800 uppercase tracking-wide">Kembalian:</span>
                      <span className={`font-mono font-black text-lg ${computedChange > 0 ? 'text-emerald-700' : 'text-stone-700'}`}>
                        {formatIDR(computedChange)}
                      </span>
                    </div>

                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center gap-3 bg-[#FDFCF0] rounded-2xl border-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(44,30,26,1)]" id="checkout-non-cash-helper">
                    <div className="bg-[#E5D3B3] text-stone-900 p-3 h-12 w-12 flex items-center justify-center rounded-xl border-2 border-stone-900">
                      <QrCode className="w-5 h-5 animate-pulse text-stone-900" />
                    </div>
                    <div>
                      <p className="text-[#2C1E1A] font-black uppercase text-sm tracking-tight">Pembayaran QRIS / Debit</p>
                      <p className="text-stone-600 text-xs px-6 mt-1.5 leading-relaxed font-semibold">Harap arahkan mesin EDC/QR Code Merchant kepada pembeli. Tekan selesaikan di bawah setelah berhasil.</p>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Confirm */}
              <div className="p-5 border-t-2 border-stone-900 bg-[#E5D3B3] flex gap-3" id="checkout-modal-footer">
                <button
                  id="checkout-cancel-btn"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-wider bg-[#FAF9F6] border-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(44,30,26,1)] hover:bg-[#F2EDE4] active:translate-y-[1px] active:shadow-none transition-all rounded-xl text-stone-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="checkout-confirm-btn"
                  disabled={!isPaymentValid}
                  onClick={handleCompleteTransaction}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-wider bg-[#A67B5B] hover:bg-[#8d674c] text-white border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(44,30,26,1)] active:translate-y-[1px] active:shadow-none transition-all rounded-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                >
                  Selesaikan {paymentMethod === 'Cash' ? 'Cash' : 'QRIS / Debit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP / MODAL: DIGITAL COFFEE RECEIPT / STRIP COFFEE SHOP STYLE */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="receipt-modal-backdrop">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FAF9F6] rounded-[2rem] max-w-sm w-full p-6 shadow-[6px_6px_0px_0px_rgba(44,30,26,1)] relative border-2 border-stone-900 flex flex-col gap-4 max-h-[90vh] overflow-y-auto text-stone-850"
              id="receipt-modal-container"
            >
              {/* Receipt Header Style */}
              <div className="text-center flex flex-col items-center border-b border-dashed border-stone-300 pb-4" id="receipt-store-branding">
                <div className="bg-[#E5D3B3] text-stone-950 p-2.5 h-12 w-12 flex items-center justify-center rounded-xl border border-stone-900 mb-2">
                  <ProductIcon name="Coffee" className="w-5 h-5 text-stone-900" />
                </div>
                <h3 className="font-mono font-black text-stone-900 text-xl tracking-tight uppercase">KOPI HARI INI</h3>
                <p className="text-stone-500 text-[10px] font-mono font-bold">Jl. Senopati Raya No. 45, Jakarta Selatan</p>
                <p className="text-stone-500 text-[10px] font-mono mt-0.5">Telp. (021) 555-8930</p>
              </div>

              {/* Receipt Metadata Style */}
              <div className="flex justify-between items-center text-[11px] font-mono text-stone-500 border-b border-stone-100 pb-2.5" id="receipt-metadata">
                <div>
                  <p>ID: {showReceipt.id}</p>
                  <p>Cashier: {showReceipt.cashierName}</p>
                </div>
                <div className="text-right">
                  <p>{new Date(showReceipt.timestamp).toLocaleDateString('id-ID')}</p>
                  <p>{new Date(showReceipt.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              {/* Receipt Ordered Products Row */}
              <div className="space-y-2.5 border-b border-dashed border-stone-200 py-3 text-xs font-mono text-stone-700" id="receipt-itemized-rows">
                {showReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start" id={`rec-item-${idx}`}>
                    <div className="flex-1 pr-3">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-stone-500 text-[10px]">{item.quantity} x {formatIDR(item.price)}</p>
                    </div>
                    <span className="font-bold shrink-0">{formatIDR(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Receipt Math Calculation Totals */}
              <div className="space-y-1.5 text-xs font-mono text-stone-600 border-b border-stone-100 pb-3" id="receipt-totals-details">
                <div className="flex justify-between text-[11px]">
                  <span>Subtotal</span>
                  <span>{formatIDR(showReceipt.subtotal)}</span>
                </div>
                
                {showReceipt.discount > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-600 font-bold">
                    <span>Diskon</span>
                    <span>-{formatIDR(showReceipt.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-[11px]">
                  <span>PPN 11%</span>
                  <span>{formatIDR(showReceipt.tax)}</span>
                </div>

                <div className="flex justify-between border-t border-stone-200 pt-2 font-black text-amber-950 text-sm">
                  <span>TOTAL BILL</span>
                  <span>{formatIDR(showReceipt.total)}</span>
                </div>
              </div>

              {/* Cash payment details */}
              <div className="space-y-1 text-[11px] font-mono text-stone-700 bg-[#FDFCF0] p-3 rounded-xl border-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(44,30,26,1)]" id="receipt-payment-breakdown">
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="font-bold uppercase text-stone-900">{showReceipt.paymentMethod}</span>
                </div>
                {showReceipt.paymentMethod === 'Cash' && (
                  <>
                    <div className="flex justify-between border-t border-dashed border-stone-200 mt-1.5 pt-1.5">
                      <span>Uang Bayar:</span>
                      <span>{formatIDR(showReceipt.cashAmount)}</span>
                    </div>
                    <div className="flex justify-between text-[#8d674c] font-black">
                      <span>Kembalian:</span>
                      <span>{formatIDR(showReceipt.changeAmount)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Friendly message */}
              <div className="text-center flex flex-col items-center gap-1.5 pt-2" id="receipt-footer-branding">
                <p className="text-[11px] font-mono text-stone-750 font-bold italic">Terima kasih atas kunjungan Anda!</p>
                <p className="text-[9px] font-mono text-stone-400 font-bold">Software POS Terintegrasi v2.0</p>
              </div>

              {/* Actions container */}
              <div className="mt-4 flex gap-2" id="receipt-modal-actions">
                <button
                  id="receipt-print-btn"
                  onClick={() => alert('Fitur Cetak: Menghubungkan ke Thermal Bluetooth printer local...')}
                  className="flex-1 py-3 px-3 bg-[#FAF9F6] border-2 border-stone-900 text-stone-800 font-black text-[10px] uppercase tracking-wider rounded-xl hover:bg-stone-150 flex items-center justify-center gap-1.5 active:translate-y-[1px] active:shadow-none transition-all shadow-[2px_2px_0px_0px_rgba(44,30,26,1)] cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#A67B5B]" />
                  Cetak Struk
                </button>
                <button
                  id="receipt-done-btn"
                  onClick={() => setShowReceipt(null)}
                  className="flex-1 py-3 px-3 bg-[#A67B5B] hover:bg-[#8d674c] text-white border-2 border-stone-300 font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 active:translate-y-[1px] active:shadow-none transition-all shadow-[2px_2px_0px_0px_rgba(44,30,26,1)] cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                  Selesai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
