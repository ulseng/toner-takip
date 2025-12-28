
import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Hash, Printer as PrinterIcon, Edit2, X, Wifi, Usb, Trash2, QrCode, Download, RefreshCw, Wallet, Calendar, Calculator, BarChart3, Copy, Share2, Wrench, Droplet, Globe, Activity, ChevronRight, TrendingUp } from 'lucide-react';
import { Printer as PrinterType, SystemConfig, StockLog, ServiceRecord, PrinterStatus, CounterLog } from '../types';
import { StorageService } from '../services/storage';
import { LoadingScreen } from './LoadingScreen';

interface PrinterListProps {
  onSelectPrinter?: (printer: PrinterType) => void;
  targetPrinterId?: string | null;
  clearTarget?: () => void;
}

interface PrinterStats {
  totalSpent: number;
  totalServiceCost: number;
  totalTonerCost: number;
  lastServiceDate: string | null;
  tonerCount: number;
}

export const PrinterList: React.FC<PrinterListProps> = ({ targetPrinterId, clearTarget }) => {
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [config, setConfig] = useState<SystemConfig>({ brands: [], models: [], suppliers: [], tonerModels: [], brandImages: {}, modelImages: {} });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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
    connectionType: 'USB',
    ipAddress: '',
    status: 'ACTIVE'
  });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handlePopState = () => {
      setQrPrinter(null);
      setIsHistoryModalOpen(false);
      setIsFormModalOpen(false);
      setEditingPrinter(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (qrPrinter || isHistoryModalOpen || isFormModalOpen) {
          window.history.back();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
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
    
    // Auto-fix missing short codes
    const needsFix = p.some(printer => !printer.shortCode || printer.shortCode.length < 4);
    if (needsFix) {
       await StorageService.fixMissingShortCodes();
       const updatedP = await StorageService.getPrinters();
       setPrinters(updatedP);
    } else {
       setPrinters(p);
    }
    
    setConfig(c);
    setLoading(false);
  };

  const openFormModal = (printer?: PrinterType) => {
    window.history.pushState({ modal: 'form' }, '');
    if (printer) {
      setEditingPrinter(printer); setFormData(printer);
    } else {
      setEditingPrinter(null);
      setFormData({ brand: config.brands[0] || '', model: config.models[0] || '', status: 'ACTIVE', connectionType: 'USB' });
    }
    setIsFormModalOpen(true);
  };

  const openHistoryModal = async (printer: PrinterType) => {
    window.history.pushState({ modal: 'history' }, '');
    const [allLogs, allServices, allCounterLogs] = await Promise.all([
        StorageService.getLogs(), 
        StorageService.getServiceRecords(), 
        StorageService.getCounterLogs()
    ]);

    const tonerLogs = allLogs.filter(log => log.printerId === printer.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const serviceLogs = allServices.filter(srv => srv.printerId === printer.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const counterLogs = allCounterLogs.filter(l => l.printerId === printer.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalTonerCost = tonerLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const totalServiceCost = serviceLogs.reduce((sum, srv) => sum + (srv.cost || 0), 0);

    setSelectedPrinterHistory({ 
        printer, tonerLogs, serviceLogs, counterLogs, 
        stats: { totalSpent: totalTonerCost + totalServiceCost, totalTonerCost, totalServiceCost, lastServiceDate: serviceLogs[0]?.date || null, tonerCount: tonerLogs.length } 
    });
    setIsHistoryModalOpen(true);
  };

  const confirmDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (window.confirm('Bu yazıcıyı kalıcı olarak silmek istediğinize emin misiniz?')) {
      await StorageService.deletePrinter(id);
      loadData();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPrinter?.id) {
       await StorageService.updatePrinter({ ...editingPrinter, ...formData } as PrinterType);
    } else {
       await StorageService.addPrinter({ id: '', lastTonerDate: new Date().toISOString(), ...formData as PrinterType });
    }
    window.history.back();
    loadData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
      case 'MAINTENANCE': return 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]';
      case 'BROKEN': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
      case 'SPARE': return 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
      default: return 'bg-zinc-500';
    }
  };

  const filteredPrinters = printers.filter(p => {
    const s = searchTerm.toLocaleLowerCase('tr-TR');
    return (
        p.model.toLocaleLowerCase('tr-TR').includes(s) || 
        p.location.toLocaleLowerCase('tr-TR').includes(s) || 
        p.shortCode?.includes(s) || 
        p.serialNumber.toLocaleLowerCase('tr-TR').includes(s) ||
        p.ipAddress?.includes(s)
    );
  });

  if (loading) return <LoadingScreen message="Sistem senkronize ediliyor..." />;

  return (
    <div className="space-y-8 pb-32">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white dark:bg-zinc-950 p-8 rounded-[2rem] shadow-2xl border border-zinc-100 dark:border-zinc-900 overflow-hidden relative group transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16"></div>
        <div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">CİHAZ HAVUZU</h2>
          <p className="text-sm font-bold text-zinc-400 mt-1 uppercase tracking-widest">{printers.length} Kayıtlı Yazıcı</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto relative z-10">
            <button onClick={loadData} className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all active:scale-95"><RefreshCw size={24}/></button>
            <button onClick={() => openFormModal()} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-black shadow-xl shadow-emerald-500/20 transition-all active:scale-95"><Plus size={24} /> YENİ CİHAZ</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-emerald-500 transition-colors"><Search size={24} /></div>
        <input type="text" placeholder="Hızlı Kod (#), IP, Model veya Lokasyon ara..." className="w-full pl-16 pr-8 py-6 rounded-[2rem] border-2 border-transparent bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPrinters.map(printer => (
          <div key={printer.id} className="group rounded-[2.5rem] shadow-lg hover:shadow-2xl border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 overflow-hidden transition-all duration-500 flex flex-col relative hover:-translate-y-2">
            {/* Status Glow Dot */}
            <div className={`absolute top-6 left-6 w-3 h-3 rounded-full ${getStatusBadge(printer.status)} z-20`}></div>
            
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.history.pushState({modal:'qr'},''); setQrPrinter(printer); }} className="absolute top-5 right-5 p-3.5 bg-zinc-100/50 dark:bg-zinc-900/50 backdrop-blur-xl text-zinc-600 dark:text-zinc-400 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 shadow-sm hover:text-emerald-500 hover:scale-110 transition-all z-10"><QrCode size={22} /></button>
            
            <div className="p-8 flex-1 cursor-pointer active:opacity-90 transition-opacity" onClick={() => openHistoryModal(printer)}>
              <div className="flex flex-col gap-4">
                  <div className="space-y-1">
                       <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-black text-xs uppercase tracking-widest pl-5"><MapPin size={14} className="text-emerald-500" /> {printer.location}</div>
                       <p className="text-[10px] text-zinc-400 font-bold uppercase pl-5 opacity-60">{printer.floor}</p>
                  </div>
                  
                  <div className="flex gap-4">
                      <div className="flex-1">
                          <h3 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight group-hover:text-emerald-500 transition-colors">{printer.brand} {printer.model}</h3>
                          <div className="flex flex-wrap gap-2 mt-4">
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50 tracking-widest">#{printer.shortCode}</span>
                            {printer.connectionType === 'Network' ? (
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/50 uppercase"><Wifi size={14}/> {printer.ipAddress}</span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-xl uppercase border border-zinc-100 dark:border-zinc-800"><Usb size={14}/> USB</span>
                            )}
                          </div>
                      </div>
                      {config.modelImages?.[printer.model] && <div className="w-24 h-24 shrink-0 flex items-center justify-center p-2 bg-zinc-50 dark:bg-zinc-900 rounded-3xl group-hover:rotate-3 transition-transform"><img src={config.modelImages[printer.model]} className="max-h-full w-full object-contain drop-shadow-2xl" /></div>}
                  </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
                  <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">GÜNCEL SAYFA</span>
                      <span className="text-xl font-mono font-black text-zinc-900 dark:text-white">{printer.lastCounter.toLocaleString()}</span>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform"><TrendingUp size={24}/></div>
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openFormModal(printer); }} className="py-6 flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 font-black text-xs uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-600 transition-all border-r border-zinc-100 dark:border-zinc-900"><Edit2 size={18} /> DÜZENLE</button>
                <button onClick={(e) => confirmDelete(e, printer.id)} className="py-6 flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 font-black text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500 transition-all"><Trash2 size={18} /> SİL</button>
            </div>
          </div>
        ))}
      </div>

       {/* HISTORY DRAWER */}
       {isHistoryModalOpen && selectedPrinterHistory && (
         <div className="fixed inset-0 z-[120] flex justify-end">
             <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => window.history.back()}></div>
             <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
                 {/* Detail Header */}
                 <div className="p-10 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-start">
                     <div>
                        <div className="flex items-center gap-3 mb-4">
                           <span className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(16,185,129,0.3)]">#{selectedPrinterHistory.printer.shortCode}</span>
                           <span className="text-zinc-400 text-xs font-mono font-black tracking-widest">{selectedPrinterHistory.printer.serialNumber}</span>
                        </div>
                        <h3 className="text-4xl font-black text-zinc-900 dark:text-white leading-none">{selectedPrinterHistory.printer.brand} {selectedPrinterHistory.printer.model}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-5">
                           <p className="text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 p-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-900"><MapPin size={18}/> {selectedPrinterHistory.printer.location} ({selectedPrinterHistory.printer.floor})</p>
                           {selectedPrinterHistory.printer.connectionType === 'Network' && (
                               <p className="text-blue-600 dark:text-blue-400 font-black text-xs flex items-center gap-2 bg-blue-50 dark:bg-blue-950 p-2.5 rounded-2xl border border-blue-100 dark:border-blue-900"><Globe size={18}/> {selectedPrinterHistory.printer.ipAddress}</p>
                           )}
                        </div>
                     </div>
                     <button onClick={() => window.history.back()} className="p-4 bg-white dark:bg-zinc-800 rounded-[1.5rem] text-zinc-400 hover:text-red-500 shadow-2xl transition-all active:scale-90"><X size={32}/></button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-zinc-50/20 dark:bg-black">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500 transition-colors">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">TOPLAM ENDEKS</p>
                            <p className="text-3xl font-black text-zinc-900 dark:text-white font-mono">{selectedPrinterHistory.printer.lastCounter.toLocaleString()}</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">SİSTEM MALİYETİ</p>
                            <p className="text-3xl font-black text-emerald-600 font-mono">{selectedPrinterHistory.stats.totalSpent.toLocaleString()} ₺</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm col-span-2 sm:col-span-1">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">TONER DEĞİŞİMİ</p>
                            <p className="text-3xl font-black text-orange-500 font-mono">{selectedPrinterHistory.stats.tonerCount}</p>
                        </div>
                    </div>

                    <section>
                        <h4 className="flex items-center gap-3 text-2xl font-black text-zinc-900 dark:text-white mb-8 pl-2"><Droplet size={28} className="text-orange-500" /> TONER ARŞİVİ</h4>
                        <div className="space-y-4">
                            {selectedPrinterHistory.tonerLogs.length === 0 ? <p className="text-zinc-400 font-bold p-10 bg-zinc-100 dark:bg-zinc-900 rounded-3xl text-center">Henüz kayıtlı toner değişimi bulunmuyor.</p> : 
                                selectedPrinterHistory.tonerLogs.map(log => (
                                    <div key={log.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:border-orange-500 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-orange-50 dark:bg-orange-950 text-orange-600 rounded-2xl"><Droplet size={24}/></div>
                                            <div>
                                                <p className="font-black text-zinc-900 dark:text-white text-xl uppercase tracking-tight">{log.tonerModel}</p>
                                                <p className="text-xs text-zinc-400 font-bold mt-1 flex items-center gap-1.5"><Calendar size={14}/> {new Date(log.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-zinc-600 dark:text-zinc-400">{log.user}</p>
                                            {log.cost ? <p className="text-xs font-black text-emerald-500 mt-1">{log.cost.toLocaleString()} ₺</p> : null}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </section>

                    <section>
                        <h4 className="flex items-center gap-3 text-2xl font-black text-zinc-900 dark:text-white mb-8 pl-2"><Wrench size={28} className="text-blue-500" /> TEKNİK KAYITLAR</h4>
                        <div className="space-y-6">
                            {selectedPrinterHistory.serviceLogs.length === 0 ? <p className="text-zinc-400 font-bold p-10 bg-zinc-100 dark:bg-zinc-900 rounded-3xl text-center">Cihaz tertemiz, kayıt yok.</p> : 
                                selectedPrinterHistory.serviceLogs.map(srv => (
                                    <div key={srv.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border-l-[8px] border-blue-500 shadow-xl">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.2em] ${srv.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{srv.status}</span>
                                            <span className="text-xs text-zinc-400 font-black">{new Date(srv.date).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <p className="font-black text-zinc-900 dark:text-white text-xl mb-2">{srv.issue}</p>
                                        <p className="text-sm text-zinc-500 font-bold">{srv.actionTaken}</p>
                                        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{srv.provider}</p>
                                            <p className="font-black text-2xl text-blue-600 font-mono">{srv.cost.toLocaleString()} ₺</p>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </section>
                 </div>
                 
                 <div className="p-8 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex gap-4 pb-[env(safe-area-inset-bottom)]">
                     <button onClick={() => { window.history.back(); openFormModal(selectedPrinterHistory.printer); }} className="flex-1 py-6 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-white rounded-3xl font-black text-sm tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 border border-zinc-200 dark:border-zinc-800">DÜZENLE</button>
                     <button onClick={() => window.history.back()} className="flex-1 py-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-3xl font-black text-sm tracking-widest active:scale-95 shadow-2xl">KAPAT</button>
                 </div>
             </div>
         </div>
       )}

       {/* QR OVERLAY */}
       {qrPrinter && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
              <div className="bg-white dark:bg-zinc-900 rounded-[3rem] w-full max-w-sm overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] relative animate-in zoom-in-95 duration-500 border border-zinc-200 dark:border-zinc-800">
                  <button onClick={() => window.history.back()} className="absolute top-8 right-8 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-500 hover:text-red-500 transition-all active:scale-90"><X size={28}/></button>
                  <div className="p-12 flex flex-col items-center text-center">
                      <div className="mb-10 bg-white p-8 rounded-[3rem] shadow-2xl border-2 border-zinc-50 dark:border-zinc-800">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + window.location.pathname + '?pid=' + qrPrinter.id + '&sc=' + (qrPrinter.shortCode || ''))}`} alt="QR" className="w-48 h-48 object-contain" />
                      </div>
                      <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 leading-none">TONER TAKİP</h3>
                      <p className="text-zinc-500 font-bold mb-4">{qrPrinter.brand} {qrPrinter.model}</p>
                      <p className="text-emerald-500 font-black mb-10 flex items-center gap-2"><MapPin size={20}/> {qrPrinter.location}</p>
                      <div className="w-full bg-zinc-900 dark:bg-emerald-950/40 p-8 rounded-[2rem] mb-10 border border-emerald-500/20">
                          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.4em] mb-3">HIZLI ERİŞİM</p>
                          <span className="text-6xl font-black text-white dark:text-emerald-400 tracking-tighter">#{qrPrinter.shortCode}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 w-full">
                          <button onClick={() => window.print()} className="py-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-3xl font-black active:scale-95">YAZDIR</button>
                          <button onClick={() => { navigator.clipboard.writeText(qrPrinter.shortCode || ''); alert('Kopyalandı!'); }} className="py-5 bg-emerald-600 text-white rounded-3xl font-black shadow-lg shadow-emerald-500/20 active:scale-95">KOPYALA</button>
                      </div>
                  </div>
              </div>
          </div>
       )}

       {/* FORM OVERLAY */}
       {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[150] flex items-end md:items-center justify-center md:p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-950 rounded-t-[3rem] md:rounded-[3.5rem] w-full md:max-w-2xl shadow-2xl h-[94vh] md:h-auto overflow-hidden flex flex-col animate-in slide-in-from-bottom-full duration-500 border border-zinc-100 dark:border-zinc-900">
             <div className="p-10 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
              <div>
                <h3 className="font-black text-3xl text-zinc-900 dark:text-white tracking-tighter uppercase">{editingPrinter ? 'CİHAZ DÜZENLE' : 'YENİ CİHAZ KAYDI'}</h3>
                <p className="text-sm font-bold text-zinc-400 mt-1 uppercase tracking-widest">Envanter Veri Girişi</p>
              </div>
              <button type="button" onClick={() => window.history.back()} className="p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl transition-all active:scale-90"><X size={28}/></button>
            </div>
            <div className="overflow-y-auto p-10 space-y-8 flex-1 custom-scrollbar">
                <form id="printer-form" onSubmit={handleSave} className="space-y-8">
                   <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">MARKA</label><select required className="w-full p-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold outline-none focus:border-emerald-500" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}><option value="">Seç</option>{config.brands.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">MODEL</label><select required className="w-full p-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold outline-none focus:border-emerald-500" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})}><option value="">Seç</option>{config.models.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">LOKASYON</label><input type="text" required className="w-full p-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold outline-none focus:border-emerald-500" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">KAT/BİRİM</label><input type="text" required className="w-full p-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold outline-none focus:border-emerald-500" value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} /></div>
                   </div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">SERİ NUMARASI</label><input type="text" required className="w-full p-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono font-black outline-none focus:border-emerald-500" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} /></div>
                   <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 space-y-6">
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">AĞ VE BAĞLANTI</label>
                        <div className="flex gap-4">
                            <button type="button" onClick={() => setFormData({...formData, connectionType: 'Network'})} className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2 ${formData.connectionType === 'Network' ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400'}`}><Wifi size={20}/> NETWORK</button>
                            <button type="button" onClick={() => setFormData({...formData, connectionType: 'USB'})} className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2 ${formData.connectionType === 'USB' ? 'bg-zinc-900 border-zinc-900 text-white shadow-xl' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400'}`}><Usb size={20}/> USB PORT</button>
                        </div>
                        {formData.connectionType === 'Network' && (
                            <div className="animate-in slide-in-from-top-4 duration-300">
                                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 ml-1">SABİT IP ADRESİ</label>
                                <input type="text" placeholder="192.168.1.xxx" className="w-full p-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white font-mono font-black outline-none focus:border-blue-500" value={formData.ipAddress} onChange={e => setFormData({...formData, ipAddress: e.target.value})} />
                            </div>
                        )}
                   </div>
                </form>
            </div>
            <div className="p-10 border-t border-zinc-100 dark:border-zinc-900 flex gap-4 bg-white dark:bg-zinc-950 pb-[env(safe-area-inset-bottom)]">
                <button type="button" onClick={() => window.history.back()} className="flex-1 py-6 bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] font-black text-zinc-600 dark:text-zinc-300 transition-all active:scale-95">İPTAL</button>
                <button form="printer-form" type="submit" className="flex-1 py-6 bg-emerald-600 text-white rounded-[2rem] font-black shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all">SİSTEME KAYDET</button>
            </div>
          </div>
        </div>
       )}
    </div>
  );
};
