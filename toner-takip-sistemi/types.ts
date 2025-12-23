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
  shortCode?: string; // New: Unique 4-6 digit numeric code for manual entry
  brand: string;   // e.g. "Canon", "HP"
  model: string;   // e.g. "3325i"
  location: string;
  floor: string;
  lastCounter: number; // Represents TOTAL counter
  lastTonerDate: string;
  compatibleToner: string;
  connectionType: ConnectionType;
  ipAddress?: string; // Only if Network
  supplier: string; // e.g. "Anahtar Bilgisayar", "Enes Bilişim"
  status: PrinterStatus; // New Visual Status
  connectedUsers?: string[]; // New: List of users connected to this printer
  
  // New Fields for Multi-Counter
  isColor?: boolean; // If true, enables A4-SB and A4-RL inputs
  lastCounterBW?: number; // Last known Black&White counter
  lastCounterColor?: number; // Last known Color counter
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

export interface CounterLog {
  id: string;
  printerId: string;
  printerName: string;
  serialNumber: string;
  date: string; // YYYY-MM-DD format usually (the 15th of month)
  previousCounter: number;
  currentCounter: number;
  usage: number; // current - previous
  recordedBy: string; // User or "System Import"
  
  // New Fields for Detail Logging
  usageBW?: number;
  usageColor?: number;
  currentBW?: number;
  currentColor?: number;
  
  // Advanced Dynamic Counters (e.g. A3 BW, A3 Color)
  customCounters?: { label: string; value: number }[];
}

export interface SystemConfig {
  brands: string[];
  models: string[];
  suppliers: string[]; // List of vendors
  tonerModels: string[]; // New: List of toner types
  whatsappNumber?: string; // For notifications
  // New Image Maps (Key: Name, Value: Image URL)
  brandImages?: Record<string, string>; 
  modelImages?: Record<string, string>;
}