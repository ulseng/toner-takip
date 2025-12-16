import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Hash, Printer as PrinterIcon, Edit2, X, Wifi, Usb, Globe, Trash2, History, Truck, AlertTriangle, QrCode, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertCircle, Archive, RefreshCw, Users, UserPlus, Filter, Wallet, Calendar, Database, ArrowRight, Grid, Printer, ArrowUp, Loader2, Activity, Calculator, TrendingUp, BarChart3, ChevronLeft, Palette } from 'lucide-react';
import { Printer as PrinterType, SystemConfig, StockLog, ServiceRecord, PrinterStatus, CounterLog } from '../types';
import { StorageService } from '../services/storage';
import { LoadingScreen } from './LoadingScreen';
import { INITIAL_PRINTER_DATA } from './Settings';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PrinterListProps {
  onSelectPrinter?: (printer: PrinterType) => void;
  targetPrinterId?: string | null;
  clearTarget?: () => void;
}

// Stats Interface
interface PrinterStats {
  totalSpent: number;
  avgTonerDays: number | string;
  totalServiceCount: number;
  lastServiceDate: string | null;
}

export const PrinterList: React.FC<PrinterListProps> = ({ onSelectPrinter, targetPrinterId, clearTarget }) => {
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [config, setConfig] = useState<SystemConfig>({ brands: [], models: [], suppliers: [], tonerModels: [], brandImages: {}, modelImages: {} });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Confirmation Modal State for Stock Out
  const [showStockConfirmation, setShowStockConfirmation] = useState(false);
  const [isProcessingStock, setIsProcessingStock] = useState(false);
  
  // QR Code Modal (Single)
  const [qrPrinter, setQrPrinter] = useState<PrinterType | null>(null);
  
  const [editingPrinter, setEditingPrinter] = useState<PrinterType | null>(null);
  const [selectedPrinterHistory, setSelectedPrinterHistory] = useState<{
      printer: PrinterType, 
      tonerLogs: StockLog[], 
      serviceLogs: ServiceRecord[], 
      counterLogs: CounterLog[], 
      stats: PrinterStats
  } | null>(null);

  // Quick Import State
  const [isQuickImporting, setIsQuickImporting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<PrinterType>>({
    brand: '',
    model: '',
    serialNumber: '',
    location: '',
    floor: '',
    lastCounter: 0,
    compatibleToner: '',
    connectionType: 'USB',
    ipAddress: '',
    supplier: '',
    status: 'ACTIVE',
    connectedUsers: [],
    isColor: false
  });

  // Helper for text area input handling for users
  const [connectedUsersInput, setConnectedUsersInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  // --- HISTORY / BACK BUTTON HANDLER ---
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Priority Check: Close the top-most modal first
      // 1. Stock Confirmation (Inside History)
      if (showStockConfirmation) {
        setShowStockConfirmation(false);
        return; 
      }
      
      // 2. QR Modal
      if (qrPrinter) {
        setQrPrinter(null);
        return;
      }
      
      // 3. History Modal
      if (isHistoryModalOpen) {
        setIsHistoryModalOpen(false);
        return;
      }

      // 4. Form Modal
      if (isFormModalOpen) {
        setIsFormModalOpen(false);
        setEditingPrinter(null);
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showStockConfirmation, qrPrinter, isHistoryModalOpen, isFormModalOpen]);


  // Deep Linking Logic
  useEffect(() => {
    if (targetPrinterId && printers.length > 0) {
      const target = printers.find(p => p.id === targetPrinterId);
      if (target) {
        openHistoryModal(target);
      }
      if (clearTarget) clearTarget();
    }
  }, [targetPrinterId, printers]);

  // --- ESC KEY LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Check if any modal is open
        if (showStockConfirmation || qrPrinter || isHistoryModalOpen || isFormModalOpen) {
             e.preventDefault(); // Prevent default browser escape behavior
             e.stopPropagation();
             window.history.back(); // Trigger the popstate logic
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [qrPrinter, isHistoryModalOpen, isFormModalOpen, showStockConfirmation]);

  const loadData = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      StorageService.getPrinters(),
      StorageService.getConfig()
    ]);
    setPrinters(p);
    setConfig(c);
    setLoading(false);
  };

  // --- HELPER: BRAND LOGO ---
  const getBrandLogoUrl = (brand: string) => {
    // 1. Check custom user uploaded image from config
    if (config.brandImages && config.brandImages[brand]) {
        return config.brandImages[brand];
    }

    // 2. Fallback to Simple Icons CDN
    const b = brand.toLowerCase();
    if (b.includes('canon')) return 'https://cdn.simpleicons.org/canon/CC0000';
    if (b.includes('hp')) return 'https://cdn.simpleicons.org/hp/0096D6';
    if (b.includes('epson')) return 'https://cdn.simpleicons.org/epson/003399';
    if (b.includes('xerox')) return 'https://cdn.simpleicons.org/xerox/DA1A32';
    if (b.includes('kyocera')) return 'https://cdn.simpleicons.org/kyocera/E60012';
    if (b.includes('samsung')) return 'https://cdn.simpleicons.org/samsung/1428A0';
    if (b.includes('brother')) return 'https://cdn.simpleicons.org/brother/003C6A';
    if (b.includes('lexmark')) return 'https://cdn.simpleicons.org/lexmark/202020';
    if (b.includes('oki')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/OKI_Logo.svg/320px-OKI_Logo.svg.png'; // Fallback for OKI
    return null; // fallback to text
  };

  // --- HELPER: MODEL IMAGE ---
  const getModelImageUrl = (model: string) => {
      if (config.modelImages && config.modelImages[model]) {
          return config.modelImages[model];
      }
      return null;
  }

  // --- QUICK IMPORT ---
  const handleQuickImport = async () => {
    setIsQuickImporting(true);
    try {
        for (const item of INITIAL_PRINTER_DATA) {
            const isUsb = item.ip === 'USB' || item.ip === '-' || item.ip === '' || item.ip === null;
            const connectionType = isUsb ? 'USB' : 'Network';
            let ipAddress = '';
            if (!isUsb) {
                ipAddress = item.ip.length <= 3 ? `192.168.1.${item.ip}` : item.ip;
            }

            const newPrinter: PrinterType = {
                id: '',
                serialNumber: item.s,
                brand: 'Canon',
                model: item.m,
                location: item.l,
                floor: 'Giriş/Poliklinik',
                lastCounter: 0,
                lastTonerDate: new Date().toISOString(),
                compatibleToner: '',
                connectionType,
                ipAddress,
                supplier: 'Anahtar Bilgisayar',
                status: 'ACTIVE',
                connectedUsers: []
            };
            await StorageService.addPrinter(newPrinter);
            await new Promise(resolve => setTimeout(resolve, 30));
        }
        await loadData();
    } catch (e) {
        alert('Yükleme hatası.');
    } finally {
        setIsQuickImporting(false);
    }
  };

  // --- ACTIONS ---

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Use window.confirm for now as the simplest deletion confirmation in this list
    if(window.confirm("Bu yazıcıyı silmek istediğinize emin misiniz?")) {
        setDeleteId(id);
        // Direct call since we are using native confirm
        StorageService.deletePrinter(id).then(() => {
            loadData();
            setDeleteId(null);
        });
    }
  };

  const handleEditClick = (e: React.MouseEvent, printer: PrinterType) => {
    e.preventDefault();
    e.stopPropagation();
    openFormModal(printer);
  };

  const handleQrClick = (e: React.MouseEvent, printer: PrinterType) => {
    e.preventDefault();
    e.stopPropagation();
    // Push history state so back button works
    window.history.pushState({ modal: 'qr' }, '');
    setQrPrinter(printer);
  };

  const handleHistoryClick = (printer: PrinterType) => {
    openHistoryModal(printer);
  };

  // NEW: Handle quick status change from History Modal
  const handleStatusChange = async (newStatus: PrinterStatus) => {
    if (!selectedPrinterHistory) return;

    const updatedPrinter = { ...selectedPrinterHistory.printer, status: newStatus };

    // 1. Optimistic UI Update (Modal)
    setSelectedPrinterHistory({
        ...selectedPrinterHistory,
        printer: updatedPrinter
    });

    // 2. Optimistic UI Update (List Background)
    setPrinters(prev => prev.map(p => p.id === updatedPrinter.id ? updatedPrinter : p));

    // 3. Persist to DB
    try {
        await StorageService.updatePrinter(updatedPrinter);
    } catch (error) {
        console.error("Status update failed", error);
        alert("Durum güncellenemedi.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert users string to array
    const usersArray = connectedUsersInput.split(',').map(u => u.trim()).filter(u => u.length > 0);

    const finalData = {
        ...formData,
        connectedUsers: usersArray
    };

    if (editingPrinter && editingPrinter.id) {
       // Update
       const updatedPrinter = { ...editingPrinter, ...finalData } as PrinterType;
       await StorageService.updatePrinter(updatedPrinter);
    } else {
       // Create
       const newPrinter: PrinterType = {
        id: '', // Generated by Firestore
        lastTonerDate: new Date().toISOString(),
        ...finalData as PrinterType,
        status: finalData.status || 'ACTIVE'
       };
       await StorageService.addPrinter(newPrinter);
    }

    // Go back in history to close modal
    window.history.back();
    loadData(); // Reload list from DB
  };

  const downloadInventoryCSV = () => {
    if (printers.length === 0) {
      alert('İndirilecek veri yok.');
      return;
    }

    const headers = ["Marka", "Model", "Seri No", "Konum", "Kat", "Son Sayaç", "SB Sayaç", "Renkli Sayaç", "Toner", "IP", "Durum", "Tedarikçi", "Kullanıcılar"];
    
    const rows = printers.map(p => {
        const clean = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
        const users = p.connectedUsers ? p.connectedUsers.join('; ') : '';
        return [
            clean(p.brand),
            clean(p.model),
            clean(p.serialNumber),
            clean(p.location),
            clean(p.floor),
            clean(p.lastCounter),
            clean(p.lastCounterBW || 0),
            clean(p.lastCounterColor || 0),
            clean(p.compatibleToner),
            clean(p.ipAddress || 'USB'),
            clean(p.status),
            clean(p.supplier),
            clean(users)
        ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `yazici_envanter_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- MODAL HELPERS ---

  const openFormModal = (printer?: PrinterType) => {
    // Push history state
    window.history.pushState({ modal: 'form' }, '');

    if (printer) {
      setEditingPrinter(printer);
      setFormData(printer);
      setConnectedUsersInput(printer.connectedUsers ? printer.connectedUsers.join(', ') : '');
    } else {
      setEditingPrinter(null);
      setFormData({
        brand: config.brands[0] || '',
        model: config.models[0] || '',
        serialNumber: '',
        location: '',
        floor: '',
        lastCounter: 0,
        compatibleToner: '',
        connectionType: 'USB',
        ipAddress: '',
        supplier: config.suppliers[0] || '',
        status: 'ACTIVE',
        connectedUsers: [],
        isColor: false
      });
      setConnectedUsersInput('');
    }
    setIsFormModalOpen(true);
  };

  // This function explicitly calls history back, which triggers the popstate listener
  const closeModalViaBack = () => {
    window.history.back(); 
  };

  const openHistoryModal = async (printer: PrinterType) => {
    // Push history state
    window.history.pushState({ modal: 'history' }, '');

    // Fetch fresh logs for this specific history view
    const allLogs = await StorageService.getLogs();
    const allServices = await StorageService.getServiceRecords();
    const allCounterLogs = await StorageService.getCounterLogs();

    // 1. Filter Logs
    const printerLogs = allLogs.filter(log => String(log.printerId) === String(printer.id)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const printerServices = allServices.filter(srv => String(srv.printerId) === String(printer.id)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Filter and Sort Counter Logs (Oldest to Newest for Chart)
    const printerCounterLogs = allCounterLogs
        .filter(l => l.printerId === printer.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 2. Calculate Stats
    // Cost
    const totalTonerCost = printerLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const totalServiceCost = printerServices.reduce((sum, srv) => sum + (srv.cost || 0), 0);
    const totalSpent = totalTonerCost + totalServiceCost;

    // Average Toner Life (Days)
    let avgDays = 0;
    if (printerLogs.length > 1) {
        let totalDays = 0;
        let intervals = 0;
        // Iterate chronologically (reverse sorted logs)
        const chronoLogs = [...printerLogs].reverse();
        for (let i = 0; i < chronoLogs.length - 1; i++) {
            const date1 = new Date(chronoLogs[i].date).getTime();
            const date2 = new Date(chronoLogs[i+1].date).getTime();
            const diffDays = (date2 - date1) / (1000 * 3600 * 24);
            if (diffDays > 0) {
                totalDays += diffDays;
                intervals++;
            }
        }
        if (intervals > 0) avgDays = Math.round(totalDays / intervals);
    }

    const stats: PrinterStats = {
        totalSpent,
        avgTonerDays: avgDays > 0 ? avgDays : 'Yetersiz Veri',
        totalServiceCount: printerServices.length,
        lastServiceDate: printerServices.length > 0 ? printerServices[0].date : null
    };

    setSelectedPrinterHistory({
      printer,
      tonerLogs: printerLogs,
      serviceLogs: printerServices,
      counterLogs: printerCounterLogs,
      stats
    });
    setIsHistoryModalOpen(true);
  };

  // Step 1: Check Availability and Show Modal
  const handleInitiateQuickStockOut = async () => {
      if (!selectedPrinterHistory) return;
      const printer = selectedPrinterHistory.printer;

      if (!printer.compatibleToner) {
          alert("HATA: Bu yazıcı için tanımlı 'Uyumlu Toner' modeli yok. Lütfen önce cihazı düzenleyip toner modeli seçin.");
          return;
      }
      
      // Check stock availability BEFORE showing confirmation
      const allStocks = await StorageService.getStocks();
      const stockItem = allStocks.find(s => s.modelName === printer.compatibleToner);
      
      if (!stockItem || stockItem.quantity < 1) {
          alert(`HATA: ${printer.compatibleToner} model tonerden stokta kalmamış!`);
          return;
      }

      // Add history state for confirmation modal so ESC/Back works for this layer too
      window.history.pushState({ modal: 'stockConfirm' }, '');
      setShowStockConfirmation(true);
  };

  // Step 2: Actually Perform Stock Out
  const handleFinalizeStockOut = async () => {
      if (!selectedPrinterHistory) return;
      setIsProcessingStock(true);
      
      const printer = selectedPrinterHistory.printer;
      
      try {
          // 1. Re-fetch stocks to be absolutely sure (concurrency check)
          const allStocks = await StorageService.getStocks();
          const stockItem = allStocks.find(s => s.modelName === printer.compatibleToner);

          if (!stockItem || stockItem.quantity < 1) {
              alert(`HATA: İşlem sırasında stok tükendi!`);
              setIsProcessingStock(false);
              // Close confirmation layer via back
              window.history.back();
              return;
          }

          // 2. Decrement Stock
          await StorageService.saveStock({ modelName: printer.compatibleToner, quantity: stockItem.quantity - 1 });

          // 3. Update Printer Date
          const updatedPrinter = { ...printer, lastTonerDate: new Date().toISOString() };
          await StorageService.updatePrinter(updatedPrinter);

          // 4. Create Log
          const log: StockLog = {
              id: '',
              date: new Date().toISOString(),
              type: 'OUT',
              tonerModel: printer.compatibleToner,
              quantity: 1,
              printerId: printer.id,
              description: `Yazıcıya Takıldı: ${printer.location} (${printer.floor}) [QR Hızlı İşlem]`,
              user: 'Sistem (QR)'
          };
          await StorageService.addLog(log);

          // Success Logic: Close confirmation via back
          window.history.back(); // This closes the confirmation modal

          // Don't close history modal, let user see it updated
          loadData(); // Refresh main list
          alert("İşlem Başarılı! Stok düşüldü ve cihaz güncellendi.");

      } catch (e) {
          console.error(e);
          alert("Bir hata oluştu.");
      } finally {
          setIsProcessingStock(false);
      }
  };


  // FILTER LOGIC
  const uniqueFloors = ['ALL', ...Array.from(new Set(printers.map(p => p.floor))).filter(Boolean)];
  const uniqueStatuses = ['ALL', ...Array.from(new Set(printers.map(p => p.status))).filter(Boolean)];

  const filteredPrinters = printers.filter(p => {
    const matchesSearch = 
        p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFloor = selectedFloor === 'ALL' || p.floor === selectedFloor;
    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;

    return matchesSearch && matchesFloor && matchesStatus;
  });

  // ... (Status Helpers remain the same) ...
  const getStatusColor = (status: PrinterStatus) => {
    switch (status) {
      case 'ACTIVE': return 'border-emerald-500/30 bg-white dark:bg-zinc-900';
      case 'SPARE': return 'border-indigo-500/30 bg-white dark:bg-zinc-900';
      case 'MAINTENANCE': return 'border-orange-500/30 bg-orange-50 dark:bg-orange-900/10';
      case 'BROKEN': return 'border-red-500/30 bg-red-50 dark:bg-red-900/10';
      case 'SCRAPPED': return 'border-zinc-500/30 bg-zinc-100 dark:bg-zinc-800 opacity-75';
      default: return 'border-zinc-200 dark:border-zinc-800';
    }
  };

  const getStatusLabel = (status: PrinterStatus) => {
    switch (status) {
      case 'ACTIVE': return { text: 'AKTİF', icon: <CheckCircle2 size={12} /> };
      case 'SPARE': return { text: 'YEDEKTE', icon: <Archive size={12} /> };
      case 'MAINTENANCE': return { text: 'SERVİSTE', icon: <Truck size={12} /> };
      case 'BROKEN': return { text: 'ARIZALI', icon: <AlertTriangle size={12} /> };
      case 'SCRAPPED': return { text: 'HURDA', icon: <XCircle size={12} /> };
      default: return { text: 'BİLİNMİYOR', icon: null };
    }
  };

  if (loading || isQuickImporting) {
     return <LoadingScreen message={isQuickImporting ? "Veriler yükleniyor..." : "Yazıcılar listeleniyor..."} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">Cihaz Yönetimi</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Toplam {printers.length} yazıcı listeleniyor</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
             <button onClick={loadData} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 transition-colors"><RefreshCw size={20}/></button>
            <button 
            onClick={downloadInventoryCSV}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-sm transition-all text-xs sm:text-sm"
            >
            <FileSpreadsheet size={18} /> <span className="hidden sm:inline">Excel</span>
            </button>
            <button 
            onClick={() => openFormModal()}
            className="flex-[2] sm:flex-none bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 text-xs sm:text-sm"
            >
            <Plus size={18} />
            Yeni Cihaz
            </button>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            </div>
            <input
            type="text"
            placeholder="Marka, Model, Seri No veya Konum ara..."
            className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-transparent bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Chips - Horizontal Scroll on Mobile */}
          <div className="flex overflow-x-auto gap-2 items-center pb-2 custom-scrollbar">
             <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mr-2 shrink-0">
                <Filter size={14} /> Filtre:
             </div>
             
             {/* Floor Filter */}
             <select 
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500 shrink-0"
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
             >
                <option value="ALL">Tüm Katlar</option>
                {uniqueFloors.filter(f => f !== 'ALL').map(f => <option key={f} value={f}>{f}</option>)}
             </select>

             {/* Status Filter */}
             <select 
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500 shrink-0"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
             >
                <option value="ALL">Tüm Durumlar</option>
                {uniqueStatuses.filter(s => s !== 'ALL').map(s => {
                    const label = getStatusLabel(s as PrinterStatus);
                    return <option key={s} value={s}>{label.text}</option>
                })}
             </select>

             {(selectedFloor !== 'ALL' || selectedStatus !== 'ALL') && (
                 <button onClick={() => {setSelectedFloor('ALL'); setSelectedStatus('ALL')}} className="text-xs text-red-500 hover:text-red-600 font-medium shrink-0">Temizle</button>
             )}
          </div>
      </div>

      {/* CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPrinters.map(printer => {
          const statusInfo = getStatusLabel(printer.status || 'ACTIVE');
          const cardStyle = getStatusColor(printer.status || 'ACTIVE');
          const brandLogo = getBrandLogoUrl(printer.brand);
          const modelImage = getModelImageUrl(printer.model);

          return (
            <div 
              key={printer.id} 
              className={`group rounded-2xl shadow-sm hover:shadow-xl hover:border-emerald-400/50 dark:hover:border-emerald-600/50 border-2 overflow-hidden transition-all duration-300 flex flex-col relative ${cardStyle}`}
            >
              {/* QR CODE BUTTON - ABSOLUTE TOP RIGHT */}
              <button 
                  onClick={(e) => handleQrClick(e, printer)}
                  className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-zinc-600 dark:text-zinc-300 rounded-lg shadow-sm hover:text-emerald-600 dark:hover:text-emerald-400 z-10"
                  title="QR Kod Göster"
              >
                  <QrCode size={20} />
              </button>

              {/* CARD BODY */}
              <div 
                className="p-5 flex-1 cursor-pointer relative active:opacity-80 transition-opacity"
                onClick={() => handleHistoryClick(printer)}
              >
                {/* 1. ROW: Location (Pill) and Status */}
                <div className="flex justify-between items-start mb-3 pr-10">
                    <div className="flex flex-col gap-2 max-w-full">
                         {/* Location Pill */}
                         <div className="flex items-center gap-1.5 bg-zinc-800 dark:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider w-fit shadow-sm max-w-full">
                             <MapPin size={12} className="text-emerald-400 shrink-0" />
                             <span className="truncate">{printer.location}</span>
                             <span className="opacity-60 font-normal shrink-0 hidden sm:inline">| {printer.floor}</span>
                         </div>

                        {/* Status Pill */}
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit tracking-wide
                          ${printer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                          ${printer.status === 'SPARE' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : ''}
                          ${printer.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                          ${printer.status === 'BROKEN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                          ${printer.status === 'SCRAPPED' ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' : ''}
                        `}>
                           {statusInfo.icon} {statusInfo.text}
                        </span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 min-w-0">
                        {/* 2. ROW: Model Name */}
                        <h3 className="text-xl sm:text-2xl font-bold text-zinc-800 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {printer.model}
                        </h3>
                        
                        {/* 3. ROW: Brand Logo & Details */}
                        <div className="space-y-3 mt-4">
                            
                            {/* Brand with Logo */}
                            <div className="flex items-center gap-2 mb-4">
                            {brandLogo ? (
                                <img src={brandLogo} alt={printer.brand} className="h-6 w-auto opacity-80 dark:opacity-100 dark:invert-[.10]" />
                            ) : (
                                <span className="font-bold text-zinc-400">{printer.brand}</span>
                            )}
                            {brandLogo && <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{printer.brand}</span>}
                            </div>

                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-sm border-t border-zinc-100 dark:border-zinc-800 pt-3">
                            <Hash size={16} className="text-zinc-400 shrink-0" />
                            <span className="font-mono truncate">{printer.serialNumber}</span>
                            </div>
                            
                            {/* COUNTER DISPLAY (MODIFIED for Color) */}
                            <div className="flex flex-col gap-1 text-sm">
                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                    <Calculator size={16} className="text-zinc-400 shrink-0" />
                                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                        {printer.lastCounter > 0 ? printer.lastCounter.toLocaleString() : '---'}
                                    </span>
                                </div>
                                {printer.isColor && (
                                    <div className="flex gap-2 text-[10px] ml-6">
                                        <span className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-zinc-500">SB: {printer.lastCounterBW?.toLocaleString() || '-'}</span>
                                        <span className="bg-purple-100 dark:bg-purple-900/30 px-1 rounded text-purple-600 dark:text-purple-400">RL: {printer.lastCounterColor?.toLocaleString() || '-'}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-sm">
                            {printer.connectionType === 'Network' ? <Globe size={16} className="text-emerald-500 shrink-0"/> : <Usb size={16} className="text-zinc-400 shrink-0"/>}
                            <span className="font-mono text-xs truncate">{printer.connectionType === 'Network' ? printer.ipAddress : 'USB'}</span>
                            </div>

                            {/* Users Summary Pill */}
                            {printer.connectedUsers && printer.connectedUsers.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs w-fit">
                                    <Users size={12} />
                                    <span>{printer.connectedUsers.length}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Optional Model Image Column */}
                    {modelImage && (
                        <div className="w-20 sm:w-24 shrink-0 flex items-center justify-center">
                            <img src={modelImage} alt={printer.model} className="max-h-24 sm:max-h-32 w-full object-contain drop-shadow-md rounded-md" />
                        </div>
                    )}
                </div>

              </div>

              {/* ACTION FOOTER */}
              <div className="grid grid-cols-2 border-t border-zinc-200 dark:border-zinc-800 divide-x divide-zinc-200 dark:divide-zinc-800">
                <button 
                    onClick={(e) => handleEditClick(e, printer)}
                    className="py-4 flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors active:bg-blue-100"
                >
                    <Edit2 size={18} /> <span className="hidden sm:inline">Düzenle</span>
                </button>
                <button 
                    onClick={(e) => confirmDelete(e, printer.id)}
                    className="py-4 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:bg-red-100"
                >
                    <Trash2 size={18} /> <span className="hidden sm:inline">Sil</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredPrinters.length === 0 && (
           <div className="col-span-full flex flex-col items-center justify-center py-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
              <PrinterIcon size={48} className="text-zinc-300 mb-4" />
              <p className="text-zinc-500 font-medium">Kayıtlı yazıcı bulunamadı</p>
              
              <div className="mt-6 flex flex-col gap-3 w-full max-w-sm px-6">
                <button 
                    onClick={handleQuickImport}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                    <Database size={18} />
                    Hızlı Kurulum (Excel) <ArrowRight size={16}/>
                </button>
              </div>
           </div>
        )}
      </div>

      {/* ... (QR Code Modal) ... */}
       {qrPrinter && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={closeModalViaBack}>
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative" onClick={e => e.stopPropagation()}>
                <button onClick={closeModalViaBack} className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500"><X size={20}/></button>
                
                <h3 className="text-xl font-bold text-zinc-800 dark:text-white mb-1">{qrPrinter.brand} {qrPrinter.model}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{qrPrinter.location}</p>
                
                <div className="bg-white p-4 rounded-xl border-2 border-zinc-100 inline-block mb-4">
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + window.location.pathname + '?pid=' + qrPrinter.id)}`} 
                        alt="QR Code" 
                        className="w-48 h-48"
                    />
                </div>
            </div>
        </div>
      )}

      {/* ... Add/Edit Modal (FULL SCREEN ON MOBILE) ... */}
       {isFormModalOpen && (
        <div className="fixed inset-0 bg-zinc-100/50 dark:bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-3xl md:rounded-2xl w-full md:max-w-lg shadow-2xl h-[95vh] md:h-auto md:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
             
             {/* Modal Header */}
             <div className="bg-white dark:bg-zinc-900 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center rounded-t-3xl md:rounded-t-2xl shrink-0">
              <h3 className="font-bold text-lg text-zinc-800 dark:text-white">
                {editingPrinter ? 'Cihazı Düzenle' : 'Yeni Cihaz Ekle'}
              </h3>
              <button type="button" onClick={closeModalViaBack} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 transition-colors"><X size={20} className="text-zinc-500 dark:text-zinc-300" /></button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-5 custom-scrollbar flex-1">
                <form id="printer-form" onSubmit={handleSave} className="space-y-5">
                   {/* Updated Form Inputs with Emerald focus rings */}
                   <div>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Marka</label>
                      <select 
                          required 
                          className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-base"
                          value={formData.brand} 
                          onChange={e => setFormData({...formData, brand: e.target.value})}
                      >
                          <option value="">Seçiniz</option>
                          {config.brands.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Model</label>
                      <select 
                          required 
                          className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-base"
                          value={formData.model} 
                          onChange={e => setFormData({...formData, model: e.target.value})}
                      >
                          <option value="">Seçiniz</option>
                          {config.models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Konum / Oda</label>
                        <input 
                          type="text" 
                          required
                          className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-base"
                          value={formData.location}
                          onChange={e => setFormData({...formData, location: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Kat</label>
                        <input 
                          type="text" 
                          required
                          className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-base"
                          value={formData.floor}
                          onChange={e => setFormData({...formData, floor: e.target.value})}
                        />
                      </div>
                   </div>

                   <div>
                     <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Seri Numarası</label>
                     <input 
                        type="text" 
                        className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-base"
                        value={formData.serialNumber}
                        onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Bağlantı Türü</label>
                        <select
                            className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-base"
                            value={formData.connectionType}
                            onChange={e => setFormData({...formData, connectionType: e.target.value as 'USB' | 'Network'})}
                        >
                            <option value="USB">USB</option>
                            <option value="Network">Ağ (IP)</option>
                        </select>
                     </div>
                     {formData.connectionType === 'Network' && (
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">IP Adresi</label>
                            <input 
                            type="text" 
                            className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-base"
                            placeholder="192.168.1.x"
                            value={formData.ipAddress}
                            onChange={e => setFormData({...formData, ipAddress: e.target.value})}
                            />
                        </div>
                     )}
                   </div>

                   {/* --- MULTI-COUNTER TOGGLE --- */}
                   <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                       <div>
                           <label className="font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                               <Palette size={18} className="text-purple-500"/>
                               Renkli / Çift Sayaç?
                           </label>
                           <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                               Siyah-Beyaz (SB) ve Renkli (RL) olarak iki ayrı sayaç tutar.
                           </p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={formData.isColor || false}
                                onChange={e => setFormData({...formData, isColor: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                   </div>

                   <div>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Uyumlu Toner</label>
                      <select 
                          className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-base"
                          value={formData.compatibleToner} 
                          onChange={e => setFormData({...formData, compatibleToner: e.target.value})}
                      >
                          <option value="">Seçiniz</option>
                          {config.tonerModels?.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                   </div>
                   
                   <div>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Tedarikçi / Servis</label>
                      <select 
                          className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-base"
                          value={formData.supplier} 
                          onChange={e => setFormData({...formData, supplier: e.target.value})}
                      >
                          <option value="">Seçiniz</option>
                          {config.suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>

                   <div>
                     <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Durum</label>
                     <select 
                          className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-base"
                          value={formData.status} 
                          onChange={e => setFormData({...formData, status: e.target.value as PrinterStatus})}
                      >
                          <option value="ACTIVE">Aktif</option>
                          <option value="SPARE">Yedekte</option>
                          <option value="MAINTENANCE">Serviste/Bakımda</option>
                          <option value="BROKEN">Arızalı</option>
                          <option value="SCRAPPED">Hurda</option>
                      </select>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Bağlı Kullanıcılar (Virgülle ayırın)</label>
                     <textarea 
                        rows={2}
                        className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-base"
                        placeholder="Ali Yılmaz, Ayşe Demir..."
                        value={connectedUsersInput}
                        onChange={e => setConnectedUsersInput(e.target.value)}
                     />
                   </div>
                </form>
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-3 bg-white dark:bg-zinc-900 pb-[env(safe-area-inset-bottom)]">
                <button type="button" onClick={closeModalViaBack} className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-semibold active:scale-95">İptal</button>
                <button form="printer-form" type="submit" className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-colors font-bold shadow-lg shadow-emerald-500/20 active:scale-95">
                  Kaydet
                </button>
            </div>

          </div>
        </div>
       )}

       {/* HISTORY MODAL WITH STATS & CONFIRMATION OVERLAY (FULL SCREEN ON MOBILE) */}
       {isHistoryModalOpen && selectedPrinterHistory && (
        <div className="fixed inset-0 bg-zinc-100/50 dark:bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-3xl md:rounded-2xl w-full md:max-w-2xl shadow-2xl flex flex-col h-[95vh] md:h-auto md:max-h-[90vh] animate-in slide-in-from-bottom-full duration-300 relative overflow-hidden">
            
            {/* === STOCK CONFIRMATION OVERLAY === */}
            {showStockConfirmation && (
                <div className="absolute inset-0 z-[60] bg-white/95 dark:bg-zinc-900/95 flex items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="w-full max-w-sm text-center">
                        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <AlertTriangle size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-800 dark:text-white mb-2">Emin misiniz?</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm leading-relaxed">
                            <strong>{selectedPrinterHistory.printer.compatibleToner}</strong> model toner stoktan düşülecek ve
                            bu cihazın son toner tarihi güncellenecek.
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleFinalizeStockOut}
                                disabled={isProcessingStock}
                                className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {isProcessingStock ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin"/> İşleniyor...
                                    </>
                                ) : (
                                    <>
                                        <ArrowUp size={20}/> Evet, Stok Düş
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={closeModalViaBack}
                                disabled={isProcessingStock}
                                className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Vazgeç
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start bg-zinc-50 dark:bg-zinc-900 rounded-t-3xl md:rounded-t-2xl shrink-0">
              <div>
                <button onClick={closeModalViaBack} className="md:hidden flex items-center text-zinc-500 mb-2">
                    <ChevronLeft size={16} /> Geri
                </button>
                <h3 className="text-xl font-bold text-zinc-800 dark:text-white leading-tight">{selectedPrinterHistory.printer.brand} {selectedPrinterHistory.printer.model}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 mb-2">{selectedPrinterHistory.printer.location} - {selectedPrinterHistory.printer.serialNumber}</p>
                
                {/* --- QUICK STATUS CHANGER --- */}
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                        <Activity size={12}/> Durum:
                    </span>
                    <select
                        className={`text-xs font-bold uppercase rounded px-2 py-1 outline-none border-none cursor-pointer
                            ${selectedPrinterHistory.printer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                            ${selectedPrinterHistory.printer.status === 'SPARE' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : ''}
                            ${selectedPrinterHistory.printer.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                            ${selectedPrinterHistory.printer.status === 'BROKEN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                            ${selectedPrinterHistory.printer.status === 'SCRAPPED' ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' : ''}
                        `}
                        value={selectedPrinterHistory.printer.status}
                        onChange={(e) => handleStatusChange(e.target.value as PrinterStatus)}
                    >
                        <option value="ACTIVE">🟢 Aktif</option>
                        <option value="SPARE">📦 Yedekte</option>
                        <option value="MAINTENANCE">🔧 Serviste</option>
                        <option value="BROKEN">⚠️ Arızalı</option>
                        <option value="SCRAPPED">❌ Hurda</option>
                    </select>
                </div>

              </div>
              <button onClick={closeModalViaBack} className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"><X size={20} className="text-zinc-500"/></button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar pb-24">
                
                {/* --- QUICK ACTION: TONER OUT --- */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-xl flex items-center justify-between text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-transform">
                    <div>
                        <h4 className="font-bold text-lg flex items-center gap-2"><ArrowUp size={20} className="text-white"/> Hızlı İşlem</h4>
                        <p className="text-orange-100 text-sm">
                             {selectedPrinterHistory.printer.compatibleToner ? 
                                `${selectedPrinterHistory.printer.compatibleToner} toneri stoktan düş.` : 
                                'Uyumlu toner tanımlı değil.'}
                        </p>
                    </div>
                    <button 
                        onClick={handleInitiateQuickStockOut}
                        className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        disabled={!selectedPrinterHistory.printer.compatibleToner}
                    >
                        Hızlı Stok Düş
                    </button>
                </div>

                {/* 1. SCORECARD (STATS) */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30 col-span-2 md:col-span-1">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Wallet size={12}/> Toplam Harcama
                        </p>
                        <p className="text-2xl font-bold text-zinc-800 dark:text-white">{selectedPrinterHistory.stats.totalSpent.toLocaleString()} ₺</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Calendar size={12}/> Ort. Ömür
                        </p>
                        <p className="text-lg md:text-2xl font-bold text-zinc-800 dark:text-white truncate">
                            {typeof selectedPrinterHistory.stats.avgTonerDays === 'number' ? `${selectedPrinterHistory.stats.avgTonerDays} Gün` : '-'}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30">
                        <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Truck size={12}/> Servis
                        </p>
                        <p className="text-lg md:text-2xl font-bold text-zinc-800 dark:text-white">{selectedPrinterHistory.stats.totalServiceCount}</p>
                    </div>
                </div>

                {/* 2. TONER HISTORY (MOVED UP) */}
                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
                    <History size={18} className="text-emerald-500"/> Toner Geçmişi
                  </h4>
                  <div className="space-y-3">
                    {selectedPrinterHistory.tonerLogs.length === 0 && <p className="text-zinc-400 text-sm">Toner değişim kaydı yok.</p>}
                    {selectedPrinterHistory.tonerLogs.map(log => (
                      <div key={log.id} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <div>
                          <p className="font-semibold text-zinc-700 dark:text-zinc-200">{log.tonerModel}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(log.date).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="text-right">
                           {log.type === 'OUT' && <span className="text-xs font-bold text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded">Değişim</span>}
                           <p className="text-xs text-zinc-400 mt-1">{log.user}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. SERVICE HISTORY (MOVED UP) */}
                <div>
                   <h4 className="font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
                    <Truck size={18} className="text-orange-500"/> Servis Geçmişi
                  </h4>
                   <div className="space-y-3">
                    {selectedPrinterHistory.serviceLogs.length === 0 && <p className="text-zinc-400 text-sm">Servis kaydı yok.</p>}
                    {selectedPrinterHistory.serviceLogs.map(srv => (
                      <div key={srv.id} className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                        <div className="flex justify-between items-start mb-1">
                           <span className="text-xs font-bold text-orange-700 dark:text-orange-400">{new Date(srv.date).toLocaleDateString('tr-TR')}</span>
                           <span className="text-xs font-bold text-zinc-500">{srv.cost > 0 ? `${srv.cost} ₺` : 'Ücretsiz'}</span>
                        </div>
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{srv.issue}</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">İşlem: {srv.actionTaken}</p>
                        <p className="text-left text-[10px] text-zinc-400 mt-2">{srv.provider}</p>
                      </div>
                    ))}
                   </div>
                </div>

                {/* --- COUNTER ANALYSIS CHART (MOVED TO BOTTOM) --- */}
                {selectedPrinterHistory.counterLogs.length > 0 && (
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                                <BarChart3 size={20} className="text-blue-500" /> Aylık Sayaç Analizi
                            </h4>
                            <div className="text-right">
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Son Sayaç</p>
                                <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{selectedPrinterHistory.printer.lastCounter.toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={selectedPrinterHistory.counterLogs.slice(-12)}> {/* Last 12 entries */}
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} opacity={0.5} />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(date) => new Date(date).toLocaleDateString('tr-TR', {month: 'short'})}
                                        tick={{fontSize: 10, fill: '#71717a'}}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis 
                                        tick={{fontSize: 10, fill: '#71717a'}}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                                    />
                                    <Tooltip 
                                        cursor={{fill: 'transparent'}}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                            const item = payload[0].payload;
                                            return (
                                                <div className="bg-zinc-900 text-white text-xs p-3 rounded-xl shadow-xl border border-zinc-700">
                                                    <p className="font-bold mb-1">{new Date(label).toLocaleDateString('tr-TR', {month: 'long', year: 'numeric'})}</p>
                                                    <p className="text-emerald-400 font-bold">
                                                        Kullanım: +{payload[0].value?.toLocaleString()}
                                                    </p>
                                                    {item.usageColor > 0 && (
                                                        <div className="mt-1 pt-1 border-t border-zinc-700">
                                                            <p className="text-zinc-400">SB: {item.usageBW || 0}</p>
                                                            <p className="text-purple-400">RL: {item.usageColor || 0}</p>
                                                        </div>
                                                    )}
                                                    <p className="text-zinc-400 mt-1">
                                                        Toplam: {payload[0].payload.currentCounter.toLocaleString()}
                                                    </p>
                                                </div>
                                            );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="usage" radius={[6, 6, 0, 0]}>
                                        {selectedPrinterHistory.counterLogs.slice(-12).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="#10b981" />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-center text-[10px] text-zinc-400 mt-2">Grafik son 12 kaydın aylık kullanım farklarını (Usage) gösterir.</p>
                    </div>
                )}

            </div>
          </div>
        </div>
       )}

    </div>
  );
};