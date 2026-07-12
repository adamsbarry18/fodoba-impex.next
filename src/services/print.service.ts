
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { Sale, Store, Purchase, StockMovement } from '@/lib/types';

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
    doc.text('FODOBA IMPEX', pageWidth / 2, y, { align: 'center' });
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
        `${item.quantity} x ${item.unitPrice.toLocaleString()}`,
        item.total.toLocaleString()
      ]),
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1 },
    });

    y = (doc as any).lastAutoTable.finalY + 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 5, y);
    doc.text(`${sale.total.toLocaleString()} FCFA`, pageWidth - 5, y, { align: 'right' });
    y += 8;

    try {
      const qrDataUrl = await QRCode.toDataURL(sale.id);
      doc.addImage(qrDataUrl, 'PNG', pageWidth / 2 - 10, y, 20, 20);
    } catch {}

    window.open(doc.output('bloburl'), '_blank');
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
      body: sale.items.map(i => [i.name, i.quantity, i.unitPrice.toLocaleString(), i.total.toLocaleString()]),
      headStyles: { fillColor: [29, 217, 124] }
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL GÉNÉRAL: ${sale.total.toLocaleString()} FCFA`, 190, y, { align: 'right' });

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
        i.unitCost.toLocaleString(), 
        i.currency, 
        (i.quantity * i.unitCost * i.exchangeRate).toLocaleString()
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
    doc.text('FODOBA IMPEX - BON DE TRANSFERT', 20, 20);
    
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
   * Helper pour dessiner l'en-tête commun.
   */
  drawHeader(doc: jsPDF, title: string, store: Store) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 217, 124);
    doc.text('FODOBA IMPEX', 20, 25);
    
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
