
import { Plus, Trash2, Save, Tag, Box, MessageCircle, Truck, RefreshCw, Edit2, X, AlertTriangle, Droplet, Database, CheckCircle2, Loader2, ArrowRight, Image as ImageIcon, Link as LinkIcon, Printer, ShieldCheck, Globe, History, ShieldAlert, Download, Upload, ShieldCheck as ShieldIcon, CloudLightning, Clock } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storage';
import { SystemConfig, Printer as PrinterType } from '../types';
import { LoadingScreen } from './LoadingScreen';

type ConfigType = 'brands' | 'models' | 'suppliers' | 'tonerModels';

export const INITIAL_PRINTER_DATA = [
  { s: 'QTS15057', ip: '236', m: 'iRC3325i', l: 'MUHASEBE', sc: '1001' },
  { s: '34X19121', ip: '132', m: 'iR1643i', l: 'ARKA BANKO', sc: '1002' },
  { s: 'NMNA023185', ip: '243', m: 'MF416DW', l: 'LABORATUVAR', sc: '1003' },
  { s: 'USK13225', ip: '137', m: 'MF416DW', l: 'FİZİK TEDAVİ SERVİSİ', sc: '1004' },
  { s: '34X19098', ip: '239', m: 'iR1643i', l: 'ACİL BANKO', sc: '1005' },
  { s: '34x36825', ip: '246', m: 'iR1643i', l: 'TABURCULUK YENİ', sc: '1006' },
  { s: '34X02913', ip: '152', m: 'iR1643i', l: 'OZLSGRT', sc: '1007' },
  { s: 'NWP22326', ip: 'USB', m: 'MF416DW', l: 'MF4750 YEDEK', sc: '1008' }, 
  { s: '2TG52222', ip: '238', m: 'MF440', l: 'ÖN BANKO', sc: '1009' },
  { s: '3ZE17591', ip: 'USB', m: 'iR1643i', l: 'BOOKINGSURGEY', sc: '1010' },
  { s: '35D22142', ip: '168', m: 'iR1643i', l: 'OZLSGRT-FATURA', sc: '1011' },
  { s: '34X13960', ip: '247', m: 'iR1643i', l: 'ORTA BANKO', sc: '1012' },
  { s: '34X28607', ip: '147', m: 'iR1643i', l: 'MUHASEBE2', sc: '1013' },
  { s: 'NMNA023186', ip: '150', m: 'LBP251DW', l: 'RADYOLOJİ DR.', sc: '1014' },
  { s: 'NMNA023191', ip: '145', m: 'LBP251DW', l: 'AMELİYATHANE', sc: '1015' },
  { s: 'NMNA020233', ip: '156', m: 'LBP251DW', l: 'GÖĞÜS HAST.', sc: '1016' },
  { s: 'NMNA022266', ip: '146', m: 'LBP251DW', l: '1.KAT POLK.', sc: '1017' },
  { s: 'NMNA023071', ip: 'USB', m: 'LBP251DW', l: 'GENEL Y.B.', sc: '1018' },
  { s: 'NMNA023073', ip: '151', m: 'LBP251DW', l: 'RADYOLOJİ', sc: '1019' },
  { s: 'NMNA023079', ip: '142', m: 'LBP251DW', l: '3.KAT SERVİS', sc: '1020' },
  { s: 'NMNA023075', ip: 'USB', m: 'LBP251DW', l: 'ACİL HEMŞİRE', sc: '1021' },
  { s: 'NMNA023499', ip: '158', m: 'LBP251DW', l: '2.KAT SERVİS', sc: '1022' },
  { s: 'NMNA023183', ip: '121', m: 'LBP251DW', l: 'ENFEKSİYON', sc: '1023' },
  { s: 'NMNA023182', ip: 'USB', m: 'LBP251DW', l: 'OZLSGRT-DİLEK', sc: '1024' },
  { s: 'NMNA023076', ip: 'USB', m: 'LBP251DW', l: 'DAHİLİYE AYCA HOCA', sc: '1025' },
  { s: 'NMNA023189', ip: '153', m: 'LBP251DW', l: 'BEBEK Y.B.', sc: '1026' },
  { s: 'NMNA020236', ip: 'USB', m: 'LBP251DW', l: 'GÖZ POLK.', sc: '1027' },
  { s: 'USK31381', ip: '141', m: 'LBP251DW', l: '1.KAT VİP SERVİS', sc: '1028' },
  { s: 'NMNA023496', ip: '140', m: 'LBP251DW', l: 'K.DOĞUM SERVİS', sc: '1029' },
  { s: 'NMNA023077', ip: 'USB', m: 'LBP251DW', l: 'ECZANE', sc: '1030' },
  { s: 'NMNA023187', ip: '136', m: 'LBP251DW', l: 'GÜZELLİK MERKEZİ', sc: '1031' },
  { s: '34X36824', ip: '143', m: 'iR1643i', l: 'İNSAN KAYNAKLARI YENİ', sc: '1032' }, 
  { s: 'NMNA020231', ip: '-', m: 'LBP251DW', l: 'İNSAN KAYNAKLARI(yedek)', sc: '1033' }, 
  { s: 'NMNA020234', ip: 'USB', m: 'LBP251DW', l: 'İŞİTME TESTİ (ODİO)', sc: '1034' },
  { s: 'NMNA023180', ip: 'USB', m: 'LBP251DW', l: 'HASTA HAKLARI YAPRAK', sc: '1035' },
  { s: '34X36821', ip: '135', m: 'iR1643i', l: 'OZLSGRTOSS', sc: '1036' },
  { s: 'NQGA077960', ip: '157', m: 'LBP223DW', l: 'OZLSGRT2', sc: '1037' },
  { s: 'NMNA023495', ip: 'USB', m: 'LBP251DW', l: 'KALİTE ODASI', sc: '1038' }, 
  { s: '34M25642', ip: '160', m: 'MF645C', l: 'Sağlık Turizmi', sc: '1039' }, 
  { s: 'JA4B8254', ip: 'USB', m: 'DR-C230', l: 'OZLSGRT-DIDEM', sc: '1040' }
];

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({ brands: [], models: [], suppliers: [], tonerModels: [], brandImages: {}, modelImages: {}, appUrl: '' });
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Progress
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showRecoveryConfirm, setShowRecoveryConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [restoreInput, setRestoreInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isFixingCodes, setIsFixingCodes] = useState(false);
  const [isFixingToners, setIsFixingToners] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(localStorage.getItem('last_db_backup'));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingRestoreData, setPendingRestoreData] = useState<any>(null);

  // Form States
  const [newBrand, setNewBrand] = useState('');
  const [newBrandImage, setNewBrandImage] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newModelImage, setNewModelImage] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [newTonerModel, setNewTonerModel] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [appUrl, setAppUrl] = useState('');

  const [editModal, setEditModal] = useState<{ type: ConfigType, oldVal: string, newVal: string, newImage?: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ type: ConfigType, val: string } | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const c = await StorageService.getConfig();
      const p = await StorageService.getPrinters();
      setConfig(c);
      setWhatsappNumber(c.whatsappNumber || '');
      setAppUrl(c.appUrl || '');
      setPrinters(p);
      setLastBackupDate(localStorage.getItem('last_db_backup'));
    } catch (e) {
      console.error("Yükleme hatası:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
        const data = await StorageService.exportDatabase();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const now = new Date();
        const dateStr = now.toLocaleDateString('tr-TR').replace(/\./g, '-');
        const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
        
        link.href = url;
        link.download = `toner_takip_yedek_${dateStr}_${timeStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        const timestamp = now.toLocaleString('tr-TR');
        localStorage.setItem('last_db_backup', timestamp);
        setLastBackupDate(timestamp);
        alert("✅ Veritabanı yedeği başarıyla oluşturuldu ve indirildi.");
    } catch (e) {
        alert("❌ Yedekleme sırasında hata oluştu.");
    } finally {
        setIsBackingUp(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              setPendingRestoreData(json);
              setShowRestoreConfirm(true);
          } catch (e) {
              alert("❌ Geçersiz yedek dosyası!");
          }
      };
      reader.readAsText(file);
  };

  const executeRestore = async () => {
      if (restoreInput.trim().toUpperCase() !== 'ONAYLA') {
          alert("Lütfen 'ONAYLA' yazarak işlemi doğrulayın.");
          return;
      }
      
      setIsRestoring(true);
      setShowRestoreConfirm(false);
      try {
          await StorageService.importDatabase(pendingRestoreData);
          alert("✅ Veritabanı başarıyla geri yüklendi! Sayfa yenilenecek.");
          window.location.reload();
      } catch (e) {
          alert("❌ Geri yükleme sırasında hata oluştu.");
      } finally {
          setIsRestoring(false);
          setRestoreInput('');
      }
  };

  const handleFixToners = async () => {
    if (recoveryInput.trim().toUpperCase() !== 'ONAR') {
        alert("Onaylamak için lütfen 'ONAR' yazınız.");
        return;
    }
    setShowRecoveryConfirm(false);
    setIsFixingToners(true);
    setRecoveryInput('');
    try {
        const result = await StorageService.syncTonerModelsFromExistingData();
        if (result) {
            alert(`✅ STOK ONARIMI BAŞARILI!\n\n- Hesaba Katılan Model Sayısı: ${result.recalculatedCount}\n- Güncel Liste Kapasitesi: ${result.totalModelsInConfig}`);
            await loadData();
        }
    } catch(e: any) { alert("❌ HATA: " + e.message); } finally { setIsFixingToners(false); }
  };

  const handleAddItem = async (e: React.FormEvent, type: ConfigType, value: string, setter: (s: string) => void, imageValue?: string, imageSetter?: (s: string) => void) => {
    e.preventDefault();
    const val = value.trim();
    if (val && !config[type].includes(val)) {
      let updated = { ...config, [type]: [...config[type], val] };
      if (imageValue && (type === 'brands' || type === 'models')) {
         const imgMapKey = type === 'brands' ? 'brandImages' : 'modelImages';
         updated = { ...updated, [imgMapKey]: { ...(updated[imgMapKey as keyof SystemConfig] as Record<string, string>), [val]: imageValue.trim() } };
      }
      await StorageService.saveConfig(updated);
      setConfig(updated);
      setter('');
      if (imageSetter) imageSetter('');
    }
  };

  const openEdit = (type: ConfigType, oldVal: string) => {
    let currentImage = '';
    if (type === 'brands') currentImage = config.brandImages?.[oldVal] || '';
    if (type === 'models') currentImage = config.modelImages?.[oldVal] || '';
    setEditModal({ type, oldVal, newVal: oldVal, newImage: currentImage });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal || !editModal.newVal.trim()) return;
    const { type, oldVal, newVal, newImage } = editModal;
    const trimmedNewVal = newVal.trim();
    const updatedList = config[type].map(item => item === oldVal ? trimmedNewVal : item);
    let updatedConfig = { ...config, [type]: updatedList };
    if (type === 'brands' || type === 'models') {
        const mapKey = type === 'brands' ? 'brandImages' : 'modelImages';
        const currentMap = { ...(updatedConfig[mapKey] || {}) };
        if (oldVal !== trimmedNewVal) delete currentMap[oldVal];
        if (newImage) currentMap[trimmedNewVal] = newImage.trim();
        else delete currentMap[trimmedNewVal];
        updatedConfig = { ...updatedConfig, [mapKey]: currentMap };
    }
    await StorageService.saveConfig(updatedConfig);
    setConfig(updatedConfig);
    if (oldVal !== trimmedNewVal) {
        for (const p of printers) {
            let changed = false;
            let newP = { ...p };
            if (type === 'brands' && p.brand === oldVal) { newP.brand = trimmedNewVal; changed = true; }
            if (type === 'models' && p.model === oldVal) { newP.model = trimmedNewVal; changed = true; }
            if (type === 'suppliers' && p.supplier === oldVal) { newP.supplier = trimmedNewVal; changed = true; }
            if (type === 'tonerModels' && p.compatibleToner === oldVal) { newP.compatibleToner = trimmedNewVal; changed = true; }
            if (changed) await StorageService.updatePrinter(newP);
        }
        await loadData();
    }
    setEditModal(null);
  };

  const openDelete = (type: ConfigType, val: string) => setDeleteModal({ type, val });

  const handleDelete = async () => {
    if (!deleteModal) return;
    const { type, val } = deleteModal;
    const updatedList = config[type].filter(item => item !== val);
    let updatedConfig = { ...config, [type]: updatedList };
    if (type === 'brands' && updatedConfig.brandImages) {
        const newImages = {...updatedConfig.brandImages};
        delete newImages[val];
        updatedConfig.brandImages = newImages;
    }
    if (type === 'models' && updatedConfig.modelImages) {
        const newImages = {...updatedConfig.modelImages};
        delete newImages[val];
        updatedConfig.modelImages = newImages;
    }
    await StorageService.saveConfig(updatedConfig);
    setConfig(updatedConfig);
    setDeleteModal(null);
  };

  const renderList = (type: ConfigType, items: string[]) => (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
      {items.map((item, idx) => (
        <div key={`${item}-${idx}`} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 group hover:shadow-sm transition-all">
          <div className="flex items-center gap-3 min-w-0">
              {(type === 'brands' || type === 'models') && (
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                      {(type === 'brands' ? config.brandImages?.[item] : config.modelImages?.[item]) ? (
                          <img src={type === 'brands' ? config.brandImages?.[item] : config.modelImages?.[item]} alt={item} className="w-full h-full object-contain p-1" />
                      ) : (
                          <Printer size={16} className="text-zinc-300 dark:text-zinc-600" />
                      )}
                  </div>
              )}
              {type === 'tonerModels' && <div className="p-2 bg-orange-50 dark:bg-orange-950/40 text-orange-500 rounded-lg shrink-0"><Droplet size={16}/></div>}
              {type === 'suppliers' && <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-lg shrink-0"><Truck size={16}/></div>}
              <span className="font-black text-xs text-zinc-700 dark:text-zinc-200 uppercase truncate">{item}</span>
          </div>
          <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => openEdit(type, item)} className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg active:scale-90 transition-all"><Edit2 size={16} /></button>
              <button type="button" onClick={() => openDelete(type, item)} className="p-2 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 rounded-lg active:scale-90 transition-all"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-[10px] text-zinc-400 text-center py-6 font-bold uppercase italic tracking-widest">Kayıt Bulunmuyor</p>}
    </div>
  );

  if (loading) return <LoadingScreen message="Sistem ayarları yükleniyor..." />;

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-[2.5rem] shadow-xl border border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl"><Save size={28}/></div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Sistem Konfigürasyonu</h2>
        </div>
        <button onClick={loadData} className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl hover:text-emerald-500 transition-all active:rotate-180"><RefreshCw size={24} /></button>
      </div>

      {/* YEDEKLEME VE VERİ GÜVENLİĞİ PANELI */}
      <div className="bg-gradient-to-br from-zinc-900 to-black p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><CloudLightning size={300}/></div>
          <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div className="space-y-4">
                      <div className="flex items-center gap-3">
                          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30"><ShieldIcon size={32}/></div>
                          <h3 className="text-3xl font-black uppercase tracking-tighter">Veri Güvenliği & Yedekleme</h3>
                      </div>
                      <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
                          Firestore bulut veritabanınızdaki tüm kayıtları (Cihazlar, Stoklar, Hareketler, Faturalar) tek bir dosya olarak bilgisayarınıza indirebilir, olası bir sorunda bu dosyayı kullanarak sistemi saniyeler içinde eski haline döndürebilirsiniz.
                      </p>
                      <div className="flex items-center gap-3 bg-white/5 w-fit px-6 py-3 rounded-2xl border border-white/10">
                          <Clock size={16} className="text-emerald-400"/>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Son Yedekleme: <span className="text-white ml-1 font-mono">{lastBackupDate || 'Henüz Yedek Alınmadı'}</span></p>
                      </div>
                  </div>
                  <div className="flex flex-col gap-4 w-full md:w-auto">
                      <button 
                        onClick={handleBackup} 
                        disabled={isBackingUp}
                        className="flex items-center justify-center gap-3 px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap"
                      >
                          {isBackingUp ? <Loader2 size={20} className="animate-spin"/> : <Download size={20}/>}
                          {isBackingUp ? 'YEDEK HAZIRLANIYOR...' : 'YEDEK OLUŞTUR (İNDİR)'}
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-3 px-10 py-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-3xl font-black text-xs uppercase tracking-widest border border-white/10 active:scale-95 transition-all whitespace-nowrap"
                      >
                          <Upload size={20}/> YEDEĞİ GERİ YÜKLE (UPLOAD)
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* TONER MODELLERİ */}
        <div className="bg-white dark:bg-zinc-950 p-8 rounded-[3rem] shadow-xl border border-zinc-100 dark:border-zinc-900">
          <h3 className="text-sm font-black text-zinc-900 dark:text-white mb-6 uppercase tracking-[0.2em] flex items-center gap-3"><Droplet size={20} className="text-orange-500" /> Toner & Mürekkep Modelleri</h3>
          <form onSubmit={(e) => handleAddItem(e, 'tonerModels', newTonerModel, setNewTonerModel)} className="mb-6 flex gap-2">
              <input required type="text" placeholder="Örn: CRG-052, 259X..." className="flex-1 p-4 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl font-black text-xs uppercase" value={newTonerModel} onChange={e => setNewTonerModel(e.target.value)} />
              <button type="submit" className="bg-orange-600 text-white p-4 rounded-2xl shadow-lg active:scale-90 transition-all"><Plus size={20} /></button>
          </form>
          {renderList('tonerModels', config.tonerModels)}
        </div>

        {/* MARKALAR */}
        <div className="bg-white dark:bg-zinc-950 p-8 rounded-[3rem] shadow-xl border border-zinc-100 dark:border-zinc-900">
          <h3 className="text-sm font-black text-zinc-900 dark:text-white mb-6 uppercase tracking-[0.2em] flex items-center gap-3"><Tag size={20} className="text-emerald-500" /> Marka Havuzu</h3>
          <form onSubmit={(e) => handleAddItem(e, 'brands', newBrand, setNewBrand, newBrandImage, setNewBrandImage)} className="mb-6 space-y-3">
              <div className="flex gap-2">
                <input required type="text" placeholder="Marka İsmi" className="flex-1 p-4 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl font-black text-xs uppercase" value={newBrand} onChange={e => setNewBrand(e.target.value)} />
                <button type="submit" className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg active:scale-90 transition-all"><Plus size={20} /></button>
              </div>
              <input type="url" placeholder="Logo Görsel URL" className="w-full p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[10px] font-bold" value={newBrandImage} onChange={e => setNewBrandImage(e.target.value)} />
          </form>
          {renderList('brands', config.brands)}
        </div>
      </div>

      {/* ARAÇLAR PANELI */}
      <div className="bg-zinc-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Database size={200}/></div>
          <div className="relative z-10">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Sistem Bakım Araçları</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button onClick={() => setShowImportConfirm(true)} className="p-6 bg-white/10 hover:bg-white/20 rounded-3xl border border-white/10 transition-all flex items-center justify-between group text-left">
                      <div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">DATA IMPORT</p><p className="text-lg font-black uppercase leading-none">Hazır Cihaz Listesi</p></div>
                      <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                  </button>
                  <button onClick={() => { if(confirm("Eksik kodlar onarılsın mı?")) StorageService.fixMissingShortCodes().then(loadData); }} className="p-6 bg-blue-600/20 hover:bg-blue-600/30 rounded-3xl border border-blue-500/30 transition-all flex items-center justify-between group text-left">
                      <div><p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">ID RECOVERY</p><p className="text-lg font-black uppercase leading-none">Kod Onarımı</p></div>
                      <RefreshCw className="group-hover:rotate-180 transition-transform duration-500" />
                  </button>
                  <button onClick={() => setShowRecoveryConfirm(true)} className="p-6 bg-orange-600/20 hover:bg-orange-600/30 rounded-3xl border border-orange-500/30 transition-all flex items-center justify-between group text-left">
                      <div><p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">DATA INTEGRITY</p><p className="text-lg font-black uppercase leading-none">Stok Onarımı</p></div>
                      <History className="group-hover:scale-110 transition-transform" />
                  </button>
              </div>
          </div>
      </div>

      {/* RESTORE ONAY MODALI */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[400] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-950 rounded-[4rem] w-full max-w-md p-12 text-center shadow-2xl border border-zinc-100 dark:border-zinc-900 space-y-8 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-red-100 dark:bg-red-950/30 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-xl"><ShieldAlert size={56} /></div>
                <div className="space-y-4">
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">VERİLERİ ÜZERİNE YAZ</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">
                        Seçtiğiniz yedek dosyası yüklenecektir. Bu işlem <strong>mevcut tüm veritabanını silecektir</strong> ve geri alınamaz.
                    </p>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">DEVAM ETMEK İÇİN 'ONAYLA' YAZINIZ</p>
                        <input type="text" className="w-full p-4 bg-white dark:bg-zinc-950 border-2 border-red-500/20 rounded-2xl text-center font-black text-xl tracking-[0.2em] outline-none focus:border-red-500 transition-all uppercase" placeholder="..." value={restoreInput} onChange={(e) => setRestoreInput(e.target.value)} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => { setShowRestoreConfirm(false); setRestoreInput(''); }} className="py-6 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-3xl font-black text-[11px] tracking-widest uppercase transition-all">VAZGEÇ</button>
                    <button onClick={executeRestore} disabled={restoreInput.trim().toUpperCase() !== 'ONAYLA'} className="py-6 bg-red-600 disabled:opacity-30 text-white rounded-3xl font-black text-[11px] tracking-widest uppercase shadow-xl transition-all">YÜKLEMEYİ BAŞLAT</button>
                </div>
            </div>
        </div>
      )}

      {/* DİĞER MODALLAR (RECOVERY, EDIT VB.) - AYNI KALDI */}
      {showRecoveryConfirm && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[400] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-950 rounded-[4rem] w-full max-w-md p-12 text-center shadow-2xl border border-zinc-100 dark:border-zinc-900 space-y-8 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-orange-100 dark:bg-orange-950/30 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-xl"><ShieldAlert size={56} /></div>
                <div className="space-y-4">
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">STOK ONARIMI</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">Bu işlem mevcut stok adetlerini tamamen siler ve geçmişteki tüm hareketleri tarayarak gerçek stok miktarını matematiksel olarak yeniden hesaplar.</p>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800"><p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">ONAYLAMAK İÇİN 'ONAR' YAZINIZ</p><input type="text" className="w-full p-4 bg-white dark:bg-zinc-950 border-2 border-orange-500/20 rounded-2xl text-center font-black text-xl tracking-[0.2em] outline-none focus:border-orange-500 transition-all uppercase" placeholder="..." value={recoveryInput} onChange={(e) => setRecoveryInput(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => { setShowRecoveryConfirm(false); setRecoveryInput(''); }} className="py-6 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-3xl font-black text-[11px] tracking-widest uppercase transition-all">VAZGEÇ</button>
                    <button onClick={handleFixToners} disabled={recoveryInput.trim().toUpperCase() !== 'ONAR'} className="py-6 bg-orange-600 disabled:opacity-30 text-white rounded-3xl font-black text-[11px] tracking-widest uppercase shadow-xl transition-all">ONARIMI BAŞLAT</button>
                </div>
            </div>
        </div>
      )}

      {isRestoring && (
           <div className="fixed inset-0 bg-black/95 z-[500] flex items-center justify-center p-10 text-center animate-in fade-in">
              <div className="space-y-8 w-full max-w-md">
                  <div className="relative inline-block"><Loader2 size={120} className="text-red-500 animate-spin" strokeWidth={2} /><div className="absolute inset-0 flex items-center justify-center"><Database size={48} className="text-red-500" /></div></div>
                  <div className="space-y-4"><p className="text-white font-black text-2xl uppercase tracking-tighter leading-none">VERİLER GERİ YÜKLENİYOR</p><p className="text-zinc-500 text-xs font-medium px-10">Lütfen bekleyin, veritabanı dosyadan okunarak yeniden yazılıyor...</p></div>
                  <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden"><div className="bg-red-500 h-full animate-progress-ind"></div></div>
              </div>
           </div>
      )}

      {editModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-950 rounded-[3rem] w-full max-w-md shadow-2xl border border-zinc-100 dark:border-zinc-900 flex flex-col max-h-[90vh]">
             <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center"><h3 className="font-black text-xl uppercase tracking-tighter">Kayıt Düzenle</h3><button onClick={() => setEditModal(null)} className="p-2 text-zinc-400 hover:text-red-500"><X size={24}/></button></div>
             <form onSubmit={handleUpdate} className="p-8 space-y-6 overflow-y-auto"><div className="space-y-2"><label className="text-[10px] font-black text-zinc-400 uppercase ml-2 tracking-widest">YENİ DEĞER</label><input required type="text" className="w-full p-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-900 font-black text-sm uppercase" value={editModal.newVal} onChange={e => setEditModal({...editModal, newVal: e.target.value})} /></div><div className="flex gap-3 pt-4"><button type="button" onClick={() => setEditModal(null)} className="flex-1 py-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl font-black text-[10px] uppercase">İptal</button><button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/20">Güncelle</button></div></form>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
           <div className="bg-white dark:bg-zinc-950 rounded-[3rem] p-10 text-center max-w-sm w-full shadow-2xl border border-zinc-100 dark:border-zinc-900"><div className="w-20 h-20 bg-red-100 dark:bg-red-950/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={40} /></div><p className="font-black text-lg text-zinc-900 dark:text-white uppercase mb-2">"{deleteModal.val}" Silinsin mi?</p><p className="text-zinc-500 text-xs mb-8">Bu değerle eşleşen cihazlardaki veriler de etkilenecektir.</p><div className="grid grid-cols-2 gap-4"><button onClick={() => setDeleteModal(null)} className="py-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl font-black text-[10px] uppercase">VAZGEÇ</button><button onClick={handleDelete} className="py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">EVET, SİL</button></div></div>
        </div>
      )}

      <style>{`
        @keyframes progress-ind { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-progress-ind { width: 50%; animation: progress-ind 1.5s infinite linear; }
      `}</style>
    </div>
  );
};
