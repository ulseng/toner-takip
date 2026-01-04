
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, query, orderBy, getDoc, absenteeism, where, writeBatch } from 'firebase/firestore';
import { Printer, TonerStock, StockLog, SystemConfig, ServiceRecord, User, CounterLog, Note } from '../types';

const COLLECTIONS = {
  PRINTERS: 'printers',
  STOCKS: 'stocks',
  LOGS: 'logs',
  CONFIG: 'config',
  SERVICES: 'services',
  USERS: 'users',
  COUNTERS: 'counters',
  NOTES: 'notes'
};

const INITIAL_CONFIG: SystemConfig = {
  brands: ['Canon', 'HP', 'Kyocera', 'Xerox', 'Epson'],
  models: ['MF416dw', 'iF1643', 'LBP 251DW', '3325i', 'L3210', 'L1210', 'P2035', 'LBP 6030'],
  suppliers: ['Anahtar Bilgisayar', 'Enes Bilişim', 'Kendi Malımız'],
  tonerModels: ['1643', '505', '259x'],
  whatsappNumber: '',
  brandImages: {},
  modelImages: {}
};

const cleanData = (data: any) => {
  const newObj = { ...data };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === undefined) delete newObj[key];
  });
  return newObj;
};

export const StorageService = {
  // --- AUTH ---
  getUsers: async (): Promise<User[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      return snapshot.docs.map(doc => ({ ...doc.data() as any } as User));
    } catch (error) { return []; }
  },

  login: async (username: string, password: string): Promise<User | null> => {
    const users = await StorageService.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (user) {
      const { password, ...safeUser } = user;
      return safeUser as User;
    }
    return null;
  },

  // --- PRINTERS ---
  getPrinters: async (): Promise<Printer[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.PRINTERS));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Printer));
    } catch (e) { return []; }
  },

  addPrinter: async (printer: Printer) => {
    const printers = await StorageService.getPrinters();
    if (!printer.shortCode) {
      const codes = printers.map(p => parseInt(p.shortCode || '1000')).filter(n => !isNaN(n) && n >= 1000);
      const maxCode = codes.length > 0 ? Math.max(...codes) : 1000;
      printer.shortCode = (maxCode + 1).toString();
    }
    const { id, ...data } = printer;
    const docRef = await addDoc(collection(db, COLLECTIONS.PRINTERS), cleanData(data));
    return docRef.id;
  },

  updatePrinter: async (printer: Printer) => {
    if (!printer.id) return;
    await updateDoc(doc(db, COLLECTIONS.PRINTERS, printer.id), cleanData(printer));
  },

  deletePrinter: async (printerId: string) => {
    await deleteDoc(doc(db, COLLECTIONS.PRINTERS, printerId));
  },

  findPrinterByShortCode: async (code: string): Promise<Printer | null> => {
    const q = query(collection(db, COLLECTIONS.PRINTERS), where('shortCode', '==', code.trim()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() as any } as Printer;
  },

  fixMissingShortCodes: async () => {
    const printers = await StorageService.getPrinters();
    const batch = writeBatch(db);
    let nextCode = 1001;
    for (const p of printers) {
      if (!p.shortCode || parseInt(p.shortCode) < 1000) {
        batch.update(doc(db, COLLECTIONS.PRINTERS, p.id), { shortCode: nextCode.toString() });
        nextCode++;
      }
    }
    await batch.commit();
    return printers.length;
  },

  // --- NOTES ---
  getNotes: async (): Promise<Note[]> => {
    try {
      const q = query(collection(db, COLLECTIONS.NOTES), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Note));
    } catch (e) { return []; }
  },

  addNote: async (note: Note) => {
    const { id, ...data } = note;
    await addDoc(collection(db, COLLECTIONS.NOTES), cleanData(data));
  },

  deleteNote: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.NOTES, id));
  },

  // --- STOCKS & LOGS ---
  getStocks: async (): Promise<TonerStock[]> => {
    const snapshot = await getDocs(collection(db, COLLECTIONS.STOCKS));
    return snapshot.docs.map(doc => ({ ...doc.data() as any } as TonerStock));
  },

  saveStock: async (stock: TonerStock) => {
    const q = query(collection(db, COLLECTIONS.STOCKS));
    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find(d => (d.data() as TonerStock).modelName === stock.modelName);
    if (existing) await updateDoc(doc(db, COLLECTIONS.STOCKS, existing.id), { quantity: stock.quantity });
    else await addDoc(collection(db, COLLECTIONS.STOCKS), cleanData(stock));
  },

  getLogs: async (): Promise<StockLog[]> => {
    const q = query(collection(db, COLLECTIONS.LOGS), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as StockLog));
  },

  addLog: async (log: StockLog) => {
    const { id, ...data } = log;
    await addDoc(collection(db, COLLECTIONS.LOGS), cleanData(data));
  },

  getServiceRecords: async (): Promise<ServiceRecord[]> => {
    const q = query(collection(db, COLLECTIONS.SERVICES), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as ServiceRecord));
  },

  addServiceRecord: async (record: ServiceRecord) => {
    const { id, ...data } = record;
    await addDoc(collection(db, COLLECTIONS.SERVICES), cleanData(data));
  },

  getCounterLogs: async (): Promise<CounterLog[]> => {
    const q = query(collection(db, COLLECTIONS.COUNTERS), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as CounterLog));
  },

  addCounterLog: async (log: CounterLog, updateMaster: boolean = true) => {
    const { id, ...data } = log;
    await addDoc(collection(db, COLLECTIONS.COUNTERS), cleanData(data));
    if (updateMaster) {
      await updateDoc(doc(db, COLLECTIONS.PRINTERS, log.printerId), { 
        lastCounter: log.currentCounter,
        lastCounterBW: log.currentBW,
        lastCounterColor: log.currentColor
      });
    }
  },

  getConfig: async (): Promise<SystemConfig> => {
    const docSnap = await getDoc(doc(db, COLLECTIONS.CONFIG, 'main_config'));
    return docSnap.exists() ? { ...INITIAL_CONFIG, ...docSnap.data() as SystemConfig } : INITIAL_CONFIG;
  },

  saveConfig: async (config: SystemConfig) => {
    await setDoc(doc(db, COLLECTIONS.CONFIG, 'main_config'), cleanData(config));
  },
  
  // Fix: Return an object containing total, bw, and color properties to match expected usage in CounterManagement.tsx
  fetchPrinterCounterSimulated: async (printer: Printer) => {
    await new Promise(r => setTimeout(r, 1000));
    const inc = Math.floor(Math.random() * 50) + 10;
    const bwInc = Math.floor(inc * 0.7);
    const colorInc = inc - bwInc;
    return { 
      total: printer.lastCounter + inc, 
      bw: (printer.lastCounterBW || 0) + bwInc,
      color: printer.isColor ? (printer.lastCounterColor || 0) + colorInc : 0
    };
  }
};
