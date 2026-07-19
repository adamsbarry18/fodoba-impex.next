
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { Sale, Store, Purchase, StockMovement, Product, CashSession } from '@/lib/types';
import { formatPdfNumber } from '@/lib/utils';
import { getPaymentMethodLabelFr, PAYMENT_METHOD_IDS } from '@/lib/constants/payment-methods';
import { getAppName } from '@/lib/constants/branding';
import { normalizeProduct } from '@/lib/product-utils';

/**
 * Service pour la génération et l'impression des documents PDF officiels.
 * Gère les Reçus, Bons de commande, Bons de transfert et Rapports.
 */
export const PrintService = {
  /**
   * Génère un ticket thermique (80mm) pour une vente.
   */
  async generateThermalTicket(sale: Sale, store: Store) {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 200],
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(getAppName(), pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(store.name, pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text(store.address, pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text(`Tél: ${store.phone}`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(9);
    doc.text(`Facture: #${sale.id.slice(-6).toUpperCase()}`, 5, y);
    y += 5;
    const dateStr = sale.timestamp?.toDate ? format(sale.timestamp.toDate(), 'dd/MM/yyyy HH:mm') : format(new Date(), 'dd/MM/yyyy HH:mm');
    doc.text(`Date: ${dateStr}`, 5, y);
    y += 5;
    doc.text(`Vendeur: ${sale.sellerName}`, 5, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      margin: { left: 5, right: 5 },
      body: sale.items.map(item => [
        item.name,
        `${item.quantity} x ${formatPdfNumber(item.unitPrice)}`,
        formatPdfNumber(item.total)
      ]),
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1 },
    });

    y = (doc as any).lastAutoTable.finalY + 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 5, y);
    doc.text(`${formatPdfNumber(sale.total)} FCFA`, pageWidth - 5, y, { align: 'right' });
    y += 8;

    try {
      const qrDataUrl = await QRCode.toDataURL(sale.id);
      doc.addImage(qrDataUrl, 'PNG', pageWidth / 2 - 10, y, 20, 20);
    } catch {}

    doc.save(`Ticket_${sale.id.slice(-6).toUpperCase()}.pdf`);
  },

  /**
   * Génère une facture A4 détaillée.
   */
  async generateA4Invoice(sale: Sale, store: Store) {
    const doc = new jsPDF('p', 'mm', 'a4');
    this.drawHeader(doc, 'FACTURE DE VENTE', store);
    
    let y = 50;
    doc.setFontSize(10);
    doc.text(`N° Facture: #${sale.id.slice(-6).toUpperCase()}`, 20, y);
    doc.text(`Date: ${sale.timestamp?.toDate ? format(sale.timestamp.toDate(), 'dd/MM/yyyy') : ''}`, 20, y + 5);
    doc.text(`Client: ${sale.clientName || 'Client de passage'}`, 140, y);
    doc.text(`Vendeur: ${sale.sellerName}`, 140, y + 5);

    autoTable(doc, {
      startY: y + 15,
      head: [['Désignation', 'Qté', 'Prix Unit.', 'Total (FCFA)']],
      body: sale.items.map(i => [i.name, i.quantity, formatPdfNumber(i.unitPrice), formatPdfNumber(i.total)]),
      headStyles: { fillColor: [29, 217, 124] }
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL GÉNÉRAL: ${formatPdfNumber(sale.total)} FCFA`, 190, y, { align: 'right' });

    doc.save(`Vente_${sale.id.slice(-6)}.pdf`);
  },

  /**
   * Génère un Bon de Commande Fournisseur (P2 Achats).
   */
  async generatePurchaseOrder(purchase: Purchase, store: Store) {
    const doc = new jsPDF('p', 'mm', 'a4');
    this.drawHeader(doc, 'BON DE COMMANDE', store);
    
    let y = 50;
    doc.setFontSize(10);
    doc.text(`Commande: #${purchase.id.slice(-6).toUpperCase()}`, 20, y);
    doc.text(`Fournisseur: ${purchase.supplierName}`, 140, y);
    doc.text(`Statut: ${purchase.status}`, 140, y + 5);

    autoTable(doc, {
      startY: y + 15,
      head: [['Produit', 'Qté', 'Coût Unit.', 'Devise', 'Total FCFA']],
      body: purchase.items.map(i => [
        i.name, 
        i.quantity, 
        formatPdfNumber(i.unitCost),
        i.currency,
        formatPdfNumber(i.quantity * i.unitCost * i.exchangeRate)
      ]),
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Commande_${purchase.id.slice(-6)}.pdf`);
  },

  /**
   * Génère un Bon de Transfert entre boutiques (P3 Transferts).
   */
  async generateTransferNote(movement: StockMovement) {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(22);
    doc.text(`${getAppName()} - BON DE TRANSFERT`, 20, 20);
    
    let y = 40;
    doc.setFontSize(10);
    doc.text(`Référence: #${movement.id.slice(-6).toUpperCase()}`, 20, y);
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 20, y + 5);
    doc.text(`Responsable: ${movement.performedByName}`, 20, y + 10);
    
    autoTable(doc, {
      startY: y + 20,
      head: [['Article', 'Quantité', 'Unité', 'Source']],
      body: [[movement.productName, Math.abs(movement.delta), 'Pce', movement.storeName]],
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`Transfert_${movement.id.slice(-6)}.pdf`);
  },

  /**
   * Export PDF de l'historique des mouvements de stock.
   */
  async generateStockHistoryReport(movements: StockMovement[], store: Store) {
    const doc = new jsPDF('p', 'mm', 'a4');
    this.drawHeader(doc, 'HISTORIQUE DES FLUX STOCK', store);

    const typeLabels: Record<StockMovement['type'], string> = {
      PURCHASE: 'Achat / Entrée',
      SALE: 'Vente',
      TRANSFER_IN: 'Transfert (Entrée)',
      TRANSFER_OUT: 'Transfert (Sortie)',
      RETURN: 'Retour Client',
      CORRECTION: 'Correction Inventaire',
    };

    const formatTs = (ts: StockMovement['timestamp']) => {
      if (!ts) return '-';
      const date = ts?.toDate ? ts.toDate() : new Date(ts);
      return format(date, 'dd/MM/yyyy HH:mm');
    };

    let y = 50;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Boutique : ${store.name} (${store.code})`, 20, y);
    doc.text(`Généré le : ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, y + 5);
    doc.text(`Mouvements exportés : ${movements.length}`, 20, y + 10);

    autoTable(doc, {
      startY: y + 18,
      head: [['Date', 'Produit', 'Type', 'Variation', 'Stock final', 'Auteur', 'Motif']],
      body: movements.map((m) => [
        formatTs(m.timestamp),
        m.productName,
        typeLabels[m.type] || m.type,
        m.delta > 0 ? `+${m.delta}` : String(m.delta),
        String(m.newStock),
        m.performedByName,
        m.reason || '-',
      ]),
      headStyles: { fillColor: [29, 217, 124] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 40 },
        6: { cellWidth: 32 },
      },
    });

    const safeCode = store.code.replace(/[^a-zA-Z0-9-_]/g, '_');
    doc.save(`Historique_Flux_${safeCode}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  },

  /**
   * Rapport PDF consolidé d'audit caisse (sessions + synthèse par ligne).
   */
  async generateCashAuditReport(
    sessions: CashSession[],
    store: Store,
    summary: { totalVariance: number; reliabilityPercent: number }
  ) {
    const doc = new jsPDF('p', 'mm', 'a4');
    this.drawHeader(doc, 'RAPPORT D\'AUDIT CAISSE', store);

    const formatTs = (ts: CashSession['openedAt']) => {
      if (!ts) return '-';
      const date = ts?.toDate ? ts.toDate() : new Date(ts);
      return format(date, 'dd/MM/yyyy HH:mm');
    };

    const closedSessions = sessions.filter((s) => s.status === 'CLOSED');
    const conformCount = closedSessions.filter((s) => {
      if (!s.variances) return true;
      return Object.values(s.variances).every((v) => v === 0);
    }).length;

    let y = 50;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Boutique : ${store.name} (${store.code})`, 20, y);
    doc.text(`Généré le : ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, y + 5);
    doc.text(`Sessions analysées : ${sessions.length} (${closedSessions.length} clôturées)`, 20, y + 10);
    doc.text(
      `Écart global : ${formatPdfNumber(summary.totalVariance)} FCFA - Fiabilité : ${summary.reliabilityPercent}%`,
      20,
      y + 15
    );
    doc.text(`Clôtures conformes : ${conformCount} / ${closedSessions.length || sessions.length}`, 20, y + 20);

    autoTable(doc, {
      startY: y + 26,
      head: [['Ouverture', 'Clôture', 'Caissier', 'Attendu', 'Réel', 'Écart', 'Statut']],
      body: sessions.map((s) => {
        const totalExpected = Object.values(s.expectedBalances).reduce((a, b) => a + b, 0);
        const totalActual = s.actualBalances
          ? Object.values(s.actualBalances).reduce((a, b) => a + b, 0)
          : totalExpected;
        const totalVar = s.variances
          ? Object.values(s.variances).reduce((a, b) => a + b, 0)
          : 0;
        const closedLabel = s.closedAt
          ? formatTs(s.closedAt)
          : '-';

        return [
          formatTs(s.openedAt),
          closedLabel,
          s.openedByName,
          formatPdfNumber(totalExpected),
          formatPdfNumber(totalActual),
          totalVar === 0 ? '0' : `${totalVar > 0 ? '+' : ''}${formatPdfNumber(totalVar)}`,
          s.status === 'OPEN' ? 'EN COURS' : totalVar === 0 ? 'CONFORME' : 'ÉCART',
        ];
      }),
      headStyles: { fillColor: [29, 217, 124] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 26 },
        2: { cellWidth: 28 },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Synthèse consolidée par ligne de caisse', 20, y);

    const lineTotals: Record<string, { expected: number; actual: number; variance: number }> = {};
    for (const method of PAYMENT_METHOD_IDS) {
      lineTotals[method] = { expected: 0, actual: 0, variance: 0 };
    }

    for (const s of closedSessions) {
      for (const method of PAYMENT_METHOD_IDS) {
        const expected = s.expectedBalances[method] ?? 0;
        const actual = s.actualBalances?.[method] ?? expected;
        const variance = s.variances?.[method] ?? actual - expected;
        lineTotals[method].expected += expected;
        lineTotals[method].actual += actual;
        lineTotals[method].variance += variance;
      }
    }

    autoTable(doc, {
      startY: y + 4,
      head: [['Ligne de caisse', 'Attendu (cumul)', 'Réel (cumul)', 'Écart (cumul)']],
      body: PAYMENT_METHOD_IDS.map((method) => {
        const t = lineTotals[method];
        return [
          getPaymentMethodLabelFr(method),
          formatPdfNumber(t.expected),
          formatPdfNumber(t.actual),
          t.variance === 0
            ? '0'
            : `${t.variance > 0 ? '+' : ''}${formatPdfNumber(t.variance)}`,
        ];
      }),
      headStyles: { fillColor: [29, 217, 124] },
      styles: { fontSize: 9, cellPadding: 2 },
    });

    const safeCode = store.code.replace(/[^a-zA-Z0-9-_]/g, '_');
    doc.save(`Audit_Caisse_${safeCode}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  },

  /**
   * Génère la fiche produit (catalogue / stock).
   */
  async generateProductSheet(
    product: Product,
    stores: Store[],
    stockLevels: Record<string, number>,
    store?: Store | null,
    categoryName?: string
  ) {
    const doc = new jsPDF('p', 'mm', 'a4');

    if (store) {
      this.drawHeader(doc, 'FICHE PRODUIT', store);
    } else {
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 217, 124);
      doc.text(getAppName(), 20, 25);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('FICHE PRODUIT', 20, 32);
      doc.setDrawColor(230, 230, 230);
      doc.line(20, 38, 190, 38);
    }

    let y = 50;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(product.name, 20, y);
    y += 8;

    const normalized = normalizeProduct(product)

    const infoRows: string[][] = [
      ['Référence (SKU)', product.sku],
      ['Code-barres', product.barcode || '-'],
      ['Catégorie', categoryName || product.categoryId],
      ['Unité détail', product.unit],
      ['Packaging', normalized.packagingUnit || '-'],
      ['Conditionnement', normalized.unitsPerPack > 1 ? `${normalized.unitsPerPack} ${product.unit} / ${normalized.packagingUnit || 'colis'}` : '-'],
      ['Prix détail FCFA', `${formatPdfNumber(product.sellingPriceFCFA)} FCFA`],
      ['Prix engros FCFA', `${formatPdfNumber(normalized.wholesalePriceFCFA)} FCFA`],
      ['Prix d\'achat réf.', `${formatPdfNumber(product.purchasePriceRef)} FCFA`],
      ['Date fabrication', product.manufacturingDate || '-'],
      ['Date expiration', product.expirationDate || '-'],
      ['Seuil d\'alerte', String(product.lowStockThreshold)],
      ['Statut', product.active ? 'Actif' : 'Inactif'],
    ];

    if (product.prices?.GNF) infoRows.push(['Prix GNF', formatPdfNumber(product.prices.GNF)]);
    if (product.prices?.USD) infoRows.push(['Prix USD', `$${formatPdfNumber(product.prices.USD)}`]);
    if (product.prices?.EUR) infoRows.push(['Prix EUR', `${formatPdfNumber(product.prices.EUR)} EUR`]);

    autoTable(doc, {
      startY: y,
      body: infoRows,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Stocks par boutique', 20, y);

    autoTable(doc, {
      startY: y + 4,
      head: [['Boutique', 'Code', 'Quantité', 'Unité']],
      body: stores.map((s) => [
        s.name,
        s.code,
        String(stockLevels[s.id] ?? 0),
        product.unit,
      ]),
      headStyles: { fillColor: [29, 217, 124] },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    try {
      const qrDataUrl = await QRCode.toDataURL(product.id);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('QR Code produit', 20, y);
      doc.addImage(qrDataUrl, 'PNG', 20, y + 3, 35, 35);
      doc.text(`ID: ${product.id}`, 60, y + 20);
    } catch {
      // QR optionnel
    }

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 285);

    const safeSku = product.sku.replace(/[^a-zA-Z0-9-_]/g, '_');
    doc.save(`Fiche_${safeSku}.pdf`);
  },

  /**
   * Helper pour dessiner l'en-tête commun.
   */
  drawHeader(doc: jsPDF, title: string, store: Store) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 217, 124);
    doc.text(getAppName(), 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(title, 20, 32);
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(store.name, 190, 20, { align: 'right' });
    doc.text(store.address, 190, 25, { align: 'right' });
    doc.text(`Tél: ${store.phone}`, 190, 30, { align: 'right' });
    
    doc.setDrawColor(230, 230, 230);
    doc.line(20, 38, 190, 38);
  }
};
