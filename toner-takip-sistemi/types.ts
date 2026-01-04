
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
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  user: string;
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
  cost?: number;
  pageYield?: number;
}

export interface ServiceRecord {
  id: string;
  printerId: string;
  printerName: string;
  date: string;
  issue: string;
  actionTaken: string;
  cost: number;
  provider: string;
  status: 'PENDING' | 'COMPLETED' | 'SCRAPPED';
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
  brandImages?: Record<string, string>; 
  modelImages?: Record<string, string>;
}
