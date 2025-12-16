import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, query, orderBy, getDoc, where } from 'firebase/firestore';
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

// Helper to handle Firestore errors
const handleDbError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  if (error.code === 'permission-denied') {
    alert('HATA: Veritabanı yazma izni reddedildi!\n\nFirebase Console > Firestore Database > Rules sekmesinden "allow read, write: if true;" ayarını yaptığınızdan emin olun.');
  } else {
    alert(`İşlem sırasında hata oluştu: ${error.message}`);
  }
  throw error;
};

export const StorageService = {
  
  // --- AUTH ---
  getUsers: async (): Promise<User[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      const users = snapshot.docs.map(doc => ({ ...doc.data() as any } as User));
      
      // If no users exist (first run), create admin
      if (users.length === 0) {
        const defaultAdmin: User = { username: 'admin', name: 'Sistem Yöneticisi', role: 'admin', password: 'yasam' }; 
        await addDoc(collection(db, COLLECTIONS.USERS), defaultAdmin).catch(e => handleDbError(e, 'createDefaultUser'));
        return [defaultAdmin];
      }
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
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
      console.error("Error getPrinters", e);
      return [];
    }
  },

  addPrinter: async (printer: Printer) => {
    try {
      const { id, ...data } = printer; 
      const docRef = await addDoc(collection(db, COLLECTIONS.PRINTERS), data);
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
      await updateDoc(printerRef, data);
    } catch (e) {
      handleDbError(e, 'updatePrinter');
    }
  },

  deletePrinter: async (printerId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.PRINTERS, printerId));
    } catch (e) {
      handleDbError(e, 'deletePrinter');
    }
  },

  // --- STOCKS ---
  getStocks: async (): Promise<TonerStock[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.STOCKS));
      return snapshot.docs.map(doc => ({ ...doc.data() as any } as TonerStock));
    } catch (e) {
      console.error("Error getStocks", e);
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
        await addDoc(collection(db, COLLECTIONS.STOCKS), stock);
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
      console.error("Error getLogs", e);
      return [];
    }
  },

  addLog: async (log: StockLog) => {
    try {
      const { id, ...data } = log;
      await addDoc(collection(db, COLLECTIONS.LOGS), data);
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
      await addDoc(collection(db, COLLECTIONS.SERVICES), data);
    } catch (e) {
      handleDbError(e, 'addServiceRecord');
    }
  },

  // --- COUNTERS (NEW) ---
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
       // 1. Add Log
       const { id, ...data } = log;
       await addDoc(collection(db, COLLECTIONS.COUNTERS), data);

       // 2. Update Printer's Last Counter ONLY if requested
       if (updateMasterRecord) {
         const printerRef = doc(db, COLLECTIONS.PRINTERS, log.printerId);
         
         const updatePayload: any = { lastCounter: log.currentCounter };
         
         // Update sub-counters if available
         if (log.currentBW !== undefined) updatePayload.lastCounterBW = log.currentBW;
         if (log.currentColor !== undefined) updatePayload.lastCounterColor = log.currentColor;

         await updateDoc(printerRef, updatePayload);
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
        const data = docSnap.data() as SystemConfig;
        // Merge with initial defaults to ensure new fields exist
        return { ...INITIAL_CONFIG, ...data };
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
      await setDoc(docRef, config);
    } catch (e) {
      handleDbError(e, 'saveConfig');
    }
  },

  runMaintenance: async () => {
     await StorageService.getConfig();
  }
};