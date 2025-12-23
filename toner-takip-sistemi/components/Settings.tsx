import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Tag, Box, MessageCircle, Truck, RefreshCw, Edit2, X, AlertTriangle, Droplet, Database, CheckCircle2, Loader2, ArrowRight, Image as ImageIcon, Link as LinkIcon, Printer, ShieldCheck } from 'lucide-react';
import { StorageService } from '../services/storage';
import { SystemConfig, Printer as PrinterType } from '../types';
import { LoadingScreen } from './LoadingScreen';

type ConfigType = 'brands' | 'models' | 'suppliers' | 'tonerModels';

// UPDATED DATA: Sequential 4-digit Short Codes (1001-1040)
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
  const [config, setConfig] = useState<SystemConfig>({ brands: [], models: [], suppliers: [], tonerModels: [], brandImages: {}, modelImages: {} });
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Import States
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  // Maintenance States
  const [isFixingCodes, setIsFixingCodes] = useState(false);

  // Input States
  const [newBrand, setNewBrand] = useState('');
  const [newBrandImage, setNewBrandImage] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newModelImage, setNewModelImage] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [newTonerModel, setNewTonerModel] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  const [editModal, setEditModal] = useState<{ type: ConfigType, oldVal: string, newVal: string, newImage?: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ type: ConfigType, val: string } | null>(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editModal) setEditModal(null);
        if (deleteModal) setDeleteModal(null);
        if (showImportConfirm) setShowImportConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editModal, deleteModal, showImportConfirm]);

  const loadData = async () => {
    setLoading(true);
    const c = await StorageService.getConfig();
    const p = await StorageService.getPrinters();
    setConfig(c);
    setWhatsappNumber(c.whatsappNumber || '');
    setPrinters(p);
    setLoading(false);
  };

  const handleInitialImport = async () => {
    setShowImportConfirm(false);
    setIsImporting(true);
    setImportProgress(0);

    try {
        let count = 0;
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
                shortCode: item.sc, // Use pre-defined short code
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
            count++;
            setImportProgress(count);
            await new Promise(resolve => setTimeout(resolve, 30));
        }
        await loadData();
        alert(`İŞLEM BAŞARILI!\nToplam ${count} adet yazıcı sisteme kaydedildi.`);
    } catch (e) {
        alert('İçe aktarma hatası.');
    } finally {
        setIsImporting(false);
    }
  };

  const handleFixCodes = async () => {
    if (!confirm("Veritabanında Hızlı Kodu eksik olan veya 1000'den küçük olan tüm yazıcılara otomatik olarak 4 haneli kod atanacaktır. Devam edilsin mi?")) return;
    
    setIsFixingCodes(true);
    try {
      const count = await StorageService.fixMissingShortCodes();
      await loadData();
      alert(`Onarım tamamlandı. ${count} yazıcıya yeni Hızlı Kod atandı.`);
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setIsFixingCodes(false);
    }
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
        const updatedPrinters = await StorageService.getPrinters();
        setPrinters(updatedPrinters);
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

  const handleSaveWhatsapp = async () => {
    const updatedConfig = { ...config, whatsappNumber: whatsappNumber };
    await StorageService.saveConfig(updatedConfig);
    setConfig(updatedConfig);
    alert('Numara kaydedildi.');
  };

  const manualMaintenance = async () => {
    setLoading(true);
    await loadData();
    alert('Veritabanı senkronize edildi.');
    setLoading(false);
  };

  const renderList = (type: ConfigType, items: string[]) => (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
      {items.map((item, idx) => (
        <div key={`${item}-${idx}`} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 group hover:shadow-sm transition-all">
          <div className="flex items-center gap-3">
              {(type === 'brands' || type === 'models') && (
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                      {(type === 'brands' ? config.brandImages?.[item] : config.modelImages?.[item]) ? (
                          <img src={type === 'brands' ? config.brandImages?.[item] : config.modelImages?.[item]} alt={item} className="w-full h-full object-contain p-1" />
                      ) : (
                          <Printer size={16} className="text-slate-300 dark:text-slate-600" />
                      )}
                  </div>
              )}
              <span className="font-medium text-slate-700 dark:text-slate-200">{item}</span>
          </div>
          <div className="flex gap-2">
              <button type="button" onClick={() => openEdit(type, item)} className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg"><Edit2 size={16} /></button>
              <button type="button" onClick={() => openDelete(type, item)} className="p-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) return <LoadingScreen message="Sistem ayarları yükleniyor..." />;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Save size={24} className="text-primary-600 dark:text-primary-400" /> Sistem Ayarları
        </h2>
        <button onClick={manualMaintenance} className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg flex items-center gap-1"><RefreshCw size={14} /> Senkronize Et</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bulk Import */}
        <div className="bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-700 relative overflow-hidden">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Database size={20} className="text-emerald-400" /> İlk Kurulum Aracı</h3>
          <p className="text-zinc-400 text-xs mb-4">40 adet yazıcıyı önceden tanımlı Hızlı Kodlar (#1001-1040) ile kaydeder.</p>
          {isImporting ? (
               <div className="w-full bg-emerald-900/50 rounded-xl p-4 border border-emerald-500/30 flex items-center gap-3">
                  <Loader2 size={24} className="text-emerald-400 animate-spin" />
                  <div className="flex-1">
                      <p className="text-emerald-100 font-bold text-sm">Cihazlar Yükleniyor...</p>
                      <p className="text-emerald-400 text-xs">{importProgress} / {INITIAL_PRINTER_DATA.length}</p>
                  </div>
               </div>
          ) : (
              <button onClick={() => setShowImportConfirm(true)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg">Verileri Yükle</button>
          )}
        </div>

        {/* Fix Short Codes Maintenance */}
        <div className="bg-blue-900 p-6 rounded-xl shadow-lg border border-blue-700 relative overflow-hidden">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><ShieldCheck size={20} className="text-blue-300" /> Hızlı Kod Onarımı</h3>
          <p className="text-blue-200 text-xs mb-4">Mevcut tüm yazıcıları tarar ve Hızlı Kodu eksik olanlara 1000'den başlayan 4 haneli kodlar atar.</p>
          <button 
            disabled={isFixingCodes}
            onClick={handleFixCodes} 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            {isFixingCodes ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />}
            Kodları Düzenle (Toplu)
          </button>
        </div>
      </div>

      {showImportConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4">
            <div className="bg-zinc-800 p-6 rounded-2xl border border-zinc-600 max-w-sm w-full text-center">
                <AlertTriangle size={48} className="text-yellow-400 mx-auto mb-4"/>
                <p className="text-white font-bold mb-2">Onaylıyor musunuz?</p>
                <p className="text-zinc-400 text-xs mb-6">Bu işlem önceden tanımlı 40 adet cihazı sisteme ekleyecektir. Aynı seri numaralı cihazlar varsa kopyalanabilir.</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowImportConfirm(false)} className="flex-1 py-3 bg-zinc-700 text-white rounded-xl">Vazgeç</button>
                    <button onClick={handleInitialImport} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold">Yükle</button>
                </div>
            </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><MessageCircle size={20} className="text-green-600" /> WhatsApp Bildirim Numarası</h3>
        <div className="flex gap-2">
           <input type="tel" placeholder="905xxxxxxxxx" className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
           <button onClick={handleSaveWhatsapp} className="bg-green-600 text-white px-6 py-2 rounded-xl font-medium">Kaydet</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><Tag size={20} className="text-primary-500" /> Yazıcı Markaları</h3>
          <form onSubmit={(e) => handleAddItem(e, 'brands', newBrand, setNewBrand, newBrandImage, setNewBrandImage)} className="mb-4">
            <div className="flex flex-col gap-2">
                 <div className="flex gap-2">
                    <input type="text" placeholder="Marka Adı" className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} />
                    <button type="submit" className="bg-primary-600 text-white p-3 rounded-xl"><Plus size={20} /></button>
                 </div>
                 <input type="url" placeholder="Logo URL" className="p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs" value={newBrandImage} onChange={(e) => setNewBrandImage(e.target.value)} />
            </div>
          </form>
          {renderList('brands', config.brands)}
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><Box size={20} className="text-blue-500" /> Yazıcı Modelleri</h3>
          <form onSubmit={(e) => handleAddItem(e, 'models', newModel, setNewModel, newModelImage, setNewModelImage)} className="mb-4">
             <div className="flex flex-col gap-2">
                 <div className="flex gap-2">
                    <input type="text" placeholder="Model Adı" className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={newModel} onChange={(e) => setNewModel(e.target.value)} />
                    <button type="submit" className="bg-primary-600 text-white p-3 rounded-xl"><Plus size={20} /></button>
                 </div>
                 <input type="url" placeholder="Resim URL" className="p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs" value={newModelImage} onChange={(e) => setNewModelImage(e.target.value)} />
            </div>
          </form>
          {renderList('models', config.models)}
        </div>
      </div>

      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full">
             <div className="flex justify-between items-center mb-4"><h3 className="font-bold">Düzenle</h3><button onClick={() => setEditModal(null)}><X size={20}/></button></div>
             <form onSubmit={handleUpdate} className="space-y-4">
                <input type="text" className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-700" value={editModal.newVal} onChange={(e) => setEditModal({...editModal, newVal: e.target.value})} />
                {(editModal.type === 'brands' || editModal.type === 'models') && (
                     <input type="text" className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-700 text-xs" placeholder="Resim URL" value={editModal.newImage || ''} onChange={(e) => setEditModal({...editModal, newImage: e.target.value})} />
                )}
                <div className="flex gap-3"><button type="button" onClick={() => setEditModal(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl">İptal</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl">Güncelle</button></div>
             </form>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center max-w-sm w-full">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
              <p className="font-bold mb-2">"{deleteModal.val}" Silinsin mi?</p>
              <div className="grid grid-cols-2 gap-3 mt-6"><button onClick={() => setDeleteModal(null)} className="py-3 bg-slate-100 rounded-xl">Vazgeç</button><button onClick={handleDelete} className="py-3 bg-red-600 text-white rounded-xl">Evet, Sil</button></div>
           </div>
        </div>
      )}
    </div>
  );
};