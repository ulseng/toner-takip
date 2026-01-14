
import React, { useState, useEffect, useMemo, memo } from 'react';
import { Plus, Search, MapPin, Printer as PrinterIcon, Edit2, X, Wifi, Usb, Trash2, QrCode, RefreshCw, Calendar, Calculator, Wrench, Droplet, Globe, TrendingUp, User as UserIcon, SortAsc, SortDesc, Filter, Layers, LayoutGrid, Type, Clock, ShieldCheck, Zap, StickyNote, Image as ImageIcon } from 'lucide-react';
import { Printer as PrinterType, SystemConfig, StockLog, ServiceRecord, CounterLog, Note } from '../types';
import { StorageService } from '../services/storage';
import { LoadingScreen } from './LoadingScreen';

// Yazıcı Kartı Bileşeni - Performans için Memoized edildi
const PrinterCard = memo(({ printer, onOpen, onEdit, onDelete, modelImage }: { 
  printer: PrinterType, 
  onOpen: (p: PrinterType) => void, 
  onEdit: (e: React.MouseEvent, p: PrinterType) => void,
  onDelete: (e: React.MouseEvent, p: PrinterType) => void,
  modelImage: string | null
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      case 'MAINTENANCE': return 'bg-orange-500';
      case 'BROKEN': return 'bg-red-500';
      default: return 'bg-zinc-500';
    }
  };

  return (
    <div 
      onClick={() => onOpen(printer)} 
      className="group rounded-[2.5rem] bg-[#121214] border border-white/5 transition-all duration-300 hover:border-emerald-500/20 active:scale-[0.98] cursor-pointer shadow-xl flex flex-col overflow-hidden"
    >
      {/* Cihaz Fotoğraf Alanı */}
      <div className="relative h-44 bg-zinc-900 flex items-center justify-center overflow-hidden border-b border-white/5">
        {modelImage ? (
          <img 
            src={modelImage} 
            alt={printer.model} 
            loading="lazy"
            className="w-full h-full object-contain p-6 transform group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-800">
             <PrinterIcon size={40} strokeWidth={1.5} />
             <span className="text-[8px] font-black uppercase tracking-widest opacity-20">Fotoğraf Yok</span>
          </div>
        )}
        <div className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${getStatusBadge(printer.status)} border-2 border-zinc-900 z-10`}></div>
        <div className="absolute bottom-3 left-4">
           <span className="bg-black/60 backdrop-blur-sm text-emerald-500 px-2 py-0.5 rounded-lg text-[9px] font-black border border-white/5">#{printer.shortCode}</span>
        </div>
      </div>

      <div className="p-6 flex-1">
          {/* Lokasyon ve Kat Bilgisi */}
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
               <MapPin size={16} strokeWidth={2.5}/>
            </div>
            <div className="flex flex-col min-w-0">
               <span className="text-base font-black text-white uppercase tracking-tight leading-tight truncate">
                 {printer.location}
               </span>
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                 {printer.floor || 'Bilinmeyen Kat'}
               </span>
            </div>
          </div>
          
          <h3 className="text-lg font-black text-zinc-400 leading-none tracking-tighter uppercase mb-4 group-hover:text-white transition-colors">
            {printer.brand} {printer.model}
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-6">
              {printer.connectionType === 'Network' ? (
                  <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-blue-500/20 flex items-center gap-1"><Wifi size={12}/> {printer.ipAddress}</span>
              ) : (
                  <span className="bg-zinc-800 text-zinc-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-white/5 flex items-center gap-1"><Usb size={12}/> USB BAĞLANTI</span>
              )}
          </div>

          <div className="pt-5 border-t border-white/5 flex justify-between items-center">
              <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">SAYAÇ</p>
                  <p className="text-2xl font-mono font-black text-white leading-none">{printer.lastCounter.toLocaleString('tr-TR')}</p>
              </div>
              <div className="flex gap-2">
                 <button onClick={(e) => onEdit(e, printer)} className="p-2.5 bg-zinc-900 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all border border-white/5"><Edit2 size={14}/></button>
                 <button onClick={(e) => onDelete(e, printer)} className="p-2.5 bg-zinc-900 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-white/5"><Trash2 size={14}/></button>
              </div>
          </div>
      </div>
    </div>
  );
});

interface PrinterListProps {
  onSelectPrinter?: (printer: PrinterType) => void;
  targetPrinterId?: string | null;
  clearTarget?: () => void;
}

export const PrinterList: React.FC<PrinterListProps> = ({ targetPrinterId, clearTarget }) => {
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [config, setConfig] = useState<SystemConfig>({ brands: [], models: [], suppliers: [], tonerModels: [], brandImages: {}, modelImages: {} });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'AZ' | 'ZA'>('AZ');
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterType | null>(null);
  
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterType | null>(null);
  const [printerServices, setPrinterServices] = useState<ServiceRecord[]>([]);
  const [printerCounters, setPrinterCounters] = useState<CounterLog[]>([]);
  const [printerTonerLogs, setPrinterTonerLogs] = useState<StockLog[]>([]);
  const [printerNotes, setPrinterNotes] = useState<Note[]>([]);

  const [formData, setFormData] = useState<Partial<PrinterType>>({
    brand: '', model: '', serialNumber: '', shortCode: '', location: '', floor: '',
    lastCounter: 0, connectionType: 'USB', ipAddress: '', status: 'ACTIVE'
  });

  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customBrand, setCustomBrand] = useState('');
  const [customModel, setCustomModel] = useState('');

  // Navigasyon ve ESC Kontrolü
  useEffect(() => {
    const handlePopState = () => {
      setSelectedPrinter(null);
      setIsFormModalOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPrinter || isFormModalOpen) {
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
  }, [selectedPrinter, isFormModalOpen]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (targetPrinterId && printers.length > 0) {
      const p = printers.find(x => x.id === targetPrinterId);
      if (p) handleOpenDetail(p);
      if (clearTarget) clearTarget();
    }
  }, [targetPrinterId, printers]);

  const loadData = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([StorageService.getPrinters(), StorageService.getConfig()]);
    setPrinters(p);
    setConfig(c);
    setLoading(false);
  };

  const handleOpenDetail = async (printer: PrinterType) => {
    window.history.pushState({ modal: 'detail' }, '');
    setSelectedPrinter(printer);
    const [services, counters, logs, notes] = await Promise.all([
      StorageService.getServiceRecords(),
      StorageService.getCounterLogs(),
      StorageService.getLogs(),
      StorageService.getNotesByPrinter(printer.id)
    ]);
    setPrinterServices(services.filter(s => s.printerId === printer.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setPrinterCounters(counters.filter(c => c.printerId === printer.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setPrinterTonerLogs(logs.filter(l => l.printerId === printer.id && l.type === 'OUT').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setPrinterNotes(notes);
  };

  const openFormModal = (e: React.MouseEvent, printer?: PrinterType) => {
    e.stopPropagation();
    window.history.pushState({ modal: 'form' }, '');
    if (printer) {
      setEditingPrinter(printer); setFormData({ ...printer });
      setIsCustomBrand(!config.brands.includes(printer.brand));
      setCustomBrand(config.brands.includes(printer.brand) ? '' : printer.brand);
      setIsCustomModel(!config.models.includes(printer.model));
      setCustomModel(config.models.includes(printer.model) ? '' : printer.model);
    } else {
      setEditingPrinter(null); setFormData({ brand: config.brands[0] || '', model: config.models[0] || '', status: 'ACTIVE', connectionType: 'USB' });
      setIsCustomBrand(false); setIsCustomModel(false); setCustomBrand(''); setCustomModel('');
    }
    setIsFormModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalBrand = isCustomBrand ? customBrand.trim() : formData.brand;
    const finalModel = isCustomModel ? customModel.trim() : formData.model;
    const payload = { ...formData, brand: finalBrand, model: finalModel } as PrinterType;
    if (editingPrinter?.id) await StorageService.updatePrinter(payload);
    else await StorageService.addPrinter({ ...payload, id: '', lastTonerDate: new Date().toISOString() });
    window.history.back(); loadData();
  };

  const handleDelete = async (e: React.MouseEvent, printer: PrinterType) => {
    e.stopPropagation();
    if (confirm(`${printer.model} silinsin mi?`)) {
       await StorageService.deletePrinter(printer.id);
       loadData();
    }
  };

  // Performans için arama ve filtreleme belleğe alınıyor
  const filteredPrinters = useMemo(() => {
    const s = searchTerm.toLocaleLowerCase('tr-TR');
    return printers.filter(p => {
      const matchSearch = (p.model.toLocaleLowerCase('tr-TR').includes(s) || p.location.toLocaleLowerCase('tr-TR').includes(s) || p.shortCode?.includes(s) || p.serialNumber.toLowerCase().includes(s));
      const matchFloor = !selectedFloor || p.floor === selectedFloor;
      const matchModel = !selectedModel || p.model === selectedModel;
      return matchSearch && matchFloor && matchModel;
    }).sort((a, b) => {
      const nameA = a.location.toLocaleLowerCase('tr-TR'), nameB = b.location.toLocaleLowerCase('tr-TR');
      return sortBy === 'AZ' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [printers, searchTerm, selectedFloor, selectedModel, sortBy]);

  const floorOptions = useMemo(() => Array.from(new Set(printers.map(p => p.floor).filter(Boolean))).sort(), [printers]);
  const modelOptions = useMemo(() => Array.from(new Set(printers.map(p => p.model).filter(Boolean))).sort(), [printers]);

  if (loading && printers.length === 0) return <LoadingScreen message="Hızlı liste oluşturuluyor..." />;

  return (
    <div className="space-y-8 pb-32 min-h-full">
      {/* Header Panel */}
      <div className="bg-zinc-900/40 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[80px] -ml-32 -mt-32"></div>
        <div className="relative z-10 flex items-center gap-5">
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20"><PrinterIcon size={32} strokeWidth={2.5}/></div>
            <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">CİHAZ HAVUZU</h2>
                <p className="text-[10px] font-black text-emerald-500/60 mt-2 uppercase tracking-[0.4em]">{filteredPrinters.length} Kayıtlı Ünite</p>
            </div>
        </div>
        <div className="flex gap-3 relative z-10 w-full md:w-auto">
            <button onClick={() => setShowFilters(!showFilters)} className={`flex-1 md:flex-none p-4 rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest ${showFilters ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400'}`}><Filter size={20} /></button>
            <button onClick={() => setSortBy(sortBy === 'AZ' ? 'ZA' : 'AZ')} className="flex-1 md:flex-none p-4 bg-white/5 text-zinc-400 rounded-2xl border border-white/5 flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest">{sortBy === 'AZ' ? <SortAsc size={20} /> : <SortDesc size={20} />}</button>
            <button onClick={(e) => openFormModal(e)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-black shadow-xl transition-all active:scale-95 uppercase text-[10px] tracking-widest"><Plus size={20} /> YENİ ÜNİTE</button>
        </div>
      </div>

      {/* Arama Barı */}
      <div className="relative group mx-4 md:mx-0">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-zinc-700 group-focus-within:text-emerald-500 transition-colors"><Search size={24} /></div>
          <input 
            type="text" 
            placeholder="Model, Lokasyon veya Hızlı Kod ara..." 
            className="w-full pl-16 pr-8 py-6 rounded-[2rem] bg-zinc-900/20 backdrop-blur-md border border-white/5 text-white shadow-xl outline-none focus:border-emerald-500/30 transition-all font-bold text-lg placeholder:text-zinc-700" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
      </div>

      {/* Filtre Paneli */}
      {showFilters && (
          <div className="mx-4 md:mx-0 bg-zinc-900/20 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
              <div>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3 ml-1">KAT SEÇİMİ</p>
                  <div className="flex flex-wrap gap-2">
                      <button onClick={() => setSelectedFloor(null)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${!selectedFloor ? 'bg-emerald-600 text-white' : 'bg-white/5 text-zinc-600'}`}>TÜMÜ</button>
                      {floorOptions.map(f => (
                          <button key={f} onClick={() => setSelectedFloor(selectedFloor === f ? null : f)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedFloor === f ? 'bg-emerald-600 text-white' : 'bg-white/5 text-zinc-600'}`}>{f}</button>
                      ))}
                  </div>
              </div>
              <div>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3 ml-1">MODEL FİLTRESİ</p>
                  <div className="flex flex-wrap gap-2">
                      <button onClick={() => setSelectedModel(null)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${!selectedModel ? 'bg-emerald-600 text-white' : 'bg-white/5 text-zinc-600'}`}>TÜMÜ</button>
                      {modelOptions.map(m => (
                          <button key={m} onClick={() => setSelectedModel(selectedModel === m ? null : m)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedModel === m ? 'bg-emerald-600 text-white' : 'bg-white/5 text-zinc-600'}`}>{m}</button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Grid Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0">
        {filteredPrinters.map(printer => (
          <PrinterCard 
            key={printer.id} 
            printer={printer} 
            onOpen={handleOpenDetail}
            onEdit={openFormModal}
            onDelete={handleDelete}
            modelImage={config.modelImages?.[printer.model] || null}
          />
        ))}
        {filteredPrinters.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-700 gap-4 opacity-50">
             <PrinterIcon size={64} strokeWidth={1} />
             <p className="font-black text-sm uppercase tracking-widest text-center px-10">Eşleşen ünite bulunamadı. Lütfen arama kriterlerini değiştirin.</p>
          </div>
        )}
      </div>

      {/* DETAY DRAWER */}
      {selectedPrinter && (
          <div className="fixed inset-0 z-[500] flex justify-end">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in" onClick={() => window.history.back()}></div>
              <div className="relative w-full max-w-xl bg-[#09090b] h-full shadow-2xl border-l border-white/5 animate-in slide-in-from-right duration-500 flex flex-col overflow-hidden">
                  
                  <div className="p-8 flex flex-col bg-zinc-950/50 border-b border-white/5 relative">
                      <button onClick={() => window.history.back()} className="absolute top-6 right-6 p-4 bg-zinc-900 text-white rounded-2xl hover:bg-red-600 transition-all z-20"><X size={24} strokeWidth={3}/></button>
                      <div className="flex flex-col md:flex-row gap-6 items-start mb-6">
                          <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl shadow-xl border border-zinc-800 shrink-0">
                              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + window.location.pathname + '?pid=' + selectedPrinter.id)}`} className="w-24 h-24" alt="QR"/>
                              <div className="bg-zinc-950 text-emerald-500 px-3 py-1 rounded-lg font-black text-xs">#{selectedPrinter.shortCode}</div>
                          </div>
                          <div className="flex-1 pt-1">
                              <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg text-[9px] font-black tracking-[0.3em] border border-emerald-500/20 uppercase mb-3 inline-block">CİHAZ PASAPORTU</span>
                              <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">{selectedPrinter.brand} {selectedPrinter.model}</h3>
                              <p className="mt-3 text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-emerald-500"/> {selectedPrinter.location} — {selectedPrinter.floor}</p>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                      <div className="grid grid-cols-3 gap-4">
                          <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 text-center"><p className="text-[9px] font-black text-zinc-600 uppercase mb-1.5">SAYAÇ</p><p className="text-xl font-black text-white font-mono">{selectedPrinter.lastCounter.toLocaleString()}</p></div>
                          <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 text-center"><p className="text-[9px] font-black text-zinc-600 uppercase mb-1.5">MALİYET</p><p className="text-xl font-black text-emerald-500 font-mono">{printerServices.reduce((a,c)=>a+(c.cost||0),0).toLocaleString()} ₺</p></div>
                          <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 text-center"><p className="text-[9px] font-black text-zinc-600 uppercase mb-1.5">TONER</p><p className="text-xl font-black text-orange-500 font-mono">{printerTonerLogs.length}</p></div>
                      </div>

                      {/* TONER DEĞİŞİM GEÇMİŞİ */}
                      <div className="space-y-6">
                          <h4 className="flex items-center gap-3 text-white font-black text-lg uppercase tracking-tighter"><Droplet size={24} className="text-orange-500"/> TONER DEĞİŞİM GEÇMİŞİ</h4>
                          <div className="space-y-3">
                              {printerTonerLogs.map(log => (
                                  <div key={log.id} className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 relative group/row overflow-hidden">
                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                                      <div className="flex justify-between items-start mb-1">
                                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{new Date(log.date).toLocaleDateString()}</span>
                                          <span className="text-xs font-black text-white bg-zinc-800 px-2 py-0.5 rounded-lg">{log.tonerModel}</span>
                                      </div>
                                      <h5 className="text-sm font-black text-zinc-300 uppercase leading-tight mb-1">{log.description}</h5>
                                      <div className="flex justify-between items-center text-[8px] font-black text-zinc-600">
                                          <span>SAAT: {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          <span>TEKNİSYEN: {log.user}</span>
                                      </div>
                                  </div>
                              ))}
                              {printerTonerLogs.length === 0 && (
                                  <div className="py-8 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl text-center">
                                      <p className="text-zinc-700 font-black uppercase text-[10px]">Henüz toner değişimi kaydedilmedi.</p>
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="space-y-6">
                          <h4 className="flex items-center gap-3 text-white font-black text-lg uppercase tracking-tighter"><StickyNote size={24} className="text-blue-500"/> CİHAZ NOTLARI</h4>
                          <div className="space-y-3">
                              {printerNotes.map(note => (
                                  <div key={note.id} className="bg-zinc-900/20 p-5 rounded-2xl border border-white/5">
                                      <h5 className="font-black text-white uppercase text-xs mb-1.5">{note.title}</h5>
                                      <p className="text-zinc-500 text-xs leading-relaxed">{note.content}</p>
                                      <div className="mt-3 flex justify-between items-center text-[8px] font-black text-zinc-700">
                                          <span>{new Date(note.date).toLocaleDateString()}</span>
                                          <span>Yazar: {note.user}</span>
                                      </div>
                                  </div>
                              ))}
                              {printerNotes.length === 0 && <p className="text-zinc-800 text-center font-black uppercase text-[10px]">Cihaza bağlı not bulunmuyor.</p>}
                          </div>
                      </div>

                      <div className="space-y-6">
                          <h4 className="flex items-center gap-3 text-white font-black text-lg uppercase tracking-tighter"><Wrench size={24} className="text-emerald-500"/> SERVİS GEÇMİŞİ</h4>
                          {printerServices.map(s => (
                              <div key={s.id} className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 relative group/row overflow-hidden">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                                  <div className="flex justify-between items-start mb-3">
                                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{new Date(s.date).toLocaleDateString()}</span>
                                      <span className="text-lg font-black text-white">{s.cost.toLocaleString()} ₺</span>
                                  </div>
                                  <h5 className="text-base font-black text-white uppercase mb-1">{s.issue}</h5>
                                  <p className="text-xs text-zinc-500 font-medium">{s.actionTaken}</p>
                              </div>
                          ))}
                      </div>
                  </div>
                  
                  <div className="p-10 bg-zinc-950 border-t border-white/5 grid grid-cols-2 gap-4">
                      <button onClick={(e) => openFormModal(e, selectedPrinter)} className="py-6 bg-zinc-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em]">DÜZENLE</button>
                      <button onClick={() => window.history.back()} className="py-6 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.3em]">KAPAT</button>
                  </div>
              </div>
          </div>
      )}

      {/* Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[600] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#09090b] rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 border border-white/5 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-950/50">
              <h3 className="font-black text-3xl text-white tracking-tighter uppercase leading-none">{editingPrinter ? 'CİHAZ GÜNCELLE' : 'YENİ ÜNİTE EKLE'}</h3>
              <button onClick={() => window.history.back()} className="p-4 bg-red-600 text-white rounded-2xl shadow-xl hover:rotate-90 transition-all active:scale-90"><X size={24} strokeWidth={3} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">MARKA</label>
                    <select className="w-full p-4 border border-white/10 rounded-2xl bg-zinc-900 text-white font-black outline-none focus:border-emerald-500" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                      {config.brands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">MODEL</label>
                    <select className="w-full p-4 border border-white/10 rounded-2xl bg-zinc-900 text-white font-black outline-none focus:border-emerald-500" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})}>
                      {config.models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">SERİ NUMARASI</label>
                  <input required type="text" className="w-full p-4 border border-white/10 rounded-2xl bg-zinc-900 text-white font-black outline-none focus:border-emerald-500" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">LOKASYON</label>
                  <input required type="text" className="w-full p-4 border border-white/10 rounded-2xl bg-zinc-900 text-white font-black outline-none focus:border-emerald-500" placeholder="Örn: MUHASEBE, RADYOLOJİ..." value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">KAT / BÖLÜM</label>
                <input required type="text" className="w-full p-4 border border-white/10 rounded-2xl bg-zinc-900 text-white font-black outline-none focus:border-emerald-500" placeholder="Örn: 2. Kat, Zemin, Laboratuvar..." value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} />
              </div>

              <button type="submit" className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black shadow-xl transition-all uppercase tracking-widest mt-4">SİSTEME KAYDET</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
