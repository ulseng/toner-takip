import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Hash, Printer as PrinterIcon, Edit2, X, Wifi, Usb, Globe, Trash2, History, Truck, AlertTriangle, QrCode, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertCircle, Archive, RefreshCw, Users, UserPlus, Filter, Wallet, Calendar } from 'lucide-react';
import { Printer, SystemConfig, StockLog, ServiceRecord, PrinterStatus } from '../types';
import { StorageService } from '../services/storage';
import { LoadingScreen } from './LoadingScreen';

interface PrinterListProps {
  onSelectPrinter?: (printer: Printer) => void;
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
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [config, setConfig] = useState<SystemConfig>({ brands: [], models: [], suppliers: [], tonerModels: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // QR Code Modal
  const [qrPrinter, setQrPrinter] = useState<Printer | null>(null);

  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [selectedPrinterHistory, setSelectedPrinterHistory] = useState<{printer: Printer, tonerLogs: StockLog[], serviceLogs: ServiceRecord[], stats: PrinterStats} | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Printer>>({
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
    connectedUsers: []
  });

  // Helper for text area input handling for users
  const [connectedUsersInput, setConnectedUsersInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

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
        if (qrPrinter) {
          setQrPrinter(null);
        } else if (isHistoryModalOpen) {
          setIsHistoryModalOpen(false);
        } else if (isFormModalOpen) {
          closeFormModal();
        } else if (deleteId) {
          setDeleteId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [qrPrinter, isHistoryModalOpen, isFormModalOpen, deleteId]);

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
    const b = brand.toLowerCase();
    // Simple Icons CDN - trustworthy and comprehensive
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

  const handleEditClick = (e: React.MouseEvent, printer: Printer) => {
    e.preventDefault();
    e.stopPropagation();
    openFormModal(printer);
  };

  const handleQrClick = (e: React.MouseEvent, printer: Printer) => {
    e.preventDefault();
    e.stopPropagation();
    setQrPrinter(printer);
  };

  const handleHistoryClick = (printer: Printer) => {
    openHistoryModal(printer);
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
       const updatedPrinter = { ...editingPrinter, ...finalData } as Printer;
       await StorageService.updatePrinter(updatedPrinter);
    } else {
       // Create
       const newPrinter: Printer = {
        id: '', // Generated by Firestore
        lastTonerDate: new Date().toISOString(),
        ...finalData as Printer,
        status: finalData.status || 'ACTIVE'
       };
       await StorageService.addPrinter(newPrinter);
    }

    closeFormModal();
    loadData(); // Reload list from DB
  };

  const downloadInventoryCSV = () => {
    if (printers.length === 0) {
      alert('İndirilecek veri yok.');
      return;
    }

    const headers = ["Marka", "Model", "Seri No", "Konum", "Kat", "Son Sayaç", "Toner", "IP", "Durum", "Tedarikçi", "Kullanıcılar"];
    
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

  const openFormModal = (printer?: Printer) => {
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
        connectedUsers: []
      });
      setConnectedUsersInput('');
    }
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingPrinter(null);
  };

  const openHistoryModal = async (printer: Printer) => {
    // Fetch fresh logs for this specific history view
    const allLogs = await StorageService.getLogs();
    const allServices = await StorageService.getServiceRecords();

    // 1. Filter Logs
    const printerLogs = allLogs.filter(log => String(log.printerId) === String(printer.id)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const printerServices = allServices.filter(srv => String(srv.printerId) === String(printer.id)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
      stats
    });
    setIsHistoryModalOpen(true);
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

  if (loading) {
     return <LoadingScreen message="Yazıcılar listeleniyor..." />;
  }

  return (
    <div className="space-y-6 pb-24">
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
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-sm transition-all"
            >
            <FileSpreadsheet size={20} /> Excel
            </button>
            <button 
            onClick={() => openFormModal()}
            className="flex-[2] sm:flex-none bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
            <Plus size={20} />
            Yeni Cihaz
            </button>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="space-y-3">
          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 items-center">
             <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mr-2">
                <Filter size={14} /> Filtrele:
             </div>
             
             {/* Floor Filter */}
             <select 
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500"
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
             >
                <option value="ALL">Tüm Katlar</option>
                {uniqueFloors.filter(f => f !== 'ALL').map(f => <option key={f} value={f}>{f}</option>)}
             </select>

             {/* Status Filter */}
             <select 
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500"
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
                 <button onClick={() => {setSelectedFloor('ALL'); setSelectedStatus('ALL')}} className="text-xs text-red-500 hover:text-red-600 font-medium">Temizle</button>
             )}
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            </div>
            <input
            type="text"
            placeholder="Marka, Model, Seri No veya Konum ara..."
            className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-transparent bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
      </div>

      {/* CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPrinters.map(printer => {
          const statusInfo = getStatusLabel(printer.status || 'ACTIVE');
          const cardStyle = getStatusColor(printer.status || 'ACTIVE');
          const brandLogo = getBrandLogoUrl(printer.brand);

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
                className="p-5 flex-1 cursor-pointer relative"
                onClick={() => handleHistoryClick(printer)}
              >
                {/* 1. ROW: Location (Pill) and Status */}
                <div className="flex justify-between items-start mb-3 pr-10">
                    <div className="flex flex-col gap-2">
                         {/* Location Pill */}
                         <div className="flex items-center gap-1.5 bg-zinc-800 dark:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider w-fit shadow-sm">
                             <MapPin size={12} className="text-emerald-400" />
                             <span className="truncate max-w-[150px]">{printer.location}</span>
                             <span className="opacity-60 font-normal">| {printer.floor}</span>
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

