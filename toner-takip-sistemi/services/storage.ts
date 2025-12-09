import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { Printer, TonerStock, StockLog, SystemConfig, ServiceRecord, User } from '../types';

const COLLECTIONS = {
  PRINTERS: 'printers',
  STOCKS: 'stocks',
  LOGS: 'logs',
  CONFIG: 'config',
  SERVICES: 'services',
  USERS: 'users'
};

const INITIAL_CONFIG: SystemConfig = {
  brands: ['Canon', 'HP', 'Kyocera', 'Xerox', 'Epson'],
  models: ['MF416dw', 'iF1643', 'LBP 251DW', '3325i', 'L3210', 'L1210', 'P2035', 'LBP 6030'],
  suppliers: ['Anahtar Bilgisayar', 'Enes Bilişim', 'Kendi Malımız'],
  tonerModels: ['1643', '505', '259x'],
  whatsappNumber: ''
};

export const StorageService = {
  
  // --- AUTH ---
  getUsers: async (): Promise<User[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      const users = snapshot.docs.map(doc => ({ ...doc.data() } as User));
      
      // If no users exist (first run), create admin
      if (users.length === 0) {
        const defaultAdmin: User = { username: 'admin', name: 'Sistem Yöneticisi', role: 'admin', password: 'yasam' }; // Varsayılan şifre basitleştirildi
        await addDoc(collection(db, COLLECTIONS.USERS), defaultAdmin);
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Printer));
    } catch (e) {
      console.error("Error getPrinters", e);
      return [];
    }
  },

  // In Firebase, we add individually, not save the whole array
  addPrinter: async (printer: Printer) => {
    const { id, ...data } = printer; // Remove ID if it exists (Firestore generates one) or let Firestore handle it
    const docRef = await addDoc(collection(db, COLLECTIONS.PRINTERS), data);
    return docRef.id;
  },

  updatePrinter: async (printer: Printer) => {
    if (!printer.id) return;
    const printerRef = doc(db, COLLECTIONS.PRINTERS, printer.id);
    const { id, ...data } = printer;
    await updateDoc(printerRef, data);
  },

  deletePrinter: async (printerId: string) => {
    await deleteDoc(doc(db, COLLECTIONS.PRINTERS, printerId));
  },

  // --- STOCKS ---
  getStocks: async (): Promise<TonerStock[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.STOCKS));
      return snapshot.docs.map(doc => ({ ...doc.data() } as TonerStock));
    } catch (e) {
      console.error("Error getStocks", e);
      return [];
    }
  },

  // We need to sync stocks carefully. 
  // For simplicity in migration, we will overwrite the specific stock model document
  saveStock: async (stock: TonerStock) => {
    // Check if doc exists with this model name to update, or add new
    const q = query(collection(db, COLLECTIONS.STOCKS));
    const snapshot = await getDocs(q);
    const existingDoc = snapshot.docs.find(d => d.data().modelName === stock.modelName);

    if (existingDoc) {
      await updateDoc(doc(db, COLLECTIONS.STOCKS, existingDoc.id), { quantity: stock.quantity });
    } else {
      await addDoc(collection(db, COLLECTIONS.STOCKS), stock);
    }
  },

  // --- LOGS ---
  getLogs: async (): Promise<StockLog[]> => {
    try {
      // Order by date desc
      const q = query(collection(db, COLLECTIONS.LOGS), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockLog));
    } catch (e) {
      console.error("Error getLogs", e);
      return [];
    }
  },

  addLog: async (log: StockLog) => {
    const { id, ...data } = log;
    await addDoc(collection(db, COLLECTIONS.LOGS), data);
  },

  // --- SERVICES ---
  getServiceRecords: async (): Promise<ServiceRecord[]> => {
     try {
      const q = query(collection(db, COLLECTIONS.SERVICES), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord));
     } catch (e) {
       return [];
     }
  },

  addServiceRecord: async (record: ServiceRecord) => {
    const { id, ...data } = record;
    await addDoc(collection(db, COLLECTIONS.SERVICES), data);
  },

  // --- CONFIG ---
  // Store config as a single document with ID 'main_config'
  getConfig: async (): Promise<SystemConfig> => {
    try {
      const docRef = doc(db, COLLECTIONS.CONFIG, 'main_config');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as SystemConfig;
      } else {
        // Init default
        await setDoc(docRef, INITIAL_CONFIG);
        return INITIAL_CONFIG;
      }
    } catch (e) {
      return INITIAL_CONFIG;
    }
  },

  saveConfig: async (config: SystemConfig) => {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'main_config');
    await setDoc(docRef, config);
  },

  // DB Maintenance is mostly auto-handled by Firestore structure now
  runMaintenance: async () => {
     // Just trigger a config fetch to ensure defaults
     await StorageService.getConfig();
  }
};