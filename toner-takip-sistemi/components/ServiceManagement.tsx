
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Printer, ServiceRecord, User } from '../types';
// Added User as UserIcon to imports
import { Wrench, Plus, Save, Clock, CheckCircle2, XCircle, Calendar, Edit3, Trash2, X, Image as ImageIcon, Loader2, AlertCircle, FileText, User as UserIcon } from 'lucide-react';
import { LoadingScreen } from './LoadingScreen';

interface ServiceManagementProps {
  user: { name: string };
}

export const ServiceManagement: React.FC<ServiceManagementProps> = ({ user }) => {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    printerId: '',
    issue: '',
    actionTaken: '',
    note: '',
    provider: '',
    cost: 0,
    status: 'PENDING' as 'PENDING' | 'COMPLETED' | 'SCRAPPED',
    date: new Date().toISOString().split('T')[0],
    imageUrl: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [r, p] = await Promise.all([
      StorageService.getServiceRecords(),
      StorageService.getPrinters()
    ]);
    setRecords(r);
    setPrinters(p);
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      printerId: '',
      issue: '',
      actionTaken: '',
      note: '',
      provider: '',
      cost: 0,
      status: 'PENDING',
      date: new Date().toISOString().split('T')[0],
      imageUrl: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record: ServiceRecord) => {
    setEditingRecord(record);
    setFormData({
      printerId: record.printerId,
      issue: record.issue,
      actionTaken: record.actionTaken,
      note: record.note || '',
      provider: record.provider,
      cost: record.cost,
      status: record.status,
      date: new Date(record.date).toISOString().split('T')[0],
      imageUrl: record.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  const handlePrinterChange = (printerId: string) => {
    const printer = printers.find(p => p.id === printerId);
    setFormData(prev => ({ 
      ...prev, 
      printerId, 
      provider: printer?.supplier || '' 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const printer = printers.find(p => p.id === formData.printerId);
    if (!printer) {
      alert("Lütfen bir cihaz seçin.");
      return;
    }

    setSaving(true);
    try {
      const now = new Date();
      const serviceDate = new Date(formData.date);
      serviceDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

      const record: ServiceRecord = {
        id: editingRecord?.id || '',
        printerId: printer.id,
        printerName: `${printer.brand} ${printer.model} (${printer.location})`,
        date: serviceDate.toISOString(),
        issue: formData.issue,
        actionTaken: formData.actionTaken,
        note: formData.note,
        provider: formData.provider,
        cost: formData.cost,
        status: formData.status,
        imageUrl: formData.imageUrl || undefined
      };

      if (editingRecord) {
        await StorageService.updateServiceRecord(record, user.name);
      } else {
        await StorageService.addServiceRecord(record, user.name);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: ServiceRecord) => {
    if (window.confirm(`"${record.printerName}" cihazına ait bu servis kaydını silmek istediğinize emin misiniz?`)) {
      setLoading(true);
      await StorageService.deleteServiceRecord(record.id, user.name, record.printerName);
      fetchData();
    }
  };

  if (loading && records.length === 0) return <LoadingScreen message="Servis verileri yükleniyor..." />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Panel */}
      <div className="bg-white dark:bg-zinc-950 p-10 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/5 blur-3xl -ml-32 -mt-32"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-zinc-900 dark:text-white flex items-center gap-4 tracking-tighter uppercase">
            <Wrench size={48} className="text-orange-500" /> Servis Yönetimi
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg font-medium">Arıza kayıtlarını, servis notlarını ve değişim süreçlerini buradan yönetin.</p>
        </div>
        <button onClick={openAddModal} className="relative z-10 bg-orange-600 hover:bg-orange-500 text-white px-10 py-5 rounded-[2rem] font-black shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-3 text-sm tracking-widest uppercase">
          <Plus size={24} /> YENİ SERVİS KAYDI
        </button>
      </div>

      {/* Service List */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter flex items-center gap-3 pl-4">
          <Clock size={24} className="text-orange-500" /> Servis Geçmişi ve Hareketler
        </h3>
        
        <div className="grid grid-cols-1 gap-6">
          {records.map(record => (
            <div key={record.id} className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-900 shadow-xl overflow-hidden group hover:border-orange-500/30 transition-all">
              <div className="flex flex-col lg:flex-row">
                {/* Image Section (If exists) */}
                {record.imageUrl && (
                  <div className="lg:w-72 h-64 lg:h-auto shrink-0 relative overflow-hidden group/img">
                    <img src={record.imageUrl} alt="Servis Raporu" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                       <button onClick={() => window.open(record.imageUrl, '_blank')} className="p-3 bg-white rounded-2xl shadow-2xl text-orange-600 font-bold uppercase text-[10px] tracking-widest">RESMİ BÜYÜT</button>
                    </div>
                  </div>
                )}
                
                <div className="flex-1 p-8 lg:p-10 flex flex-col">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          record.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 
                          record.status === 'PENDING' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' : 
                          'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        }`}>
                          {record.status === 'COMPLETED' ? 'TAMAMLANDI' : record.status === 'PENDING' ? 'SERVİS BEKLİYOR' : 'HURDA / DEĞİŞİM'}
                        </span>
                        <span className="text-zinc-400 text-xs font-black flex items-center gap-2 uppercase tracking-widest">
                          <Calendar size={14} /> {new Date(record.date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <h4 className="text-2xl font-black text-zinc-900 dark:text-white uppercase leading-tight tracking-tighter mt-3">{record.printerName}</h4>
                    </div>
                    
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 text-right">
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Maliyet</p>
                       <p className="text-3xl font-black text-orange-600 dark:text-orange-400 font-mono">{record.cost.toLocaleString()} ₺</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                     <div className="space-y-4">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">ARIZA / SORUN</p>
                           <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{record.issue}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">YAPILAN MÜDAHALE</p>
                           <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{record.actionTaken}</p>
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                             <FileText size={12} /> SERVİS NOTU
                           </p>
                           <p className="text-sm text-zinc-500 dark:text-zinc-400 italic font-medium leading-relaxed">
                             {record.note || "Ek bir not girilmemiş."}
                           </p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">SERVİS SAĞLAYICI</p>
                           <p className="text-sm font-black text-zinc-700 dark:text-zinc-300">{record.provider}</p>
                        </div>
                     </div>
                  </div>

                  <div className="mt-auto pt-8 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
                     <div className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-2">
                        {record.lastModifiedBy && (
                          <span className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                             {/* Fixed UserIcon reference by importing it */}
                             <UserIcon size={12} /> Son Müdahale: {record.lastModifiedBy}
                          </span>
                        )}
                     </div>
                     <div className="flex gap-4">
                        <button 
                          onClick={() => openEditModal(record)}
                          className="px-6 py-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 shadow-sm"
                        >
                           <Edit3 size={16} /> MÜDAHALE ET / DÜZENLE
                        </button>
                        <button 
                          onClick={() => handleDelete(record)}
                          className="px-6 py-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                        >
                           <Trash2 size={16} /> SİL
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {records.length === 0 && (
            <div className="py-32 bg-zinc-50 dark:bg-zinc-900/50 rounded-[4rem] border-4 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-400 gap-6">
                <div className="p-8 bg-white dark:bg-zinc-800 rounded-full shadow-2xl opacity-50"><AlertCircle size={64} /></div>
                <p className="font-black text-2xl uppercase tracking-tighter">Henüz hiçbir servis kaydı bulunmuyor.</p>
                <button onClick={openAddModal} className="text-orange-500 font-black text-sm underline decoration-2 underline-offset-8 uppercase tracking-widest hover:text-orange-400 transition-colors">İLK KAYDI ŞİMDİ OLUŞTUR</button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Section */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-zinc-950 rounded-[4rem] w-full max-w-2xl shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-500 border border-zinc-100 dark:border-zinc-900 flex flex-col max-h-[95vh]">
            <div className="p-10 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
              <div>
                <h3 className="font-black text-3xl text-zinc-900 dark:text-white tracking-tighter uppercase">
                  {editingRecord ? 'SERVİS KAYDINA MÜDAHALE' : 'YENİ SERVİS KAYDI'}
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em] mt-2">Teknik Servis Takip Sistemi</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-4 bg-red-600 text-white rounded-3xl shadow-xl hover:bg-red-700 hover:rotate-90 transition-all active:scale-90"
              >
                <X size={32} strokeWidth={3} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-2">İşlem Tarihi</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full p-6 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-black outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-black transition-all cursor-pointer" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-2">Cihaz Seçimi</label>
                  <select 
                    required 
                    className="w-full p-6 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-black outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-black transition-all" 
                    value={formData.printerId}
                    onChange={e => handlePrinterChange(e.target.value)}
                  >
                    <option value="">Cihaz Seçin</option>
                    {printers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.brand} {p.model} - {p.location} {p.ipAddress ? `[${p.ipAddress}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-2">Arıza / Sorun</label>
                <input 
                  required 
                  type="text" 
                  className="w-full p-6 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-black text-lg outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-black transition-all" 
                  placeholder="Örn: Kağıt sıkıştırıyor, toner görmüyor..." 
                  value={formData.issue}
                  onChange={e => setFormData({...formData, issue: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-2">Yapılan Müdahale</label>
                <textarea 
                  required 
                  rows={2}
                  className="w-full p-6 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-black transition-all leading-relaxed" 
                  placeholder="Örn: Fuser ünitesi değişti, genel temizlik yapıldı..." 
                  value={formData.actionTaken}
                  onChange={e => setFormData({...formData, actionTaken: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-2">Servis Notu (Detaylar)</label>
                <textarea 
                  rows={4}
                  className="w-full p-6 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-black transition-all leading-relaxed" 
                  placeholder="Cihazın genel durumu, sonraki bakım önerileri veya servis tutanağı detayları..." 
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-2">Servis Sağlayıcı</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full p-6 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-black outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-black transition-all" 
                    placeholder="Örn: Enes Bilişim, Kendi Servisimiz..." 
                    value={formData.provider}
                    onChange={e => setFormData({...formData, provider: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-2">Maliyet (TL)</label>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    className="w-full p-6 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-black font-mono outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-black transition-all" 
                    value={formData.cost}
                    onChange={e => setFormData({...formData, cost: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-2">Servis Durumu</label>
                <div className="grid grid-cols-3 gap-4">
                   <button 
                     type="button" 
                     onClick={() => setFormData({...formData, status: 'PENDING'})} 
                     className={`py-6 rounded-3xl font-black text-[10px] tracking-widest uppercase transition-all ${formData.status === 'PENDING' ? 'bg-orange-600 text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                   >
                     Servis Bekliyor
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setFormData({...formData, status: 'COMPLETED'})} 
                     className={`py-6 rounded-3xl font-black text-[10px] tracking-widest uppercase transition-all ${formData.status === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                   >
                     Tamamlandı
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setFormData({...formData, status: 'SCRAPPED'})} 
                     className={`py-6 rounded-3xl font-black text-[10px] tracking-widest uppercase transition-all ${formData.status === 'SCRAPPED' ? 'bg-red-600 text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                   >
                     Hurda / Değişim
                   </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-2">Servis Raporu / Resim</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col items-center justify-center p-10 border-4 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-orange-500 hover:bg-orange-50/10 transition-all group">
                        <ImageIcon size={48} className="text-zinc-300 group-hover:text-orange-500 transition-colors mb-4" />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-orange-500">RAPORU ÇEK VEYA YÜKLE</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    
                    {formData.imageUrl ? (
                        <div className="relative group rounded-[2.5rem] overflow-hidden border-2 border-zinc-100 dark:border-zinc-800 shadow-2xl">
                            <img src={formData.imageUrl} className="w-full h-full object-cover" />
                            <button 
                                type="button" 
                                onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))} 
                                className="absolute top-4 right-4 p-3 bg-red-600 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-90 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center rounded-[2.5rem] border-4 border-zinc-50 dark:border-zinc-900/50 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-300 font-black text-[10px] uppercase tracking-widest text-center px-10">
                            Henüz bir görsel eklenmedi
                        </div>
                    )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full py-8 bg-orange-600 text-white rounded-[2.5rem] font-black shadow-2xl shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] mt-6 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24} />} 
                {editingRecord ? 'DEĞİŞİKLİKLERİ KAYDET' : 'SERVİS KAYDINI OLUŞTUR'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
