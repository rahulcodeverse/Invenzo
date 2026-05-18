import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { PrismaService } from '../../prisma/prisma.service';

type Party = {
  name?: string | null;
  code?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstNumber?: string | null;
};

type DocumentLine = {
  name: string;
  sku?: string | null;
  unit?: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
};

type GstDocument = {
  title: string;
  number: string;
  dateLabel: string;
  date: Date;
  dueLabel?: string;
  dueDate?: Date | null;
  status?: string;
  partyLabel: string;
  party: Party;
  referenceLabel?: string;
  reference?: string | null;
  lines: DocumentLine[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  terms?: string | null;
};

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuotationPdf(id: string, tenantId: string): Promise<Buffer> {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, tenantId },
      include: { customer: true, items: true },
    });

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    const products = await this.findProductsForTenant(
      tenantId,
      quotation.items.map(item => item.productId),
    );

    return this.renderPdf(tenantId, {
      title: 'GST Quotation',
      number: quotation.quotationNumber,
      dateLabel: 'Quotation Date',
      date: quotation.quotationDate,
      dueLabel: 'Valid Until',
      dueDate: quotation.validUntil,
      status: quotation.status,
      partyLabel: 'Bill To',
      party: quotation.customer,
      lines: quotation.items.map(item => this.toLine(item, products.get(item.productId))),
      subtotal: Number(quotation.subtotal),
      discount: Number(quotation.discount),
      taxAmount: Number(quotation.taxAmount),
      total: Number(quotation.total),
      notes: quotation.notes,
      terms: quotation.termsConditions,
    });
  }

  async createSalesInvoicePdf(id: string, tenantId: string): Promise<Buffer> {
    const invoice = await this.prisma.salesInvoice.findFirst({
      where: { id, tenantId },
      include: {
        deliveryNote: true,
        salesOrder: {
          include: {
            customer: true,
            items: {
              include: {
                product: {
                  include: { unit: true },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.renderPdf(tenantId, {
      title: 'GST Tax Invoice',
      number: invoice.invoiceNumber,
      dateLabel: 'Invoice Date',
      date: invoice.invoiceDate,
      dueLabel: 'Due Date',
      dueDate: invoice.dueDate,
      status: invoice.status,
      partyLabel: 'Bill To',
      party: invoice.salesOrder.customer,
      referenceLabel: invoice.deliveryNote ? 'Delivery Note' : 'Sales Order',
      reference: invoice.deliveryNote?.deliveryNumber ?? invoice.salesOrder.soNumber,
      lines: invoice.salesOrder.items.map(item => this.toLine(item, item.product)),
      subtotal: Number(invoice.subtotal),
      discount: Number(invoice.discount),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      notes: invoice.notes,
    });
  }

  async createDeliveryChallanPdf(id: string, tenantId: string): Promise<Buffer> {
    const delivery = await this.prisma.deliveryNote.findFirst({
      where: { id, salesOrder: { tenantId } },
      include: {
        warehouse: true,
        salesOrder: {
          include: {
            customer: true,
            items: true,
          },
        },
        items: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery note not found');
    }

    const products = await this.findProductsForTenant(
      tenantId,
      delivery.items.map(item => item.productId),
    );

    const orderItems = new Map(
      delivery.salesOrder.items.map(item => [item.productId, item]),
    );

    return this.renderPdf(tenantId, {
      title: 'Delivery Challan',
      number: delivery.deliveryNumber,
      dateLabel: 'Delivery Date',
      date: delivery.deliveryDate,
      partyLabel: 'Ship To',
      party: delivery.salesOrder.customer,
      referenceLabel: 'Sales Order',
      reference: delivery.salesOrder.soNumber,
      lines: delivery.items.map(item => {
        const orderItem = orderItems.get(item.productId);
        const product = products.get(item.productId);

        return {
          name: product?.name ?? item.productId,
          sku: product?.sku,
          unit: product?.unit?.symbol ?? product?.unit?.name,
          quantity: Number(item.quantity),
          unitPrice: Number(orderItem?.unitPrice ?? 0),
          discount: Number(orderItem?.discount ?? 0),
          taxRate: Number(orderItem?.taxRate ?? product?.taxRate ?? 0),
          taxAmount: Number(orderItem?.taxAmount ?? 0),
          total: Number(orderItem?.total ?? 0),
        };
      }),
      subtotal: Number(delivery.salesOrder.subtotal),
      discount: Number(delivery.salesOrder.discount),
      taxAmount: Number(delivery.salesOrder.taxAmount),
      total: Number(delivery.salesOrder.total),
      notes: [
        delivery.notes,
        delivery.warehouse ? `Dispatch warehouse: ${delivery.warehouse.name}` : null,
      ].filter(Boolean).join('\n'),
    });
  }

  async createPurchaseOrderPdf(id: string, tenantId: string): Promise<Buffer> {
    const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        vendor: true,
        items: {
          include: {
            product: {
              include: { unit: true },
            },
          },
        },
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    return this.renderPdf(tenantId, {
      title: 'Purchase Order',
      number: purchaseOrder.poNumber,
      dateLabel: 'Order Date',
      date: purchaseOrder.orderDate,
      dueLabel: 'Expected Date',
      dueDate: purchaseOrder.expectedDate,
      status: purchaseOrder.status,
      partyLabel: 'Vendor',
      party: purchaseOrder.vendor,
      lines: purchaseOrder.items.map(item => this.toLine(item, item.product)),
      subtotal: Number(purchaseOrder.subtotal),
      discount: Number(purchaseOrder.discount),
      taxAmount: Number(purchaseOrder.taxAmount),
      total: Number(purchaseOrder.total),
      notes: purchaseOrder.notes,
    });
  }

  private async findProductsForTenant(tenantId: string, productIds: string[]) {
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        id: { in: [...new Set(productIds)] },
      },
      include: { unit: true },
    });

    return new Map(products.map(product => [product.id, product]));
  }

  private toLine(item: any, product?: any): DocumentLine {
    return {
      name: product?.name ?? item.productId,
      sku: product?.sku,
      unit: product?.unit?.symbol ?? product?.unit?.name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount ?? 0),
      taxRate: Number(item.taxRate ?? product?.taxRate ?? 0),
      taxAmount: Number(item.taxAmount ?? 0),
      total: Number(item.total ?? 0),
    };
  }

  private async renderPdf(tenantId: string, documentData: GstDocument): Promise<Buffer> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { companySettings: true },
    });

    if (!tenant) {
      throw new NotFoundException('Company not found');
    }

    const company = tenant.companySettings;
    const companyName = company?.name ?? tenant.name;
    const companyAddress = [
      company?.address ?? tenant.address,
      company?.city,
      company?.state,
      company?.postalCode,
      company?.country,
    ].filter(Boolean).join(', ');
    const companyGstin = tenant.gstNumber ?? company?.taxId ?? 'Not available';

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(Buffer.from(chunk)));

    const bufferPromise = new Promise<Buffer>(resolve => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    this.drawHeader(doc, documentData.title, companyName, companyAddress, companyGstin, company?.email ?? tenant.email, company?.phone ?? tenant.phone);
    this.drawDocumentMeta(doc, documentData);
    this.drawParty(doc, documentData.partyLabel, documentData.party);
    this.drawItems(doc, documentData.lines);
    this.drawTotals(doc, documentData);
    this.drawNotes(doc, documentData.notes, documentData.terms);

    doc.end();
    return bufferPromise;
  }

  private drawHeader(
    doc: PDFKit.PDFDocument,
    title: string,
    companyName: string,
    companyAddress: string,
    gstin: string,
    email?: string | null,
    phone?: string | null,
  ) {
    doc.fontSize(20).font('Helvetica-Bold').text(companyName, 40, 38, { width: 330 });
    doc.fontSize(9).font('Helvetica').text(companyAddress || 'Address not configured', { width: 330 });
    doc.text(`GSTIN: ${gstin}`);
    doc.text([email, phone].filter(Boolean).join(' | '));

    doc.fontSize(18).font('Helvetica-Bold').text(title.toUpperCase(), 390, 42, {
      align: 'right',
      width: 165,
    });
    doc.moveTo(40, 112).lineTo(555, 112).strokeColor('#20312a').stroke();
  }

  private drawDocumentMeta(doc: PDFKit.PDFDocument, documentData: GstDocument) {
    const metaX = 340;
    let y = 128;

    this.drawKeyValue(doc, metaX, y, 'Document No.', documentData.number);
    y += 16;
    this.drawKeyValue(doc, metaX, y, documentData.dateLabel, this.formatDate(documentData.date));
    y += 16;

    if (documentData.dueLabel && documentData.dueDate) {
      this.drawKeyValue(doc, metaX, y, documentData.dueLabel, this.formatDate(documentData.dueDate));
      y += 16;
    }

    if (documentData.status) {
      this.drawKeyValue(doc, metaX, y, 'Status', documentData.status);
      y += 16;
    }

    if (documentData.reference && documentData.referenceLabel) {
      this.drawKeyValue(doc, metaX, y, documentData.referenceLabel, documentData.reference);
    }
  }

  private drawParty(doc: PDFKit.PDFDocument, label: string, party: Party) {
    doc.fontSize(10).font('Helvetica-Bold').text(label, 40, 128);
    doc.fontSize(12).text(party.name ?? 'Not available', 40, 145, { width: 260 });
    doc.fontSize(9).font('Helvetica');
    doc.text(party.code ? `Code: ${party.code}` : '', { width: 260 });
    doc.text(party.address ?? '', { width: 260 });
    doc.text([party.city, party.state, party.pincode].filter(Boolean).join(', '), { width: 260 });
    doc.text(`GSTIN: ${party.gstNumber ?? 'Not available'}`, { width: 260 });
    doc.text([party.email, party.phone].filter(Boolean).join(' | '), { width: 260 });
  }

  private drawItems(doc: PDFKit.PDFDocument, lines: DocumentLine[]) {
    const startY = 230;
    const columns = [
      { label: '#', x: 40, width: 24 },
      { label: 'Item', x: 64, width: 145 },
      { label: 'HSN/SKU', x: 209, width: 68 },
      { label: 'Qty', x: 277, width: 40, align: 'right' as const },
      { label: 'Rate', x: 317, width: 52, align: 'right' as const },
      { label: 'Disc.', x: 369, width: 46, align: 'right' as const },
      { label: 'GST %', x: 415, width: 45, align: 'right' as const },
      { label: 'Tax', x: 460, width: 45, align: 'right' as const },
      { label: 'Total', x: 505, width: 50, align: 'right' as const },
    ];

    doc.rect(40, startY, 515, 22).fill('#20312a');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
    columns.forEach(col => doc.text(col.label, col.x + 2, startY + 7, { width: col.width - 4, align: col.align }));

    doc.fillColor('#17231f').font('Helvetica');
    let y = startY + 30;

    lines.forEach((line, index) => {
      if (y > 700) {
        doc.addPage();
        y = 52;
      }

      if (index % 2 === 0) {
        doc.rect(40, y - 6, 515, 24).fill('#f7f4ed').fillColor('#17231f');
      }

      const taxable = line.quantity * line.unitPrice - line.discount;
      const taxSplit = this.getTaxSplit(line.taxAmount);
      const values = [
        String(index + 1),
        `${line.name}${line.unit ? ` (${line.unit})` : ''}`,
        line.sku ?? '-',
        this.formatQuantity(line.quantity),
        this.money(line.unitPrice),
        this.money(line.discount),
        this.formatQuantity(line.taxRate),
        this.money(line.taxAmount),
        this.money(line.total || taxable + line.taxAmount),
      ];

      columns.forEach((col, colIndex) => {
        doc.text(values[colIndex], col.x + 2, y, {
          width: col.width - 4,
          align: col.align,
          ellipsis: true,
        });
      });

      y += 24;
      if (line.taxAmount > 0) {
        doc.fontSize(7).fillColor('#66736b').text(
          `CGST ${this.money(taxSplit.cgst)} + SGST ${this.money(taxSplit.sgst)} | taxable ${this.money(taxable)}`,
          64,
          y - 7,
          { width: 260 },
        );
        doc.fontSize(8).fillColor('#17231f');
      }
    });

    doc.moveTo(40, y + 4).lineTo(555, y + 4).strokeColor('#d7d0c3').stroke();
  }

  private drawTotals(doc: PDFKit.PDFDocument, documentData: GstDocument) {
    const taxSplit = this.getTaxSplit(documentData.taxAmount);
    const y = doc.y < 610 ? 610 : doc.y + 20;
    const x = 365;

    this.drawKeyValue(doc, x, y, 'Subtotal', this.money(documentData.subtotal));
    this.drawKeyValue(doc, x, y + 18, 'Discount', this.money(documentData.discount));
    this.drawKeyValue(doc, x, y + 36, 'CGST', this.money(taxSplit.cgst));
    this.drawKeyValue(doc, x, y + 54, 'SGST', this.money(taxSplit.sgst));
    this.drawKeyValue(doc, x, y + 72, 'IGST', this.money(taxSplit.igst));
    doc.rect(x - 6, y + 92, 196, 26).fill('#e7a041');
    doc.fillColor('#17231f').font('Helvetica-Bold').fontSize(11);
    doc.text('Grand Total', x, y + 100, { width: 90 });
    doc.text(this.money(documentData.total), x + 92, y + 100, { width: 90, align: 'right' });
    doc.fillColor('#17231f').font('Helvetica');
  }

  private drawNotes(doc: PDFKit.PDFDocument, notes?: string | null, terms?: string | null) {
    const content = [
      notes ? `Notes:\n${notes}` : null,
      terms ? `Terms:\n${terms}` : null,
    ].filter(Boolean).join('\n\n');

    if (!content) return;

    doc.fontSize(9).font('Helvetica-Bold').text('Remarks', 40, 618, { width: 285 });
    doc.font('Helvetica').text(content, 40, 634, { width: 285 });
  }

  private drawKeyValue(doc: PDFKit.PDFDocument, x: number, y: number, key: string, value: string) {
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#17231f').text(key, x, y, { width: 82 });
    doc.font('Helvetica').text(value, x + 92, y, { width: 98, align: 'right' });
  }

  private getTaxSplit(taxAmount: number) {
    return {
      cgst: taxAmount / 2,
      sgst: taxAmount / 2,
      igst: 0,
    };
  }

  private money(value: number) {
    return `INR ${Number(value || 0).toFixed(2)}`;
  }

  private formatQuantity(value: number) {
    return Number(value || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    });
  }

  private formatDate(value: Date) {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(value);
  }
}
