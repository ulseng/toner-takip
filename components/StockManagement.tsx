import React, { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, CheckCircle, AlertTriangle, Search, Banknote, Calendar, Settings as SettingsIcon, MessageCircle, Printer as PrinterIcon } from 'lucide-react';
import { TonerStock, Printer, StockLog, SystemConfig } from '../types';
import { StorageService } from '../services/storage';
import { LoadingScreen } from './LoadingScreen';

interface StockManagementProps {
  user: { name: string };
}

export const StockManagement: React.FC<StockManagementProps> = ({ user }) => {
  const [stocks, setStocks] = useState<TonerStock[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]); // New State for History
  const [config, setConfig] = useState<SystemConfig>({ brands: [], models: [], suppliers: [], tonerModels: [] });
  const [activeTab, setActiveTab] = useState<'LIST' | 'IN' | 'OUT'>('LIST');
  const [loading, setLoading] = useState(true);

  // Transaction States
  const [selectedPrinterId, setSelectedPrinterId] = useState('');
  const [selectedTonerModel, setSelectedTonerModel] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState(0); 
  const [newStockModel, setNewStockModel] = useState(''); 
  const [description, setDescription] = useState('');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]); // Default today YYYY-MM-DD
  
  // Notification
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    const [s, p, l, c] = await Promise.all([
      StorageService.getStocks(),
      StorageService.getPrinters(),
      StorageService.getLogs(),
      StorageService.getConfig()
    ]);
    setStocks(s);
    setPrinters(p);
    setLogs(l);
    setConfig(c);
    setLoading(false);
    // Reset date to today on refresh just in case
    setCustomDate(new Date().toISOString().split('T')[0]);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const checkLowStockAndNotify = (model: string, newQty: number) => {
    if (newQty <= 1) {
       if (config.whatsappNumber) {
         setTimeout(() => {
            alert(`⚠️ SİSTEM UYARISI: ${model} toneri kritik seviyeye (${newQty}) düştü! WhatsApp bildirimi ${config.whatsappNumber} numarasına gönderildi.`);
         }, 500);
       }
    }
  };

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const model = newStockModel.trim();
    if (!model) {
      showMessage('error', 'Lütfen bir model seçiniz.');
      return;
    }

    const existingStock = stocks.find(s => s.modelName === model);
    const newQty = (existingStock ? existingStock.quantity : 0) + quantity;

    await StorageService.saveStock({ modelName: model, quantity: newQty });
    
    const log: StockLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'IN',
      tonerModel: model,
      quantity: quantity,
      description: 'Stok Girişi (Manuel)',
      user: user.name,
      cost: cost 
    };
    await StorageService.addLog(log);

    await refreshData();
    showMessage('success', `${quantity} adet ${model} stoğa eklendi.`);
    setNewStockModel('');
    setQuantity(1);
    setCost(0);
    setActiveTab('LIST');
  };

  const handleStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTonerModel) {
      showMessage('error', 'Lütfen toner seçiniz.');
      return;
    }
    
    const stock = stocks.find(s => s.modelName === selectedTonerModel);

    if (!stock || stock.quantity < 1) {
      showMessage('error', 'Yetersiz stok!');
      return;
    }

    const now = new Date();
    const logDate = new Date(customDate);
    logDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    const isoLogDate = logDate.toISOString();

    const newQuantity = stock.quantity - 1;
    await StorageService.saveStock({ modelName: selectedTonerModel, quantity: newQuantity });
    
    checkLowStockAndNotify(selectedTonerModel, newQuantity);

    let printerDesc = "";

    if (selectedPrinterId && selectedPrinterId !== 'MANUAL') {
      const printer = printers.find(p => p.id === selectedPrinterId);
      if (printer) {
         printerDesc = `${printer.location} (${printer.floor})`;
         const isNewerDate = isoLogDate > printer.lastTonerDate;
         const updatedPrinter = {
            ...printer,
            lastTonerDate: isNewerDate ? isoLogDate : printer.lastTonerDate
         };
         await StorageService.updatePrinter(updatedPrinter);
      }
    }

    const log: StockLog = {
      id: '',
      date: isoLogDate,
      type: 'OUT',
      tonerModel: selectedTonerModel,
      quantity: 1,
      printerId: selectedPrinterId === 'MANUAL' ? undefined : selectedPrinterId,
      description: (selectedPrinterId && selectedPrinterId !== 'MANUAL') ? `Yazıcıya Takıldı: ${printerDesc}` : `Stok Çıkışı: ${description}`,
      user: user.name
    };
    await StorageService.addLog(log);

    await refreshData();
    showMessage('success', `${selectedTonerModel} stoktan düşüldü.`);
    setSelectedPrinterId('');
    setSelectedTonerModel('');
    setActiveTab('LIST');
  };

  const onPrinterSelect = (printerId: string) => {
    setSelectedPrinterId(printerId);
    const printer = printers.find(p => p.id === printerId);
    if (printer) {
      if (printer.compatibleToner) setSelectedTonerModel(printer.compatibleToner);
    }
  };

  const sendWhatsappOrder = (model: string) => {
     const text = `Merhaba, ${model} model toner stoğumuz kritik seviyenin altına düştü. Sipariş vermek istiyoruz.`;
     const url = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(text)}`;
     window.open(url, '_blank');
  };

  const outputLogs = logs.filter(l => l.type === 'OUT');

  const getPrinterStatusText = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'Aktif';
      case 'SPARE': return 'Yedekte';
      case 'MAINTENANCE': return 'Serviste';
      case 'BROKEN': return 'Arızalı';
      case 'SCRAPPED': return 'Hurda';
      default: return '';
    }
  };

  if (loading) {
    return <LoadingScreen message="Stok verileri güncelleniyor..." />;
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl text-white z-50 animate-bounce ${message.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {message.text}
        </div>
      )}

      <div className="flex space-x-2 bg-white dark:bg-zinc-900 p-1 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 w-fit">
        <button 
          onClick={() => setActiveTab('LIST')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'LIST' ? 'bg-zinc-900 dark:bg-zinc-700 text-white' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          Stok Listesi
        </button>
        <button 
          onClick={() => setActiveTab('IN')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'IN' ? 'bg-emerald-600 text-white' : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
        >
          <ArrowDown size={16} /> Stok Giriş
        </button>
        <button 
          onClick={() => setActiveTab('OUT')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'OUT' ? 'bg-orange-600 text-white' : 'text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
        >
          <ArrowUp size={16} /> Toner Çıkış
        </button>
      </div>

      {activeTab === 'LIST' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stocks.map(stock => (
            <div key={stock.modelName} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-center relative group hover:border-emerald-500/50 transition-colors">
              <h3 className="text-3xl font-bold text-zinc-800 dark:text-white mb-1">{stock.quantity}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">Model: {stock.modelName}</p>
              
              {stock.quantity < 3 && (
                 <div className="mt-2 flex flex-col gap-2 w-full">
                    <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-1 rounded-full flex items-center justify-center gap-1 mx-auto">
                      <AlertTriangle size={12} /> Kritik
                    </span>
                    {config.whatsappNumber && (
                        <button 
                          onClick={() => sendWhatsappOrder(stock.modelName)}
                          className="text-xs bg-emerald-500 text-white px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-emerald-600"
                        >
                            <MessageCircle size={12} /> Sipariş Ver
                        </button>
                    )}
                 </div>
              )}
            </div>
          ))}
          {stocks.length === 0 && (
            <div className="col-span-full p-8 text-center text-zinc-400">Henüz stok kaydı yok.</div>
          )}
        </div>
      )}

      {activeTab === 'IN' && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 max-w-lg">
          <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-700 dark:text-emerald-400"><ArrowDown size={20}/></div>
            Stok Girişi Yap
          </h3>
          <form onSubmit={handleStockIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Toner/Mürekkep Modeli</label>
              <div className="relative">
                 <select 
                    required
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white appearance-none"
                    value={newStockModel}
                    onChange={e => setNewStockModel(e.target.value)}
                 >
                    <option value="">Listeden Seçiniz</option>
                    {config.tonerModels?.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▼</div>
              </div>
              <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
                <SettingsIcon size={12} /> Listede olmayan modelleri "Ayarlar" sayfasından ekleyebilirsiniz.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Adet</label>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 bg-zinc-100 dark:bg-zinc-700 rounded-lg font-bold text-zinc-700 dark:text-white">-</button>
                <input 
                  type="number" 
                  min="1"
                  required
                  className="w-full text-center p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                />
                <button type="button" onClick={() => setQuantity(quantity + 1)} className="p-3 bg-zinc-100 dark:bg-zinc-700 rounded-lg font-bold text-zinc-700 dark:text-white">+</button>
              </div>
            </div>

             <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                 Toplam Maliyet (TL) 
                 <span className="text-xs font-normal text-zinc-400 ml-1">(Ücretsizse 0 giriniz)</span>
              </label>
              <div className="relative">
                 <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                 <input 
                   type="number" 
                   min="0"
                   className="w-full pl-10 p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                   value={cost}
                   onChange={e => setCost(parseFloat(e.target.value) || 0)}
                 />
              </div>
            </div>

            <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20">
              Stok Ekle
            </button>
          </form>
        </div>
      )}

      {activeTab === 'OUT' && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 w-full lg:w-1/2">
             <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-700 dark:text-orange-400"><ArrowUp size={20}/></div>
              Toner Çıkışı (Değişim)
            </h3>
            <form onSubmit={handleStockOut} className="space-y-5">
              
              {/* DATE SELECTOR */}
              <div>
                 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">İşlem Tarihi</label>
                 <div className="relative cursor-pointer" onClick={() => (document.getElementById('date-picker') as HTMLInputElement)?.showPicker()}>
                     <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                     <input 
                        id="date-picker"
                        type="date" 
                        required
                        className="w-full pl-10 p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white cursor-pointer"
                        value={customDate}
                        onChange={e => setCustomDate(e.target.value)}
                        onClick={(e) => e.currentTarget.showPicker()}
                     />
                 </div>
                 <p className="text-[10px] text-zinc-400 mt-1 ml-1">Kutunun herhangi bir yerine tıklayarak takvimi açabilirsiniz.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Hangi Yazıcıya?</label>
                <select 
                  className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  value={selectedPrinterId}
                  onChange={(e) => onPrinterSelect(e.target.value)}
                >
                  <option value="">-- Yazıcı Seçiniz --</option>
                  {printers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.location} ({p.model}) - {getPrinterStatusText(p.status)}
                    </option>
                  ))}
                  <option value="MANUAL">Listede Yok / Manuel Çıkış</option>
                </select>
              </div>

              {selectedPrinterId === 'MANUAL' && (
                 <div>
                 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Açıklama / Yer</label>
                 <input 
                   className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                   placeholder="Örn: 3. Kat Depo"
                   value={description}
                   onChange={e => setDescription(e.target.value)}
                   required
                 />
               </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Verilen Toner Modeli</label>
                <select 
                  required
                  className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  value={selectedTonerModel}
                  onChange={e => setSelectedTonerModel(e.target.value)}
                >
                  <option value="">-- Model Seçiniz --</option>
                  {stocks.map(s => (
                    <option key={s.modelName} value={s.modelName} disabled={s.quantity <= 0}>
                      {s.modelName} (Stok: {s.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-sm text-orange-800 dark:text-orange-200 border border-orange-100 dark:border-orange-800/30">
                <p>Onayladığınızda stoktan <strong>1 adet</strong> düşülecektir.</p>
                {selectedPrinterId && selectedPrinterId !== 'MANUAL' && (
                  <p className="mt-1">Cihazın "Son Toner Tarihi" güncellenecektir.</p>
                )}
              </div>

              <button type="submit" className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/20">
                Çıkış Yap & Onayla
              </button>
            </form>
          </div>
          
          {/* Recent Outputs Table */}
          <div className="w-full lg:w-1/2">
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 h-full max-h-[600px] overflow-hidden flex flex-col">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
                   <Calendar size={20} className="text-zinc-500"/> Son Toner Çıkış Hareketleri
                </h3>
                <div className="overflow-y-auto flex-1">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 dark:bg-zinc-800 sticky top-0">
                         <tr>
                            <th className="p-3 text-zinc-500 dark:text-zinc-400 font-medium">Toner</th>
                            <th className="p-3 text-zinc-500 dark:text-zinc-400 font-medium">Tarih</th>
                            <th className="p-3 text-zinc-500 dark:text-zinc-400 font-medium">Açıklama</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                         {outputLogs.slice(0, 15).map(log => (
                            <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                               <td className="p-3 font-medium text-zinc-800 dark:text-white">{log.tonerModel}</td>
                               <td className="p-3 text-xs text-zinc-500 dark:text-zinc-400">{new Date(log.date).toLocaleDateString('tr-TR')}</td>
                               <td className="p-3 text-zinc-600 dark:text-zinc-300 max-w-[120px] truncate" title={log.description}>{log.description}</td>
                            </tr>
                         ))}
                         {outputLogs.length === 0 && (
                            <tr><td colSpan={3} className="p-4 text-center text-zinc-400">Henüz çıkış kaydı yok.</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};