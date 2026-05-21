
import { z } from "zod";

export type Role = "admin" | "manager" | "seller";

export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  nom: z.string(),
  prenom: z.string(),
  role: z.enum(["admin", "manager", "seller"]),
  boutiqueIds: z.array(z.string()),
  actif: z.boolean(),
  phone: z.string().optional(),
  photoURL: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const StoreSchema = z.object({
  id: z.string(),
  code: z.string().min(2, "Le code est requis (ex: FI-B1)"),
  name: z.string().min(3, "Le nom est requis"),
  address: z.string().min(5, "L'adresse est requise"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  active: z.boolean().default(true),
  createdAt: z.any().optional(),
});

export type Store = z.infer<typeof StoreSchema>;

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Le nom est requis"),
  parentId: z.string().nullable().default(null),
  description: z.string().optional(),
  active: z.boolean().default(true),
  createdAt: z.any().optional(),
});

export type Category = z.infer<typeof CategorySchema>;

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "Le nom est requis"),
  sku: z.string().min(2, "Le SKU/Référence est requis"),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, "La catégorie est requise"),
  unit: z.string().min(1, "L'unité est requise"),
  conditionnement: z.string().optional(),
  purchasePriceRef: z.number().min(0).default(0),
  sellingPriceFCFA: z.number().min(0),
  prices: z.object({
    GNF: z.number().optional(),
    USD: z.number().optional(),
    EUR: z.number().optional(),
  }).optional(),
  lowStockThreshold: z.number().default(10),
  active: z.boolean().default(true),
  createdAt: z.any().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

export const StockLevelSchema = z.object({
  productId: z.string(),
  storeId: z.string(),
  quantity: z.number().default(0),
  lastUpdated: z.any(),
});

export type StockLevel = z.infer<typeof StockLevelSchema>;

export const StockMovementSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  storeId: z.string(),
  storeName: z.string(),
  type: z.enum(["PURCHASE", "SALE", "TRANSFER_IN", "TRANSFER_OUT", "RETURN", "CORRECTION"]),
  delta: z.number(),
  previousStock: z.number(),
  newStock: z.number(),
  reason: z.string().optional(),
  performedBy: z.string(),
  performedByName: z.string(),
  timestamp: z.any(),
  relatedDocId: z.string().optional(),
});

export type StockMovement = z.infer<typeof StockMovementSchema>;

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Le nom est requis"),
  phone: z.string().min(8, "Téléphone requis"),
  address: z.string().optional(),
  type: z.enum(["particulier", "grossiste"]),
  status: z.enum(["actif", "suspendu", "vip"]),
  creditCeiling: z.number().default(0),
  currentDebt: z.number().default(0),
  storeOfOriginId: z.string(),
  createdAt: z.any().optional(),
});

export type Client = z.infer<typeof ClientSchema>;

export const ClientPaymentSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  amount: z.number(),
  method: z.enum(["CASH", "MOBILE_MONEY", "CARD", "TRANSFER"]),
  timestamp: z.any(),
  storeId: z.string(),
  performedBy: z.string(),
  notes: z.string().optional(),
});

export type ClientPayment = z.infer<typeof ClientPaymentSchema>;

export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Le nom est requis"),
  country: z.string().min(2, "Le pays est requis"),
  city: z.string().optional(),
  type: z.enum(["local", "import"]),
  defaultCurrency: z.enum(["FCFA", "GNF", "USD", "EUR"]),
  paymentTerms: z.string().optional(),
  currentDebt: z.number().default(0),
  createdAt: z.any().optional(),
});

export type Supplier = z.infer<typeof SupplierSchema>;

export type CurrencyCode = "FCFA" | "GNF" | "USD" | "EUR";

export interface ExchangeRate {
  code: CurrencyCode;
  rateToRef: number;
  lastUpdated: any;
  updatedBy: string;
}

export const PurchaseItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number().min(0.01),
  unitCost: z.number().min(0),
  currency: z.enum(["FCFA", "GNF", "USD", "EUR"]),
  exchangeRate: z.number().min(0.0001),
  landedCostFCFA: z.number().optional(),
});

export type PurchaseItem = z.infer<typeof PurchaseItemSchema>;

export const PurchaseExpenseSchema = z.object({
  label: z.string(),
  amount: z.number().min(0),
  currency: z.enum(["FCFA", "GNF", "USD", "EUR"]),
  exchangeRate: z.number().min(0.0001),
});

export type PurchaseExpense = z.infer<typeof PurchaseExpenseSchema>;

export const PurchaseSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  storeId: z.string(),
  storeName: z.string(),
  timestamp: z.any(),
  items: z.array(PurchaseItemSchema),
  expenses: z.array(PurchaseExpenseSchema),
  subtotalFCFA: z.number(),
  expensesTotalFCFA: z.number(),
  totalFCFA: z.number(),
  status: z.enum(["DRAFT", "ORDERED", "RECEIVED", "CANCELLED"]),
  notes: z.string().optional(),
  performedBy: z.string(),
  performedByName: z.string(),
});

export type Purchase = z.infer<typeof PurchaseSchema>;

export type PaymentMethod = "CASH" | "ORANGE_MONEY" | "MOBILE_MONEY" | "CARD" | "TRANSFER";

export const SaleItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  total: z.number(),
});

export type SaleItem = z.infer<typeof SaleItemSchema>;

export const SaleSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  sellerId: z.string(),
  sellerName: z.string(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  timestamp: z.any(),
  items: z.array(SaleItemSchema),
  subtotal: z.number(),
  discount: z.number().default(0),
  total: z.number(),
  payments: z.array(z.object({
    method: z.string(),
    amount: z.number(),
  })),
  amountPaid: z.number(),
  debtAmount: z.number(),
  status: z.enum(["COMPLETED", "CANCELLED", "REFUNDED"]),
});

export type Sale = z.infer<typeof SaleSchema>;

export const ExpenseSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  category: z.string(),
  label: z.string(),
  amount: z.number(),
  method: z.string(),
  timestamp: z.any(),
  performedBy: z.string(),
  performedByName: z.string(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export type Expense = z.infer<typeof ExpenseSchema>;

export const CashSessionSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  status: z.enum(["OPEN", "CLOSED"]),
  openedAt: z.any(),
  openedBy: z.string(),
  openedByName: z.string(),
  closedAt: z.any().optional(),
  closedBy: z.string().optional(),
  initialBalances: z.record(z.string(), z.number()),
  expectedBalances: z.record(z.string(), z.number()),
  actualBalances: z.record(z.string(), z.number()).optional(),
  variances: z.record(z.string(), z.number()).optional(),
  notes: z.string().optional(),
});

export type CashSession = z.infer<typeof CashSessionSchema>;

export const CashMovementSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  sessionId: z.string(),
  type: z.enum(["IN", "OUT"]),
  source: z.enum(["SALE", "EXPENSE", "PURCHASE_PAYMENT", "CLIENT_PAYMENT", "ADJUSTMENT", "FUND_ENTRY", "FUND_WITHDRAWAL"]),
  amount: z.number(),
  method: z.string(),
  timestamp: z.any(),
  performedBy: z.string(),
  performedByName: z.string(),
  relatedDocId: z.string().optional(),
  description: z.string().optional(),
});

export type CashMovement = z.infer<typeof CashMovementSchema>;

export type AppNotificationType = "STOCK_ALERT" | "SALE" | "PURCHASE" | "INFO";

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  timestamp: any;
  read: boolean;
  storeId?: string;
  userId?: string;
}
