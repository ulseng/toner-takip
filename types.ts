export interface User {
  username: string;
  name: string;
  role: 'admin' | 'user';
  password?: string; // Added for internal DB storage
}

export type ConnectionType = 'USB' | 'Network';

export type PrinterStatus = 'ACTIVE' | 'MAINTENANCE' | 'BROKEN' | 'SCRAPPED' | 'SPARE';

export interface Printer {
  id: string;
  serialNumber: string;
  brand: string;   // e.g. "Canon", "HP"
  model: string;   // e.g. "3325i"
  location: string;
  floor: string;
  lastCounter: number;
  lastTonerDate: string;
  compatibleToner: string;
  connectionType: ConnectionType;
  ipAddress?: string; // Only if Network
  supplier: string; // e.g. "Anahtar Bilgisayar", "Enes Bilişim"
  status: PrinterStatus; // New Visual Status
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
  cost?: number; // Added for tracking Ink/Toner costs
  pageYield?: number; // New: How many pages printed with the previous toner?
}

export interface ServiceRecord {
  id: string;
  printerId: string;
  printerName: string; // Cache name for easier display
  date: string;
  issue: string; // Arıza tanımı
  actionTaken: string; // Yapılan işlem
  cost: number;
  provider: string; // Servis firması
  status: 'PENDING' | 'COMPLETED' | 'SCRAPPED'; // Bekliyor, Tamamlandı, Hurda
}

export interface SystemConfig {
  brands: string[];
  models: string[];
  suppliers: string[]; // List of vendors
  tonerModels: string[]; // New: List of toner types
  whatsappNumber?: string; // For notifications
}