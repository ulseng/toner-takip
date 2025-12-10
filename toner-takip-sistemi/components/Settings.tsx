import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Tag, Box, MessageCircle, Truck, RefreshCw, Edit2, X, AlertTriangle, Droplet, Database, CheckCircle2, Loader2, ArrowRight, Image as ImageIcon, Link as LinkIcon, Printer } from 'lucide-react';
import { StorageService } from '../services/storage';
import { SystemConfig, Printer as PrinterType } from '../types';
import { LoadingScreen } from './LoadingScreen';

type ConfigType = 'brands' | 'models' | 'suppliers' | 'tonerModels';

// FULL DATA FROM SCREENSHOT (40 ITEMS) - RESTORED
export const INITIAL_PRINTER_DATA = [
  { s: 'QTS15057', ip: '236', m: 'iRC3325i', l: 'MUHASEBE' },
  { s: '34X19121', ip: '132', m: 'iR1643i', l: 'ARKA BANKO' },
  { s: 'NMNA023185', ip: '243', m: 'MF416DW', l: 'LABORATUVAR' },
  { s: 'USK13225', ip: '137', m: 'MF416DW', l: 'FİZİK TEDAVİ SERVİSİ' },
  { s: '34X19098', ip: '239', m: 'iR1643i', l: 'ACİL BANKO' },
  { s: '34x36825', ip: '246', m: 'iR1643i', l: 'TABURCULUK YENİ' }, // RED
  { s: '34X02913', ip: '152', m: 'iR1643i', l: 'OZLSGRT' },
  { s: 'NWP22326', ip: 'USB', m: 'MF416DW', l: 'MF4750 YEDEK' }, 
  { s: '2TG52222', ip: '238', m: 'MF440', l: 'ÖN BANKO' },
  { s: '3ZE17591', ip: 'USB', m: 'iR1643i', l: 'BOOKINGSURGEY' },
  { s: '35D22142', ip: '168', m: 'iR1643i', l: 'OZLSGRT-FATURA' },
  { s: '34X13960', ip: '247', m: 'iR1643i', l: 'ORTA BANKO' },
  { s: '34X28607', ip: '147', m: 'iR1643i', l: 'MUHASEBE2' },
  { s: 'NMNA023186', ip: '150', m: 'LBP251DW', l: 'RADYOLOJİ DR.' },
  { s: 'NMNA023191', ip: '145', m: 'LBP251DW', l: 'AMELİYATHANE' },
  { s: 'NMNA020233', ip: '156', m: 'LBP251DW', l: 'GÖĞÜS HAST.' },
  { s: 'NMNA022266', ip: '146', m: 'LBP251DW', l: '1.KAT POLK.' },
  { s: 'NMNA023071', ip: 'USB', m: 'LBP251DW', l: 'GENEL Y.B.' },
  { s: 'NMNA023073', ip: '151', m: 'LBP251DW', l: 'RADYOLOJİ' },
  { s: 'NMNA023079', ip: '142', m: 'LBP251DW', l: '3.KAT SERVİS' },
  { s: 'NMNA023075', ip: 'USB', m: 'LBP251DW', l: 'ACİL HEMŞİRE' },
  { s: 'NMNA023499', ip: '158', m: 'LBP251DW', l: '2.KAT SERVİS' },
  { s: 'NMNA023183', ip: '121', m: 'LBP251DW', l: 'ENFEKSİYON' },
  { s: 'NMNA023182', ip: 'USB', m: 'LBP251DW', l: 'OZLSGRT-DİLEK' },
  { s: 'NMNA023076', ip: 'USB', m: 'LBP251DW', l: 'DAHİLİYE AYCA HOCA' },
  { s: 'NMNA023189', ip: '153', m: 'LBP251DW', l: 'BEBEK Y.B.' },
  { s: 'NMNA020236', ip: 'USB', m: 'LBP251DW', l: 'GÖZ POLK.' },
  { s: 'USK31381', ip: '141', m: 'LBP251DW', l: '1.KAT VİP SERVİS' },
  { s: 'NMNA023496', ip: '140', m: 'LBP251DW', l: 'K.DOĞUM SERVİS' },
  { s: 'NMNA023077', ip: 'USB', m: 'LBP251DW', l: 'ECZANE' },
  { s: 'NMNA023187', ip: '136', m: 'LBP251DW', l: 'GÜZELLİK MERKEZİ' },
  { s: '34X36824', ip: '143', m: 'iR1643i', l: 'İNSAN KAYNAKLARI YENİ' }, // RED
  { s: 'NMNA020231', ip: '-', m: 'LBP251DW', l: 'İNSAN KAYNAKLARI(yedek)' }, 
  { s: 'NMNA020234', ip: 'USB', m: 'LBP251DW', l: 'İŞİTME TESTİ (ODİO)' },
  { s: 'NMNA023180', ip: 'USB', m: 'LBP251DW', l: 'HASTA HAKLARI YAPRAK' },
  { s: '34X36821', ip: '135', m: 'iR1643i', l: 'OZLSGRTOSS' },
  { s: 'NQGA077960', ip: '157', m: 'LBP223DW', l: 'OZLSGRT2' },
  { s: 'NMNA023495', ip: 'USB', m: 'LBP251DW', l: 'KALİTE ODASI' }, // ORANGE
  { s: '34M25642', ip: '160', m: 'MF645C', l: 'Sağlık Turizmi' }, // ORANGE
  { s: 'JA4B8254', ip: 'USB', m: 'DR-C230', l: 'OZLSGRT-DIDEM' } // ORANGE
];

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({ brands: [], models: [], suppliers: [], tonerModels: [], brandImages: {}, modelImages: {} });
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Import States
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  // Input States
  const [newBrand, setNewBrand] = useState('');
  const [newBrandImage, setNewBrandImage] = useState('');

  const [newModel, setNewModel] = useState('');
  const [newModelImage, setNewModelImage] = useState('');

  const [newSupplier, setNewSupplier] = useState('');
  const [newTonerModel, setNewTonerModel] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Modal States
  // Extended edit modal to handle image URLs
  const [editModal, setEditModal] = useState<{ type: ConfigType, oldVal: string, newVal: string, newImage?: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ type: ConfigType, val: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // --- ESC KEY LISTENER ---
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

  // --- BULK IMPORT ---
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
                brand: 'Canon', // Most are Canon in the list
                model: item.m,
                location: item.l,
                floor: 'Giriş/Poliklinik', // Default filler
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
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        await loadData();
        alert(`İŞLEM BAŞARILI!\nToplam ${count} adet yazıcı sisteme kaydedildi.`);
    } catch (e) {
        console.error("IMPORT ERROR:", e);
        alert('İçe aktarma sırasında bir hata oluştu. Veritabanı bağlantınızı kontrol edin.');
    } finally {
        setIsImporting(false);
    }
  };

  // --- ACTIONS ---

  // 1. ADD ITEM (Generic + Image Support)
  const handleAddItem = async (e: React.FormEvent, type: ConfigType, value: string, setter: (s: string) => void, imageValue?: string, imageSetter?: (s: string) => void) => {
    e.preventDefault();
    const val = value.trim();
    if (val && !config[type].includes(val)) {
      let updated = { ...config, [type]: [...config[type], val] };
      
      // Save Image if provided and applicable
      if (imageValue && (type === 'brands' || type === 'models')) {
         const imgMapKey = type === 'brands' ? 'brandImages' : 'modelImages';
         updated = {
            ...updated,
            [imgMapKey]: {
                ...(updated[imgMapKey as keyof SystemConfig] as Record<string, string>),
                [val]: imageValue.trim()
            }
         }
      }

      await StorageService.saveConfig(updated);
      setConfig(updated);
      setter('');
      if (imageSetter) imageSetter('');
    }
  };

  // 2. OPEN EDIT MODAL
  const openEdit = (type: ConfigType, oldVal: string) => {
    let currentImage = '';
    if (type === 'brands') currentImage = config.brandImages?.[oldVal] || '';
    if (type === 'models') currentImage = config.modelImages?.[oldVal] || '';

    setEditModal({ type, oldVal, newVal: oldVal, newImage: currentImage });
  };

  // 3. PERFORM UPDATE (Cascading Rename + Image Update)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal || !editModal.newVal.trim()) return;
    
    const { type, oldVal, newVal, newImage } = editModal;
    const trimmedNewVal = newVal.trim();

    // 1. Update Config List
    const currentList = config[type];
    const updatedList = currentList.map(item => item === oldVal ? trimmedNewVal : item);
    
    let updatedConfig = { ...config, [type]: updatedList };

    // 2. Update Image Maps (If applicable)
    if (type === 'brands' || type === 'models') {
        const mapKey = type === 'brands' ? 'brandImages' : 'modelImages';
        const currentMap = { ...(updatedConfig[mapKey] || {}) };
        
        // Remove old key if name changed
        if (oldVal !== trimmedNewVal) {
             delete currentMap[oldVal];
        }
        // Set new key with new image (or empty if cleared)
        if (newImage) {
            currentMap[trimmedNewVal] = newImage.trim();
        } else {
             delete currentMap[trimmedNewVal]; // Remove if empty
        }

        updatedConfig = { ...updatedConfig, [mapKey]: currentMap };
    }

    await StorageService.saveConfig(updatedConfig);
    setConfig(updatedConfig);

    // 3. Cascade Update to Printers (only for renaming)
    if (oldVal !== trimmedNewVal) {
        let printersUpdated = false;
        for (const p of printers) {
            let changed = false;
            let newP = { ...p };

            if (type === 'brands' && p.brand === oldVal) { newP.brand = trimmedNewVal; changed = true; }
            if (type === 'models' && p.model === oldVal) { newP.model = trimmedNewVal; changed = true; }
            if (type === 'suppliers' && p.supplier === oldVal) { newP.supplier = trimmedNewVal; changed = true; }
            if (type === 'tonerModels' && p.compatibleToner === oldVal) { newP.compatibleToner = trimmedNewVal; changed = true; }

            if (changed) {
                await StorageService.updatePrinter(newP);
                printersUpdated = true;
            }
        }

        if (printersUpdated) {
            const updatedPrinters = await StorageService.getPrinters();
            setPrinters(updatedPrinters);
        }
    }

    setEditModal(null);
  };

  // 4. OPEN DELETE MODAL
  const openDelete = (type: ConfigType, val: string) => {
    setDeleteModal({ type, val });
  };

  // 5. PERFORM DELETE
  const handleDelete = async () => {
    if (!deleteModal) return;
    const { type, val } = deleteModal;

    const currentList = config[type];
    const updatedList = currentList.filter(item => item !== val);
    let updatedConfig = { ...config, [type]: updatedList };
    
    // Also cleanup images
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

  // Helper to render list items with images
  const renderList = (type: ConfigType, items: string[]) => (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
      {items.map((item, idx) => {
         let imgUrl = null;
         if (type === 'brands') imgUrl = config.brandImages?.[item];
         if (type === 'models') imgUrl = config.modelImages?.[item];

         return (
            <div key={`${item}-${idx}`} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 group hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
                {/* Image Preview */}
                {(type === 'brands' || type === 'models') && (
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                        {imgUrl ? (
                            <img src={imgUrl} alt={item} className="w-full h-full object-contain p-1" />
                        ) : (
                            /* Replaced ImageIcon with Printer to reflect context better */
                            <Printer size={16} className="text-slate-300 dark:text-slate-600" />
                        )}
                    </div>
                )}
                <span className="font-medium text-slate-700 dark:text-slate-200">{item}</span>
            </div>
            
            <div className="flex gap-2">
                <button 
                type="button" 
                onClick={() => openEdit(type, item)}
                className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                title="Düzenle"
                >
                <Edit2 size={16} />
                </button>
                <button 
                type="button" 
                onClick={() => openDelete(type, item)}
                className="p-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                title="Sil"
                >
                <Trash2 size={16} />
                </button>
            </div>
            </div>
         );
      })}
      {items.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Liste boş.</p>}
    </div>
  );

  if (loading) return <LoadingScreen message="Sistem ayarları yükleniyor..." />;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Save size={24} className="text-primary-600 dark:text-primary-400" />
          Sistem Ayarları
        </h2>
        <div className="flex gap-2">
            <button 
            onClick={manualMaintenance}
            className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
            >
            <RefreshCw size={14} /> Senkronize Et
            </button>
        </div>
      </div>
      
      {/* V1 Import Tool */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 p-6 rounded-xl shadow-lg border border-zinc-700 relative overflow-hidden">
         <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Database size={20} className="text-emerald-400" /> İlk Kurulum Aracı
            </h3>
            <p className="text-zinc-300 text-sm mb-4">Excel listesindeki 40 adet cihazı sisteme otomatik olarak kaydeder.</p>
            
            {isImporting ? (
                 <div className="w-full bg-emerald-900/50 rounded-xl p-4 border border-emerald-500/30 flex items-center gap-3">
                    <Loader2 size={24} className="text-emerald-400 animate-spin" />
                    <div className="flex-1">
                        <p className="text-emerald-100 font-bold text-sm">Cihazlar Yükleniyor...</p>
                        <p className="text-emerald-400 text-xs">İşlenen: {importProgress} / {INITIAL_PRINTER_DATA.length}</p>
                    </div>
                 </div>
            ) : showImportConfirm ? (
                <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-600 animate-in fade-in slide-in-from-top-2">
                    <p className="text-white font-bold mb-3 text-sm flex items-center gap-2">
                        <AlertTriangle size={16} className="text-yellow-400"/>
                        Onaylıyor musunuz?
                    </p>
                    <p className="text-zinc-300 text-xs mb-4">
                        Bu işlem {INITIAL_PRINTER_DATA.length} adet yazıcıyı veritabanına ekleyecektir.
                        İnternet bağlantınızın olduğundan emin olun.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowImportConfirm(false)}
                            className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            İptal
                        </button>
                        <button 
                            onClick={handleInitialImport}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20 transition-colors flex items-center justify-center gap-2"
                        >
                            Başlat <ArrowRight size={14}/>
                        </button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setShowImportConfirm(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                    <CheckCircle2 size={18} />
                    Excel Verilerini Yükle
                </button>
            )}
         </div>
      </div>

      {/* WhatsApp Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <MessageCircle size={20} className="text-green-600" /> WhatsApp Bildirim Numarası
        </h3>
        <div className="flex gap-2">
           <input 
              type="tel" 
              placeholder="905xxxxxxxxx"
              className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
            />
             <button onClick={handleSaveWhatsapp} className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 font-medium">
              Kaydet
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* BRANDS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Tag size={20} className="text-primary-500" /> Yazıcı Markaları
          </h3>
          <form onSubmit={(e) => handleAddItem(e, 'brands', newBrand, setNewBrand, newBrandImage, setNewBrandImage)} className="mb-4">
            <div className="flex flex-col gap-2">
                 <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Marka Adı (örn: Canon)"
                        className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                    />
                    <button type="submit" className="bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 transition-colors">
                        <Plus size={20} />
                    </button>
                 </div>
                 <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-100 dark:border-slate-600">
                    <LinkIcon size={16} className="text-slate-400" />
                    <input 
                        type="url" 
                        placeholder="Marka Logo URL (İsteğe bağlı)"
                        className="flex-1 bg-transparent border-none outline-none text-xs text-slate-600 dark:text-slate-300"
                        value={newBrandImage}
                        onChange={(e) => setNewBrandImage(e.target.value)}
                    />
                 </div>
            </div>
          </form>
          {renderList('brands', config.brands)}
        </div>

        {/* MODELS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Box size={20} className="text-blue-500" /> Yazıcı Modelleri
          </h3>
          <form onSubmit={(e) => handleAddItem(e, 'models', newModel, setNewModel, newModelImage, setNewModelImage)} className="mb-4">
             <div className="flex flex-col gap-2">
                 <div className="flex gap-2">
                    <input 
                    type="text" 
                    placeholder="Model Adı (örn: MF416dw)"
                    className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    />
                    <button type="submit" className="bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 transition-colors">
                    <Plus size={20} />
                    </button>
                 </div>
                 <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-100 dark:border-slate-600">
                    <Printer size={16} className="text-slate-400" />
                    <input 
                        type="url" 
                        placeholder="Model Fotoğraf URL (İsteğe bağlı)"
                        className="flex-1 bg-transparent border-none outline-none text-xs text-slate-600 dark:text-slate-300"
                        value={newModelImage}
                        onChange={(e) => setNewModelImage(e.target.value)}
                    />
                 </div>
            </div>
          </form>
          {renderList('models', config.models)}
        </div>

         {/* TONER MODELS */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Droplet size={20} className="text-purple-500" /> Toner Modelleri
          </h3>
          <form onSubmit={(e) => handleAddItem(e, 'tonerModels', newTonerModel, setNewTonerModel)} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Örn: 505, 85A..."
              className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              value={newTonerModel}
              onChange={(e) => setNewTonerModel(e.target.value)}
            />
            <button type="submit" className="bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 transition-colors">
              <Plus size={20} />
            </button>
          </form>
          {renderList('tonerModels', config.tonerModels || [])}
        </div>

        {/* SUPPLIERS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Truck size={20} className="text-orange-500" /> Tedarikçi / Servis Firmaları
          </h3>
          <form onSubmit={(e) => handleAddItem(e, 'suppliers', newSupplier, setNewSupplier)} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Yeni firma ekle..."
              className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              value={newSupplier}
              onChange={(e) => setNewSupplier(e.target.value)}
            />
            <button type="submit" className="bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 transition-colors">
              <Plus size={20} />
            </button>
          </form>
          {renderList('suppliers', config.suppliers)}
        </div>

      </div>

      {/* --- EDIT MODAL --- */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Düzenle</h3>
                <button onClick={() => setEditModal(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X size={20} className="text-slate-500"/></button>
             </div>
             
             <form onSubmit={handleUpdate}>
                <div className="mb-4">
                     <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">İsim</label>
                     <input 
                     autoFocus
                     type="text"
                     className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                     value={editModal.newVal}
                     onChange={(e) => setEditModal({...editModal, newVal: e.target.value})}
                     />
                </div>

                {/* Only Show Image Input for Brands/Models */}
                {(editModal.type === 'brands' || editModal.type === 'models') && (
                     <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Resim URL</label>
                        <div className="flex items-center gap-2">
                             <input 
                                type="text"
                                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono"
                                placeholder="https://..."
                                value={editModal.newImage || ''}
                                onChange={(e) => setEditModal({...editModal, newImage: e.target.value})}
                            />
                            {editModal.newImage && (
                                <div className="w-12 h-12 rounded border border-slate-200 flex items-center justify-center overflow-hidden bg-white shrink-0">
                                    <img src={editModal.newImage} alt="Preview" className="w-full h-full object-contain"/>
                                </div>
                            )}
                        </div>
                   </div>
                )}

                <div className="flex gap-3">
                   <button type="button" onClick={() => setEditModal(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-medium hover:bg-slate-200">İptal</button>
                   <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Güncelle</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* --- DELETE MODAL --- */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Siliniyor</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                 "{deleteModal.val}" listeden tamamen silinecek. Emin misiniz?
              </p>
              <div className="grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => setDeleteModal(null)}
                    className="py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                 >
                    Vazgeç
                 </button>
                 <button 
                    onClick={handleDelete}
                    className="py-3 px-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-colors"
                 >
                    Evet, Sil
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};