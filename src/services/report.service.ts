
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Sale, Expense, Product, Client, Supplier, StockLevel } from "@/lib/types";

export const ReportService = {
  /**
   * Récupère les ventes filtrées pour le reporting.
   */
  async getSalesReport(params: { 
    startDate: Date, 
    endDate: Date, 
    storeId?: string 
  }) {
    let constraints = [
      where("timestamp", ">=", Timestamp.fromDate(params.startDate)),
      where("timestamp", "<=", Timestamp.fromDate(params.endDate))
    ];

    const q = query(collection(db, "sales"), ...constraints);
    const snap = await getDocs(q);
    let sales = snap.docs.map(doc => doc.data() as Sale);

    if (params.storeId && params.storeId !== "all") {
      sales = sales.filter(s => s.storeId === params.storeId);
    }

    sales.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

    const totals = sales.reduce((acc, s) => ({
      revenue: acc.revenue + s.total,
      discount: acc.discount + (s.discount || 0),
      debt: acc.debt + (s.debtAmount || 0),
      count: acc.count + 1
    }), { revenue: 0, discount: 0, debt: 0, count: 0 });

    return { sales, totals };
  },

  /**
   * Analyse complète des stocks et valorisation (P3 État stock)
   */
  async getInventoryReport(storeId?: string) {
    const [productsSnap, stocksSnap] = await Promise.all([
      getDocs(collection(db, "products")),
      getDocs(collection(db, "stocks"))
    ]);

    const products = productsSnap.docs.map(doc => doc.data() as Product);
    const stocks = stocksSnap.docs.map(doc => doc.data() as StockLevel);

    const report = products.map(p => {
      const relevantStocks = storeId && storeId !== "all" 
        ? stocks.filter(s => s.productId === p.id && s.storeId === storeId)
        : stocks.filter(s => s.productId === p.id);
      
      const totalQty = relevantStocks.reduce((sum, s) => sum + s.quantity, 0);
      const valuation = totalQty * (p.purchasePriceRef || 0);

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.categoryId,
        stock: totalQty,
        unit: p.unit,
        unitCost: p.purchasePriceRef || 0,
        valuation
      };
    });

    const totalValuation = report.reduce((sum, item) => sum + item.valuation, 0);

    return { 
      items: report.sort((a, b) => b.valuation - a.valuation), 
      totalValuation 
    };
  },

  /**
   * Top Produits les plus vendus (P3 Top produits)
   */
  async getTopProducts(storeId?: string, limitCount = 10) {
    const q = storeId && storeId !== 'all' 
      ? query(collection(db, "sales"), where("storeId", "==", storeId))
      : query(collection(db, "sales"));
    
    const snap = await getDocs(q);
    const productSales: Record<string, { name: string, qty: number, revenue: number }> = {};

    snap.docs.forEach(doc => {
      const sale = doc.data() as Sale;
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, qty: 0, revenue: 0 };
        }
        productSales[item.productId].qty += item.quantity;
        productSales[item.productId].revenue += item.total;
      });
    });

    return Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limitCount);
  },

  /**
   * Consolidation des dettes et créances (P3 Bilan consolidé)
   */
  async getFinanceConsolidation() {
    const [clientsSnap, suppliersSnap] = await Promise.all([
      getDocs(collection(db, "clients")),
      getDocs(collection(db, "suppliers"))
    ]);

    const clients = clientsSnap.docs.map(doc => doc.data() as Client);
    const suppliers = suppliersSnap.docs.map(doc => doc.data() as Supplier);

    const totalClientDebt = clients.reduce((sum, c) => sum + (c.currentDebt || 0), 0);
    const totalSupplierDebt = suppliers.reduce((sum, s) => sum + (s.currentDebt || 0), 0);

    return {
      clients: clients.filter(c => c.currentDebt > 0).sort((a, b) => b.currentDebt - a.currentDebt),
      suppliers: suppliers.filter(s => s.currentDebt > 0).sort((a, b) => b.currentDebt - a.currentDebt),
      summary: {
        totalClientDebt,
        totalSupplierDebt,
        netBalance: totalClientDebt - totalSupplierDebt
      }
    };
  }
};
