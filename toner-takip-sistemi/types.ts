
export interface User {
  username: string;
  name: string;
  role: 'admin' | 'user';
  password?: string;
}

export type ConnectionType = 'USB' | 'Network';

export type PrinterStatus = 'ACTIVE' | 'MAINTENANCE' | 'BROKEN' | 'SCRAPPED' | 'SPARE';

export interface Printer {
  id: string;
  serialNumber: string;
  shortCode?: string;
  brand: string;
  model: string;
  location: string;
  floor: string;
  lastCounter: number;
  lastTonerDate: string;
  compatibleToner: string;
  connectionType: ConnectionType;
  ipAddress?: string;
  supplier: string;
  status: PrinterStatus;
  connectedUsers?: string[];
  isColor?: boolean;
  lastCounterBW?: number;
  lastCounterColor?: number;
  monthlyRentalCost?: number;
}

export interface MonthlyInvoice {
  id: string;
  month: string;
  year: number;
  euroRate: number;
  totalTL: number;
  imageUrl?: string;
  status: 'PAID' | 'PENDING';
  createdAt: string;
  paidAt?: string;
}

export interface Note {
  id: string;
  printerId?: string; // Yazıcıya bağlı notlar için
  title: string;
  content: string;
  date: string;
  user: string;
  imageUrl?: string;
}

export interface ActivityLog {
  id: string;
  date: string;
  user: string;
  action: string;
  details: string;
}

export interface TonerStock {
  modelName: string;
  quantity: number;
}

export interface StockLog {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  tonerModel: string;
  quantity: number;
  description: string;
  printerId?: string;
  user: string;
  pageYield?: number;
  cost?: number;
}

export interface ServiceRecord {
  id: string;
  printerId: string;
  printerName: string;
  date: string;
  issue: string;
  actionTaken: string;
  note?: string;
  imageUrl?: string;
  cost?: number;
  provider: string;
  status: 'PENDING' | 'COMPLETED' | 'SCRAPPED';
  lastModifiedBy?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface CounterLog {
  id: string;
  printerId: string;
  printerName: string;
  serialNumber: string;
  date: string;
  previousCounter: number;
  currentCounter: number;
  usage: number;
  recordedBy: string;
  usageBW?: number;
  usageColor?: number;
  currentBW?: number;
  currentColor?: number;
  customCounters?: { label: string; value: number }[];
}

export interface SystemConfig {
  brands: string[];
  models: string[];
  suppliers: string[];
  tonerModels: string[];
  whatsappNumber?: string;
  appUrl?: string;
  brandImages?: Record<string, string>; 
  modelImages?: Record<string, string>;
}

export interface InvoiceRecord {
  id: string;
  month: string;
  year: number;
  euroRate: number;
  fixedFeeEuro: number;
  totalAmountTL: number;
  status: 'PAID' | 'UNPAID';
  imageUrl?: string;
  details: {
    a4QuotaUsed: number;
    a4OverQuota: number;
    a3ColorCount: number;
    a4ColorCount: number;
    scanCount: number;
  };
}