                {/* 2. ROW: Model Name */}
                <h3 className="text-2xl font-bold text-zinc-800 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
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
                      <Hash size={16} className="text-zinc-400" />
                      <span className="font-mono">{printer.serialNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-sm">
                      {printer.connectionType === 'Network' ? <Globe size={16} className="text-emerald-500"/> : <Usb size={16} className="text-zinc-400"/>}
                      <span className="font-mono text-xs">{printer.connectionType === 'Network' ? printer.ipAddress : 'USB Bağlantı'}</span>
                    </div>

                    {/* Users Summary Pill */}
                    {printer.connectedUsers && printer.connectedUsers.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs w-fit">
                            <Users size={12} />
                            <span>{printer.connectedUsers.length} Kullanıcı Bağlı</span>
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
                    <Edit2 size={18} /> Düzenle
                </button>
                <button 
                    onClick={(e) => confirmDelete(e, printer.id)}
                    className="py-4 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:bg-red-100"
                >
                    <Trash2 size={18} /> Sil
                </button>
              </div>
            </div>
          );
        })}

        {filteredPrinters.length === 0 && (
           <div className="col-span-full flex flex-col items-center justify-center py-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
              <PrinterIcon size={48} className="text-zinc-300 mb-4" />
              <p className="text-zinc-500 font-medium">Kayıtlı yazıcı bulunamadı</p>
              <p className="text-zinc-400 text-sm">Filtreleri değiştirmeyi deneyin</p>
           </div>
        )}
      </div>

      {/* ... (QR Code Modal & Delete Modal styling updated to zinc/emerald) ... */}
       {qrPrinter && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setQrPrinter(null)}>
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setQrPrinter(null)} className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500"><X size={20}/></button>
                
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

      {/* ... Add/Edit Modal (Simplified for view) ... */}
       {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
             <div className="bg-white dark:bg-zinc-900 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg text-zinc-800 dark:text-white">
                {editingPrinter ? 'Cihazı Düzenle' : 'Yeni Cihaz Ekle'}
              </h3>
              <button type="button" onClick={closeFormModal} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 transition-colors"><X size={20} className="text-zinc-500 dark:text-zinc-300" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
               {/* Updated Form Inputs with Emerald focus rings */}
               <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Marka</label>
                  <select 
                      required 
                      className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
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
                      className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
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
                      className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Kat</label>
                    <input 
                      type="text" 
                      required
                      className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      value={formData.floor}
                      onChange={e => setFormData({...formData, floor: e.target.value})}
                    />
                  </div>
               </div>

               <div>
                 <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Seri Numarası</label>
                 <input 
                    type="text" 
                    className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono"
                    value={formData.serialNumber}
                    onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Bağlantı Türü</label>
                    <select
                        className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
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
                        className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono"
                        placeholder="192.168.1.x"
                        value={formData.ipAddress}
                        onChange={e => setFormData({...formData, ipAddress: e.target.value})}
                        />
                    </div>
                 )}
               </div>

               <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Uyumlu Toner</label>
                  <select 
                      className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
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
                      className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
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
                      className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
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
                    className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    placeholder="Ali Yılmaz, Ayşe Demir..."
                    value={connectedUsersInput}
                    onChange={e => setConnectedUsersInput(e.target.value)}
                 />
               </div>
               
               <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeFormModal} className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-semibold">İptal</button>
                <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-colors font-bold shadow-lg shadow-emerald-500/20">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
       )}

       {/* HISTORY MODAL WITH STATS */}
       {isHistoryModalOpen && selectedPrinterHistory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start bg-zinc-50 dark:bg-zinc-900 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-zinc-800 dark:text-white">{selectedPrinterHistory.printer.brand} {selectedPrinterHistory.printer.model}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{selectedPrinterHistory.printer.location} - {selectedPrinterHistory.printer.serialNumber}</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"><X size={20} className="text-zinc-500"/></button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* 1. SCORECARD (STATS) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Wallet size={12}/> Toplam Harcama
                        </p>
                        <p className="text-2xl font-bold text-zinc-800 dark:text-white">{selectedPrinterHistory.stats.totalSpent.toLocaleString()} ₺</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Calendar size={12}/> Ort. Toner Ömrü
                        </p>
                        <p className="text-2xl font-bold text-zinc-800 dark:text-white">
                            {typeof selectedPrinterHistory.stats.avgTonerDays === 'number' ? `${selectedPrinterHistory.stats.avgTonerDays} Gün` : '-'}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30">
                        <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Truck size={12}/> Servis Kaydı
                        </p>
                        <p className="text-2xl font-bold text-zinc-800 dark:text-white">{selectedPrinterHistory.stats.totalServiceCount} Kez</p>
                    </div>
                </div>

                {/* 2. TONER HISTORY */}
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

                {/* 3. SERVICE HISTORY */}
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
                        <p className="text-[10px] text-zinc-400 mt-2 text-right">{srv.provider}</p>
                      </div>
                    ))}
                   </div>
                </div>

            </div>
          </div>
        </div>
       )}

    </div>
  );
};