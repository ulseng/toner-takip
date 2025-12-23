import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Hash, Printer as PrinterIcon, Edit2, X, Wifi, Usb, Globe, Trash2, History, Truck, AlertTriangle, QrCode, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertCircle, Archive, RefreshCw, Users, UserPlus, Filter, Wallet, Calendar, Database, ArrowRight, Grid, Printer, ArrowUp, Loader2, Activity, Calculator, TrendingUp, BarChart3, ChevronLeft, Palette, Copy, Share2, ExternalLink } from 'lucide-react';
import { Printer as PrinterType, SystemConfig, StockLog, ServiceRecord, PrinterStatus, CounterLog } from '../types';
import { StorageService } from '../services/storage';
import { LoadingScreen } from './LoadingScreen';
import { INITIAL_PRINTER_DATA } from './Settings';

interface PrinterListProps {
  onSelectPrinter?: (printer: PrinterType) => void;
  targetPrinterId?: string | null;
  clearTarget?: () => void;
}

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
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [qrPrinter, setQrPrinter] = useState<PrinterType | null>(null);
  const [editingPrinter, setEditingPrinter] = useState<PrinterType | null>(null);
  const [selectedPrinterHistory, setSelectedPrinterHistory] = useState<{
      printer: PrinterType, 
      tonerLogs: StockLog[], 
      serviceLogs: ServiceRecord[], 
      counterLogs: CounterLog[], 
      stats: PrinterStats
  } | null>(null);

  const [formData, setFormData] = useState<Partial<PrinterType>>({
    brand: '',
    model: '',
    serialNumber: '',
    shortCode: '',
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
  const [connectedUsersInput, setConnectedUsersInput] = useState('');

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (qrPrinter) { setQrPrinter(null); return; }
      if (isHistoryModalOpen) { setIsHistoryModalOpen(false); return; }
      if (isFormModalOpen) { setIsFormModalOpen(false); setEditingPrinter(null); return; }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [qrPrinter, isHistoryModalOpen, isFormModalOpen]);

  useEffect(() => {
    if (targetPrinterId && printers.length > 0) {
      const target = printers.find(p => p.id === targetPrinterId);
      if (target) openHistoryModal(target);
      if (clearTarget) clearTarget();
    }
  }, [targetPrinterId, printers]);

  const loadData = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([StorageService.getPrinters(), StorageService.getConfig()]);
    
    // Auto-fix missing short codes if any exist without one
    const missingCodes = p.some(printer => !printer.shortCode || printer.shortCode.length < 4);
    if (missingCodes) {
       console.log("Missing short codes detected, fixing...");
       await StorageService.fixMissingShortCodes();
       const updatedP = await StorageService.getPrinters();
       setPrinters(updatedP);
    } else {
       setPrinters(p);
    }
    
    setConfig(c);
    setLoading(false);
  };

  const getBrandLogoUrl = (brand: string) => {
    if (config.brandImages?.[brand]) return config.brandImages[brand];
    const b = brand.toLowerCase();
    if (b.includes('canon')) return 'https://cdn.simpleicons.org/canon/CC0000';
    if (b.includes('hp')) return 'https://cdn.simpleicons.org/hp/0096D6';
    if (b.includes('epson')) return 'https://cdn.simpleicons.org/epson/003399';
    return null;
  };

  const getModelImageUrl = (model: string) => config.modelImages?.[model] || null;

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if(window.confirm("Bu yazıcıyı silmek istediğinize emin misiniz?")) {
        StorageService.deletePrinter(id).then(() => loadData());
    }
  };

  const handleEditClick = (e: React.MouseEvent, printer: PrinterType) => {
    e.preventDefault(); e.stopPropagation();
    openFormModal(printer);
  };

  const handleQrClick = (e: React.MouseEvent, printer: PrinterType) => {
    e.preventDefault(); e.stopPropagation();
    window.history.pushState({ modal: 'qr' }, '');
    setQrPrinter(printer);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const usersArray = connectedUsersInput.split(',').map(u => u.trim()).filter(u => u.length > 0);
    const finalData = { ...formData, connectedUsers: usersArray };
    if (editingPrinter?.id) {
       await StorageService.updatePrinter({ ...editingPrinter, ...finalData } as PrinterType);
    } else {
       await StorageService.addPrinter({ id: '', lastTonerDate: new Date().toISOString(), ...finalData as PrinterType, status: finalData.status || 'ACTIVE' });
    }
    window.history.back();
    loadData();
  };

  const openFormModal = (printer?: PrinterType) => {
    window.history.pushState({ modal: 'form' }, '');
    if (printer) {
      setEditingPrinter(printer); setFormData(printer);
      setConnectedUsersInput(printer.connectedUsers?.join(', ') || '');
    } else {
      setEditingPrinter(null);
      setFormData({ brand: config.brands[0] || 'Canon', model: config.models[0] || '', status: 'ACTIVE', connectionType: 'USB' });
      setConnectedUsersInput('');
    }
    setIsFormModalOpen(true);
  };

  const openHistoryModal = async (printer: PrinterType) => {
    window.history.pushState({ modal: 'history' }, '');
    const [allLogs, allServices, allCounterLogs] = await Promise.all([StorageService.getLogs(), StorageService.getServiceRecords(), StorageService.getCounterLogs()]);
    const printerLogs = allLogs.filter(log => log.printerId === printer.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const printerServices = allServices.filter(srv => srv.printerId === printer.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const printerCounterLogs = allCounterLogs.filter(l => l.printerId === printer.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const totalSpent = printerLogs.reduce((sum, log) => sum + (log.cost || 0), 0) + printerServices.reduce((sum, srv) => sum + (srv.cost || 0), 0);
    setSelectedPrinterHistory({ printer, tonerLogs: printerLogs, serviceLogs: printerServices, counterLogs: printerCounterLogs, stats: { totalSpent, avgTonerDays: '---', totalServiceCount: printerServices.length, lastServiceDate: printerServices[0]?.date || null } });
    setIsHistoryModalOpen(true);
  };

  const copyShortCode = (code: string) => {
      navigator.clipboard.writeText(code);
      alert("Kod kopyalandı: " + code);
  };

  const filteredPrinters = printers.filter(p => {
    const searchLower = searchTerm.toLocaleLowerCase('tr-TR');
    return (p.model.toLocaleLowerCase('tr-TR').includes(searchLower) || p.location.toLocaleLowerCase('tr-TR').includes(searchLower) || p.shortCode?.includes(searchLower) || p.serialNumber.toLocaleLowerCase('tr-TR').includes(searchLower));
  });

  if (loading) return <LoadingScreen message="Yazıcılar listeleniyor..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div><h2 className="text-2xl font-bold text-zinc-800 dark:text-white">Cihaz Yönetimi</h2><p className="text-sm text-zinc-500 dark:text-zinc-400">Toplam {printers.length} yazıcı</p></div>
        <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={loadData} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 transition-colors"><RefreshCw size={20}/></button>
            <button onClick={() => openFormModal()} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"><Plus size={18} /> Yeni Cihaz</button>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="text-zinc-400" size={20} /></div>
        <input type="text" placeholder="Hızlı Kod (#), Model veya Konum ara..." className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-transparent bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm focus:border-emerald-500 outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPrinters.map(printer => (
          <div key={printer.id} className="group rounded-2xl shadow-sm hover:shadow-xl border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-300 flex flex-col relative">
            <button onClick={(e) => handleQrClick(e, printer)} className="absolute top-4 right-4 p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl shadow-sm hover:text-emerald-600 hover:scale-110 transition-all z-10"><QrCode size={20} /></button>
            <div className="p-5 flex-1 cursor-pointer active:opacity-80 transition-opacity" onClick={() => openHistoryModal(printer)}>
              <div className="flex justify-between items-start mb-3 pr-10">
                  <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-1.5 bg-zinc-800 dark:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider w-fit shadow-sm"><MapPin size={12} className="text-emerald-400 shrink-0" /> {printer.location}</div>
                       <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit tracking-wide bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400`}>{printer.status}</span>
                  </div>
              </div>
              <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-zinc-800 dark:text-white mb-2 group-hover:text-emerald-600 transition-colors truncate">{printer.model}</h3>
                      <div className="space-y-2 mt-4">
                          <div className="flex items-center gap-2 mb-4">
                            {getBrandLogoUrl(printer.brand) ? <img src={getBrandLogoUrl(printer.brand)!} className="h-4 w-auto opacity-70 dark:invert" /> : <span className="text-xs font-bold text-zinc-400">{printer.brand}</span>}
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">#{printer.shortCode || '----'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-xs pt-3 border-t border-zinc-100 dark:border-zinc-800"><Hash size={14} className="text-zinc-400" /> <span className="font-mono">{printer.serialNumber}</span></div>
                          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-xs"><Calculator size={14} className="text-zinc-400" /> <span className="font-mono font-bold text-blue-500">{printer.lastCounter.toLocaleString()}</span></div>
                      </div>
                  </div>
                  {getModelImageUrl(printer.model) && <div className="w-16 shrink-0 flex items-center justify-center"><img src={getModelImageUrl(printer.model)!} className="max-h-20 w-full object-contain drop-shadow-md" /></div>}
              </div>
            </div>
            <div className="grid grid-cols-2 border-t border-zinc-100 dark:border-zinc-800 divide-x divide-zinc-100 dark:border-zinc-800">
                <button onClick={(e) => handleEditClick(e, printer)} className="py-4 flex items-center justify-center gap-2 text-blue-600 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Edit2 size={18} /> Düzenle</button>
                <button onClick={(e) => confirmDelete(e, printer.id)} className="py-4 flex items-center justify-center gap-2 text-red-600 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={18} /> Sil</button>
            </div>
          </div>
        ))}
      </div>

       {/* QR MODAL VIEWER */}
       {qrPrinter && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
                  <button onClick={() => window.history.back()} className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"><X size={20}/></button>
                  
                  <div className="p-8 flex flex-col items-center text-center">
                      <div className="mb-6 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-3xl shadow-inner border-2 border-zinc-100 dark:border-zinc-700">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + window.location.pathname + '?pid=' + qrPrinter.id + '&sc=' + (qrPrinter.shortCode || ''))}`}
                            alt="Printer QR"
                            className="w-48 h-48 object-contain"
                          />
                      </div>
                      
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-1">{qrPrinter.model}</h3>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold mb-4 flex items-center gap-1.5"><MapPin size={16}/> {qrPrinter.location}</p>
                      
                      <div className="w-full bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 mb-6 border border-zinc-100 dark:border-zinc-700">
                          <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">Cihaz Hızlı Kodu</p>
                          <div className="flex items-center justify-center gap-3">
                              <span className="text-4xl font-black text-zinc-900 dark:text-white">#{qrPrinter.shortCode}</span>
                              <button onClick={() => copyShortCode(qrPrinter.shortCode || '')} className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors"><Copy size={20}/></button>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 w-full">
                          <button 
                            onClick={() => window.print()}
                            className="flex items-center justify-center gap-2 py-3 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
                          >
                             <Download size={18}/> Kaydet
                          </button>
                          <button 
                            onClick={() => copyShortCode(qrPrinter.shortCode || '')}
                            className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-colors"
                          >
                             <Share2 size={18}/> Paylaş
                          </button>
                      </div>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 text-center border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] text-zinc-400 font-medium">Bu QR kod doğrudan cihaza ve sayaç girişine yönlendirir.</p>
                  </div>
              </div>
          </div>
       )}

       {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-3xl md:rounded-2xl w-full md:max-w-lg shadow-2xl h-[90vh] md:h-auto overflow-hidden flex flex-col animate-in slide-in-from-bottom-full duration-300">
             <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-zinc-800 dark:text-white">{editingPrinter ? 'Cihazı Düzenle' : 'Yeni Cihaz Ekle'}</h3>
              <button type="button" onClick={() => window.history.back()} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full"><X size={20}/></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4 flex-1">
                <form id="printer-form" onSubmit={handleSave} className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-zinc-400 mb-1">MARKA</label><select required className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}><option value="">Seçiniz</option>{config.brands.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                        <div><label className="block text-xs font-bold text-zinc-400 mb-1">MODEL</label><select required className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})}><option value="">Seçiniz</option>{config.models.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-zinc-400 mb-1">KONUM</label><input type="text" required className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-zinc-400 mb-1">KAT</label><input type="text" required className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800" value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} /></div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-zinc-400 mb-1">SERİ NO</label><input type="text" className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 font-mono" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-zinc-400 mb-1">HIZLI KOD (#)</label><input type="text" className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold" value={formData.shortCode} onChange={e => setFormData({...formData, shortCode: e.target.value})} placeholder="Otomatik atanır" /></div>
                   </div>
                   <div><label className="block text-xs font-bold text-zinc-400 mb-1">DURUM</label><select className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as PrinterStatus})}><option value="ACTIVE">Aktif</option><option value="SPARE">Yedekte</option><option value="MAINTENANCE">Serviste</option><option value="BROKEN">Arızalı</option><option value="SCRAPPED">Hurda</option></select></div>
                </form>
            </div>
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-3 bg-white dark:bg-zinc-900 pb-[env(safe-area-inset-bottom)]">
                <button type="button" onClick={() => window.history.back()} className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold">İptal</button>
                <button form="printer-form" type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold">Kaydet</button>
            </div>
          </div>
        </div>
       )}
    </div>
  );
};