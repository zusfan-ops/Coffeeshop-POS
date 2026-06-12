export type ProductCategory = 'Coffee' | 'Non-Coffee' | 'Pastry' | 'Other';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  price: number; // Selling price (e.g., 28000)
  cost: number;  // Cost price (e.g., 10000) for calculating profit
  stock: number;
  minStock: number; // Warning threshold when stock goes low
  icon: string;     // Name of Lucide icon to display
  color: string;    // Accent color class (for beautiful visual cards)
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface TransactionItem {
  productId: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  subtotal: number;
}

export interface SaleTransaction {
  id: string;
  timestamp: string; // ISO 8601 string
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  discount: number; // discount amount in IDR
  total: number;
  paymentMethod: 'Cash' | 'QRIS' | 'Debit';
  cashAmount: number;
  changeAmount: number;
  cashierName: string;
}

export interface DashboardStats {
  totalSales: number;
  totalProfit: number;
  transactionCount: number;
  orderAverage: number;
  lowStockCount: number;
}
