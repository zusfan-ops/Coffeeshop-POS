import { Product, SaleTransaction } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'COF-ESP',
    name: 'Espresso Solo',
    category: 'Coffee',
    price: 18000,
    cost: 5000,
    stock: 120,
    minStock: 20,
    icon: 'Coffee',
    color: 'amber'
  },
  {
    id: 'prod-2',
    sku: 'COF-AME',
    name: 'Iced Americano',
    category: 'Coffee',
    price: 24000,
    cost: 7000,
    stock: 180,
    minStock: 25,
    icon: 'CupSoda',
    color: 'amber'
  },
  {
    id: 'prod-3',
    sku: 'COF-LAT',
    name: 'Hot Café Latte',
    category: 'Coffee',
    price: 28000,
    cost: 9000,
    stock: 95,
    minStock: 20,
    icon: 'Coffee',
    color: 'amber'
  },
  {
    id: 'prod-4',
    sku: 'COF-MAC',
    name: 'Caramel Macchiato',
    category: 'Coffee',
    price: 34000,
    cost: 11000,
    stock: 65,
    minStock: 15,
    icon: 'GlassWater',
    color: 'amber'
  },
  {
    id: 'prod-5',
    sku: 'COF-ARE',
    name: 'Kopi Susu Gula Aren',
    category: 'Coffee',
    price: 25000,
    cost: 8000,
    stock: 140,
    minStock: 30,
    icon: 'CupSoda',
    color: 'yellow'
  },
  {
    id: 'prod-6',
    sku: 'NCF-MAT',
    name: 'Matcha Latte Premium',
    category: 'Non-Coffee',
    price: 29000,
    cost: 10000,
    stock: 80,
    minStock: 15,
    icon: 'Leaf',
    color: 'emerald'
  },
  {
    id: 'prod-7',
    sku: 'NCF-CHO',
    name: 'Belgian Chocolate Signature',
    category: 'Non-Coffee',
    price: 30000,
    cost: 12000,
    stock: 70,
    minStock: 15,
    icon: 'Cookie',
    color: 'stone'
  },
  {
    id: 'prod-8',
    sku: 'NCF-TEA',
    name: 'Fresh Iced Peach Tea',
    category: 'Non-Coffee',
    price: 22000,
    cost: 6000,
    stock: 110,
    minStock: 20,
    icon: 'Wine',
    color: 'orange'
  },
  {
    id: 'prod-9',
    sku: 'PST-CRO',
    name: 'Butter Croissant XL',
    category: 'Pastry',
    price: 24000,
    cost: 11000,
    stock: 4, // low stock trigger
    minStock: 8,
    icon: 'Cake',
    color: 'amber'
  },
  {
    id: 'prod-10',
    sku: 'PST-MUF',
    name: 'Double Chocolate Muffin',
    category: 'Pastry',
    price: 22000,
    cost: 9500,
    stock: 15,
    minStock: 5,
    icon: 'Cake',
    color: 'stone'
  },
  {
    id: 'prod-11',
    sku: 'PST-CHZ',
    name: 'New York Cheese Cake',
    category: 'Pastry',
    price: 32000,
    cost: 15000,
    stock: 3, // very low stock trigger
    minStock: 6,
    icon: 'Dessert',
    color: 'yellow'
  }
];

// Helper to generate seed transactions relative to today's date (so charts are always populated)
export const getSeedTransactions = (currentDate: Date = new Date()): SaleTransaction[] => {
  const getTodayISO = (hours: number, minutes: number) => {
    const d = new Date(currentDate);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: 'trx-101',
      timestamp: getTodayISO(8, 15),
      items: [
        { productId: 'prod-1', name: 'Espresso Solo', price: 18000, cost: 5000, quantity: 2, subtotal: 36000 },
        { productId: 'prod-9', name: 'Butter Croissant XL', price: 24000, cost: 11000, quantity: 2, subtotal: 48000 }
      ],
      subtotal: 84000,
      tax: 9240, // 11% PPN
      discount: 0,
      total: 93240,
      paymentMethod: 'Debit',
      cashAmount: 0,
      changeAmount: 0,
      cashierName: 'Andi'
    },
    {
      id: 'trx-102',
      timestamp: getTodayISO(9, 45),
      items: [
        { productId: 'prod-3', name: 'Hot Café Latte', price: 28000, cost: 9000, quantity: 1, subtotal: 28000 },
        { productId: 'prod-10', name: 'Double Chocolate Muffin', price: 22000, cost: 9500, quantity: 1, subtotal: 22000 }
      ],
      subtotal: 50000,
      tax: 5500,
      discount: 5000, // Member discount
      total: 50500,
      paymentMethod: 'QRIS',
      cashAmount: 0,
      changeAmount: 0,
      cashierName: 'Siti'
    },
    {
      id: 'trx-103',
      timestamp: getTodayISO(11, 20),
      items: [
        { productId: 'prod-5', name: 'Kopi Susu Gula Aren', price: 25000, cost: 8000, quantity: 3, subtotal: 75000 },
        { productId: 'prod-2', name: 'Iced Americano', price: 24000, cost: 7000, quantity: 1, subtotal: 24000 }
      ],
      subtotal: 99000,
      tax: 10890,
      discount: 0,
      total: 109890,
      paymentMethod: 'Cash',
      cashAmount: 120000,
      changeAmount: 10110,
      cashierName: 'Andi'
    },
    {
      id: 'trx-104',
      timestamp: getTodayISO(13, 0),
      items: [
        { productId: 'prod-6', name: 'Matcha Latte Premium', price: 29000, cost: 10000, quantity: 2, subtotal: 58000 },
        { productId: 'prod-11', name: 'New York Cheese Cake', price: 32000, cost: 15000, quantity: 1, subtotal: 32000 }
      ],
      subtotal: 90000,
      tax: 9900,
      discount: 10000, // Promo diskon
      total: 89900,
      paymentMethod: 'QRIS',
      cashAmount: 0,
      changeAmount: 0,
      cashierName: 'Siti'
    },
    {
      id: 'trx-105',
      timestamp: getTodayISO(14, 35),
      items: [
        { productId: 'prod-4', name: 'Caramel Macchiato', price: 34000, cost: 11000, quantity: 1, subtotal: 34000 },
        { productId: 'prod-7', name: 'Belgian Chocolate Signature', price: 30000, cost: 12000, quantity: 1, subtotal: 30000 }
      ],
      subtotal: 64000,
      tax: 7040,
      discount: 0,
      total: 71040,
      paymentMethod: 'Cash',
      cashAmount: 100000,
      changeAmount: 28960,
      cashierName: 'Andi'
    }
  ];
};
