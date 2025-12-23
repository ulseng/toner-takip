import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, query, orderBy, getDoc, where, writeBatch } from 'firebase/firestore';
import { Printer, TonerStock, StockLog, SystemConfig, ServiceRecord, User, CounterLog } from '../types';

const COLLECTIONS = {
  PRINTERS: 'printers',
  STOCKS: 'stocks',
  LOGS: 'logs',
  CONFIG: 'config',
  SERVICES: 'services',
  USERS: 'users',
  COUNTERS: 'counters'
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

const handleDbError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  if (error.code === 'permission-denied') {
    alert('HATA: Veritabanı yazma izni reddedildi!');
  } else {
    alert(`İşlem sırasında hata oluştu: ${error.message}`);
  }
  throw error;
};

const cleanData = (data: any) => {
  const newObj = { ...data };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === undefined) {
      delete newObj[key];
    }
  });
  return newObj;
};

export const StorageService = {
  
  // --- AUTH ---
  getUsers: async (): Promise<User[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      const users = snapshot.docs.map(doc => ({ ...doc.data() as any } as User));
      if (users.length === 0) {
        const defaultAdmin: User = { username: 'admin', name: 'Sistem Yöneticisi', role: 'admin', password: 'yasam' }; 
        await addDoc(collection(db, COLLECTIONS.USERS), defaultAdmin);
        return [defaultAdmin];
      }
      return users;
    } catch (error) {
      return [];
    }
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
    } catch (e) {
      return [];
    }
  },

  addPrinter: async (printer: Printer) => {
    try {
      const printers = await StorageService.getPrinters();
      
      if (!printer.shortCode) {
        const codes = printers.map(p => parseInt(p.shortCode || '1000')).filter(n => !isNaN(n) && n >= 1000);
        const maxCode = codes.length > 0 ? Math.max(...codes) : 1000;
        printer.shortCode = (maxCode + 1).toString();
      }

      const { id, ...data } = printer; 
      const docRef = await addDoc(collection(db, COLLECTIONS.PRINTERS), cleanData(data));
      return docRef.id;
    } catch (e) {
      handleDbError(e, 'addPrinter');
      return '';
    }
  },

  updatePrinter: async (printer: Printer) => {
    if (!printer.id) return;
    try {
      const printerRef = doc(db, COLLECTIONS.PRINTERS, printer.id);
      const { id, ...data } = printer;
      await updateDoc(printerRef, cleanData(data));
    } catch (e) {
      handleDbError(e, 'updatePrinter');
    }
  },

  // Simulated live fetch for network printers
  // In real life, this would call a local Python/Node proxy that executes SNMP
  fetchPrinterCounterSimulated: async (printer: Printer): Promise<{total: number, bw: number, color?: number}> => {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    // Simulate a counter increase based on average daily usage (e.g., 5-50 pages)
    const dailyUsage = Math.floor(Math.random() * 45) + 5;
    const newTotal = printer.lastCounter + dailyUsage;
    
    if (printer.isColor) {
      const colorUsage = Math.floor(dailyUsage * 0.2);
      const bwUsage = dailyUsage - colorUsage;
      return {
        total: newTotal,
        bw: (printer.lastCounterBW || 0) + bwUsage,
        color: (printer.lastCounterColor || 0) + colorUsage
      };
    }
    
    return {
      total: newTotal,
      bw: newTotal
    };
  },

  deletePrinter: async (printerId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.PRINTERS, printerId));
    } catch (e) {
      handleDbError(e, 'deletePrinter');
    }
  },

  fixMissingShortCodes: async () => {
    try {
      const printers = await StorageService.getPrinters();
      const batch = writeBatch(db);
      let updatedCount = 0;

      const existingCodes = printers
        .map(p => parseInt(p.shortCode || '0'))
        .filter(n => n >= 1000);
      
      let nextCode = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1001;

      for (const p of printers) {
        if (!p.shortCode || parseInt(p.shortCode) < 1000) {
          const printerRef = doc(db, COLLECTIONS.PRINTERS, p.id);
          batch.update(printerRef, { shortCode: nextCode.toString() });
          nextCode++;
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        await batch.commit();
      }
      return updatedCount;
    } catch (e) {
      console.error("Fixing short codes failed:", e);
      return 0;
    }
  },

  findPrinterByShortCode: async (code: string): Promise<Printer | null> => {
    try {
      const q = query(collection(db, COLLECTIONS.PRINTERS), where('shortCode', '==', code.trim()));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() as any } as Printer;
    } catch (e) {
      return null;
    }
  },

  // --- STOCKS ---
  getStocks: async (): Promise<TonerStock[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.STOCKS));
      return snapshot.docs.map(doc => ({ ...doc.data() as any } as TonerStock));
    } catch (e) {
      return [];
    }
  },

  saveStock: async (stock: TonerStock) => {
    try {
      const q = query(collection(db, COLLECTIONS.STOCKS));
      const snapshot = await getDocs(q);
      const existingDoc = snapshot.docs.find(d => (d.data() as TonerStock).modelName === stock.modelName);

      if (existingDoc) {
        await updateDoc(doc(db, COLLECTIONS.STOCKS, existingDoc.id), { quantity: stock.quantity });
      } else {
        await addDoc(collection(db, COLLECTIONS.STOCKS), cleanData(stock));
      }
    } catch (e) {
      handleDbError(e, 'saveStock');
    }
  },

  // --- LOGS ---
  getLogs: async (): Promise<StockLog[]> => {
    try {
      const q = query(collection(db, COLLECTIONS.LOGS), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as StockLog));
    } catch (e) {
      return [];
    }
  },

  addLog: async (log: StockLog) => {
    try {
      const { id, ...data } = log;
      await addDoc(collection(db, COLLECTIONS.LOGS), cleanData(data));
    } catch (e) {
      handleDbError(e, 'addLog');
    }
  },

  // --- SERVICES ---
  getServiceRecords: async (): Promise<ServiceRecord[]> => {
     try {
      const q = query(collection(db, COLLECTIONS.SERVICES), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as ServiceRecord));
     } catch (e) {
       return [];
     }
  },

  addServiceRecord: async (record: ServiceRecord) => {
    try {
      const { id, ...data } = record;
      await addDoc(collection(db, COLLECTIONS.SERVICES), cleanData(data));
    } catch (e) {
      handleDbError(e, 'addServiceRecord');
    }
  },

  // --- COUNTERS ---
  getCounterLogs: async (): Promise<CounterLog[]> => {
    try {
      const q = query(collection(db, COLLECTIONS.COUNTERS), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as CounterLog));
    } catch (e) {
      return [];
    }
  },

  addCounterLog: async (log: CounterLog, updateMasterRecord: boolean = true) => {
    try {
       const { id, ...data } = log;
       await addDoc(collection(db, COLLECTIONS.COUNTERS), cleanData(data));
       if (updateMasterRecord) {
         const printerRef = doc(db, COLLECTIONS.PRINTERS, log.printerId);
         const updatePayload: any = { lastCounter: log.currentCounter };
         if (log.currentBW !== undefined) updatePayload.lastCounterBW = log.currentBW;
         if (log.currentColor !== undefined) updatePayload.lastCounterColor = log.currentColor;
         await updateDoc(printerRef, cleanData(updatePayload));
       }
    } catch (e) {
      handleDbError(e, 'addCounterLog');
    }
  },

  // --- CONFIG ---
  getConfig: async (): Promise<SystemConfig> => {
    try {
      const docRef = doc(db, COLLECTIONS.CONFIG, 'main_config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...INITIAL_CONFIG, ...docSnap.data() as SystemConfig };
      } else {
        await setDoc(docRef, INITIAL_CONFIG);
        return INITIAL_CONFIG;
      }
    } catch (e) {
      return INITIAL_CONFIG;
    }
  },

  saveConfig: async (config: SystemConfig) => {
    try {
      const docRef = doc(db, COLLECTIONS.CONFIG, 'main_config');
      await setDoc(docRef, cleanData(config));
    } catch (e) {
      handleDbError(e, 'saveConfig');
    }
  },

  runMaintenance: async () => {
     await StorageService.getConfig();
  }
};