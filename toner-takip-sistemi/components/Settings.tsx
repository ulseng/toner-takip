import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Tag, Box, MessageCircle, Truck, RefreshCw, Edit2, X, AlertTriangle, Droplet } from 'lucide-react';
import { StorageService } from '../services/storage';
import { SystemConfig, Printer } from '../types';

type ConfigType = 'brands' | 'models' | 'suppliers' | 'tonerModels';

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({ brands: [], models: [], suppliers: [], tonerModels: [] });
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Input States
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [newTonerModel, setNewTonerModel] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Modal States
  const [editModal, setEditModal] = useState<{ type: ConfigType, oldVal: string, newVal: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ type: ConfigType, val: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const c = await StorageService.getConfig();
    const p = await StorageService.getPrinters();
    setConfig(c);
    setWhatsappNumber(c.whatsappNumber || '');
    setPrinters(p);
    setLoading(false);
  };

  // --- ACTIONS ---

  // 1. ADD ITEM
  const handleAddItem = async (e: React.FormEvent, type: ConfigType, value: string, setter: (s: string) => void) => {
    e.preventDefault();
    const val = value.trim();
    if (val && !config[type].includes(val)) {
      const updated = { ...config, [type]: [...config[type], val] };
      await StorageService.saveConfig(updated);
      setConfig(updated);
      setter('');
    }
  };

  // 2. OPEN EDIT MODAL
  const openEdit = (type: ConfigType, oldVal: string) => {
    setEditModal({ type, oldVal, newVal: oldVal });
  };

  // 3. PERFORM UPDATE (Cascading Rename)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal || !editModal.newVal.trim()) return;
    
    const { type, oldVal, newVal } = editModal;
    const trimmedNewVal = newVal.trim();

    // 1. Update Config List
    const currentList = config[type];
    const updatedList = currentList.map(item => item === oldVal ? trimmedNewVal : item);
    const updatedConfig = { ...config, [type]: updatedList };
    await StorageService.saveConfig(updatedConfig);
    setConfig(updatedConfig);

    // 2. Cascade Update to Printers
    let printersUpdated = false;
    // We can't update array in place in DB, we must loop
    for (const p of printers) {
        let changed = false;
        let newP = { ...p };

        if (type === 'brands' && p.brand === oldVal) {
            newP.brand = trimmedNewVal;
            changed = true;
        }
        if (type === 'models' && p.model === oldVal) {
            newP.model = trimmedNewVal;
            changed = true;
        }
        if (type === 'suppliers' && p.supplier === oldVal) {
            newP.supplier = trimmedNewVal;
            changed = true;
        }
        if (type === 'tonerModels' && p.compatibleToner === oldVal) {
            newP.compatibleToner = trimmedNewVal;
            changed = true;
        }

        if (changed) {
            await StorageService.updatePrinter(newP);
            printersUpdated = true;
        }
    }

    if (printersUpdated) {
       const updatedPrinters = await StorageService.getPrinters();
       setPrinters(updatedPrinters);
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
    const updatedConfig = { ...config, [type]: updatedList };
    
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

  // Helper to render list items
  const renderList = (type: ConfigType, items: string[]) => (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {items.map((item, idx) => (
        <div key={`${item}-${idx}`} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 group hover:shadow-sm transition-all">
          <span className="font-medium text-slate-700 dark:text-slate-200">{item}</span>
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
      ))}
      {items.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Liste boş.</p>}
    </div>
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Ayarlar yükleniyor...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Save size={24} className="text-primary-600 dark:text-primary-400" />
          Sistem Ayarları
        </h2>
        <button 
          onClick={manualMaintenance}
          className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
        >
          <RefreshCw size={14} /> Verileri Senkronize Et
        </button>
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
          <form onSubmit={(e) => handleAddItem(e, 'brands', newBrand, setNewBrand)} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Yeni marka ekle..."
              className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
            />
            <button type="submit" className="bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 transition-colors">
              <Plus size={20} />
            </button>
          </form>
          {renderList('brands', config.brands)}
        </div>

        {/* MODELS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Box size={20} className="text-blue-500" /> Yazıcı Modelleri
          </h3>
          <form onSubmit={(e) => handleAddItem(e, 'models', newModel, setNewModel)} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Yeni model ekle..."
              className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
            />
            <button type="submit" className="bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 transition-colors">
              <Plus size={20} />
            </button>
          </form>
          {renderList('models', config.models)}
        </div>

         {/* TONER MODELS - NEW SECTION */}
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
             <p className="text-sm text-slate-500 mb-4">
               "{editModal.oldVal}" değerini değiştiriyorsunuz. Bu değişiklik, bu değeri kullanan <strong>tüm kayıtlarda</strong> da güncellenecektir.
             </p>
             <form onSubmit={handleUpdate}>
                <input 
                  autoFocus
                  type="text"
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white mb-4"
                  value={editModal.newVal}
                  onChange={(e) => setEditModal({...editModal, newVal: e.target.value})}
                />
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