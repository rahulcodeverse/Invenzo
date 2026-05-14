export class SkuGenerator {
  /**
   * Generate SKU from category and product name
   * Example: CAT-PROD-12345
   */
  static generate(category: string, productName: string): string {
    const categoryPrefix = category.substring(0, 3).toUpperCase();
    const productPrefix = productName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 4)
      .toUpperCase();
    const timestamp = Date.now().toString().slice(-5);
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0');

    return `${categoryPrefix}-${productPrefix}-${timestamp}${random}`;
  }

  /**
   * Generate batch number
   * Example: BATCH-20240203-001
   */
  static generateBatchNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');

    return `BATCH-${year}${month}${day}-${random}`;
  }

  /**
   * Generate serial number
   * Example: SN-20240203-ABCD1234
   */
  static generateSerialNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();

    return `SN-${year}${month}${day}-${random}`;
  }

  /**
   * Generate invoice number
   * Example: INV-2024-0001
   */
  static generateInvoiceNumber(type: 'PURCHASE' | 'SALE', sequence: number): string {
    const year = new Date().getFullYear();
    const prefix = type === 'PURCHASE' ? 'PINV' : 'SINV';
    const seqStr = sequence.toString().padStart(4, '0');

    return `${prefix}-${year}-${seqStr}`;
  }

  /**
   * Generate PO number
   * Example: PO-2024-0001
   */
  static generatePoNumber(sequence: number): string {
    const year = new Date().getFullYear();
    const seqStr = sequence.toString().padStart(4, '0');

    return `PO-${year}-${seqStr}`;
  }

  /**
   * Generate SO (Sales Order) number
   * Example: SO-2024-0001
   */
  static generateSoNumber(sequence: number): string {
    const year = new Date().getFullYear();
    const seqStr = sequence.toString().padStart(4, '0');

    return `SO-${year}-${seqStr}`;
  }

  /**
   * Generate GRN number
   * Example: GRN-2024-0001
   */
  static generateGrnNumber(sequence: number): string {
    const year = new Date().getFullYear();
    const seqStr = sequence.toString().padStart(4, '0');

    return `GRN-${year}-${seqStr}`;
  }
}

