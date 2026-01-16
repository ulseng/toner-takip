
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, query, orderBy, getDoc, where, writeBatch } from 'firebase/firestore';
import { Printer, TonerStock, StockLog, SystemConfig, ServiceRecord, User, CounterLog, Note, ActivityLog, MonthlyInvoice, InvoiceRecord } from '../types';

const COLLECTIONS = {
  PRINTERS: 'printers',
  STOCKS: 'stocks',
  LOGS: 'logs',
  CONFIG: 'config',
  SERVICES: 'services',
  USERS: 'users',
  COUNTERS: 'counters',
  NOTES: 'notes',
  ACTIVITIES: 'activities',
  MONTHLY_INVOICES: 'monthly_invoices',
  INVOICES: 'invoices'
};

const INITIAL_CONFIG: SystemConfig = {
  brands: ['Canon', 'HP', 'Kyocera', 'Xerox', 'Epson'],
  models: ['MF416dw', 'iF1643', 'LBP 251DW', '3325i', 'L3210', 'L1210', 'P2035', 'LBP 6030'],
  suppliers: ['Anahtar Bilgisayar', 'Enes Bilişim', 'Kendi Malımız'],
  tonerModels: ['1643', '505', '259x'],
  whatsappNumber: '',
  appUrl: '',
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
  // --- INVOICES ---
  getInvoices: async (): Promise<InvoiceRecord[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.INVOICES));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as InvoiceRecord));
    } catch (e) { return []; }
  },

  addInvoice: async (invoice: InvoiceRecord) => {
    const { id, ...data } = invoice;
    return await addDoc(collection(db, COLLECTIONS.INVOICES), cleanData(data));
  },

  updateInvoice: async (invoice: InvoiceRecord) => {
    if (!invoice.id) return;
    const { id, ...data } = invoice;
    await updateDoc(doc(db, COLLECTIONS.INVOICES, id), cleanData(data));
  },

  // --- MONTHLY INVOICES ---
  getMonthlyInvoices: async (): Promise<MonthlyInvoice[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.MONTHLY_INVOICES));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as MonthlyInvoice));
    } catch (e) { return []; }
  },

  saveMonthlyInvoice: async (invoice: MonthlyInvoice) => {
    const { id, ...data } = invoice;
    if (id) {
      await updateDoc(doc(db, COLLECTIONS.MONTHLY_INVOICES, id), cleanData(data));
    } else {
      await addDoc(collection(db, COLLECTIONS.MONTHLY_INVOICES), cleanData(data));
    }
  },

  deleteMonthlyInvoice: async (id: string) => {
    if (!id) throw new Error("ID required");
    await deleteDoc(doc(db, COLLECTIONS.MONTHLY_INVOICES, id));
  },

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

  getNotesByPrinter: async (printerId: string): Promise<Note[]> => {
    try {
      const q = query(collection(db, COLLECTIONS.NOTES), where('printerId', '==', printerId), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Note));
    } catch (e) { return []; }
  },

  addNote: async (note: Note) => {
    const { id, ...data } = note;
    const docRef = await addDoc(collection(db, COLLECTIONS.NOTES), cleanData(data));
    await StorageService.addActivity({
      id: '',
      date: new Date().toISOString(),
      user: note.user,
      action: 'NOT_EKLENDI',
      details: `"${note.title}" başlıklı yeni bir not oluşturuldu.`
    });
    return docRef.id;
  },

  updateNote: async (note: Note) => {
    if (!note.id) return;
    const { id, ...data } = note;
    await updateDoc(doc(db, COLLECTIONS.NOTES, id), cleanData(data));
  },

  deleteNote: async (id: string, user: string, title: string) => {
    await deleteDoc(doc(db, COLLECTIONS.NOTES, id));
    await StorageService.addActivity({
      id: '',
      date: new Date().toISOString(),
      user: user,
      action: 'NOT_SILINDI',
      details: `"${title}" başlıklı not silindi.`
    });
  },

  // --- ACTIVITIES ---
  getActivities: async (): Promise<ActivityLog[]> => {
    try {
      const q = query(collection(db, COLLECTIONS.ACTIVITIES), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as ActivityLog));
    } catch (e) { return []; }
  },

  addActivity: async (activity: ActivityLog) => {
    const { id, ...data } = activity;
    await addDoc(collection(db, COLLECTIONS.ACTIVITIES), cleanData(data));
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

  // --- SERVICES ---
  getServiceRecords: async (): Promise<ServiceRecord[]> => {
    const q = query(collection(db, COLLECTIONS.SERVICES), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as ServiceRecord));
  },

  addServiceRecord: async (record: ServiceRecord, user: string) => {
    const { id, ...data } = record;
    const docRef = await addDoc(collection(db, COLLECTIONS.SERVICES), cleanData(data));
    return docRef.id;
  },

  updateServiceRecord: async (record: ServiceRecord, user: string) => {
    if (!record.id) return;
    const { id, ...data } = record;
    await updateDoc(doc(db, COLLECTIONS.SERVICES, id), cleanData({ ...data, lastModifiedBy: user }));
  },

  deleteServiceRecord: async (id: string, user: string, printerName: string) => {
    await deleteDoc(doc(db, COLLECTIONS.SERVICES, id));
  },

  // --- COUNTERS ---
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

  // Implementation for simulation fetching counter data
  fetchPrinterCounterSimulated: async (printer: Printer) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const base = printer.lastCounter || 0;
    const increment = Math.floor(Math.random() * 500) + 50;
    const total = base + increment;
    
    if (printer.isColor) {
      const bwBase = printer.lastCounterBW || Math.floor(base * 0.7);
      const colorBase = printer.lastCounterColor || Math.floor(base * 0.3);
      const bwInc = Math.floor(increment * 0.8);
      const colorInc = increment - bwInc;
      return { total, bw: bwBase + bwInc, color: colorBase + colorInc };
    }
    
    return { total, bw: total, color: 0 };
  },

  getConfig: async (): Promise<SystemConfig> => {
    const docSnap = await getDoc(doc(db, COLLECTIONS.CONFIG, 'main_config'));
    return docSnap.exists() ? { ...INITIAL_CONFIG, ...docSnap.data() as SystemConfig } : INITIAL_CONFIG;
  },

  saveConfig: async (config: SystemConfig) => {
    await setDoc(doc(db, COLLECTIONS.CONFIG, 'main_config'), cleanData(config));
  }
};
