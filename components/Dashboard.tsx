
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Printer, TonerStock, StockLog, ServiceRecord } from '../types';
import { Printer as PrinterIcon, Wrench, RefreshCw, Activity, Package, Clock, ShieldAlert, Calendar } from 'lucide-react';
import { LoadingScreen } from './LoadingScreen';

interface DashboardProps {
    setActiveTab?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [stocks, setStocks] = useState<TonerStock[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [p, s, l, srv] = await Promise.all([
        StorageService.getPrinters(),
        StorageService.getStocks(),
        StorageService.getLogs(),
        StorageService.getServiceRecords()
    ]);
    setPrinters(p);
    setStocks(s);
    setLogs(l);
    setServices(srv);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
      return <LoadingScreen message="Sistem durumu analiz ediliyor..." />;
  }

  const totalActive = printers.filter(p => p.status === 'ACTIVE').length;
  const lowStockCount = stocks.filter(s => s.quantity < 3).length;
  const pendingServices = services.filter(s => s.status === 'PENDING').length;
  const totalTonerOut = logs.filter(l => l.type === 'OUT').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Üst Bilgi */}
      <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">SİSTEM ÖZETİ</h2>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-1">Anlık Cihaz ve Stok Durumu</p>
          </div>
          <button onClick={fetchData} className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:text-emerald-500 transition-all active:scale-90">
            <RefreshCw size={24}/>
          </button>
      </div>
      
      {/* V3 Klasik Sade Kartlar - Tıklanabilir hale getirildi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Aktif Cihazlar -> Yazıcılar */}
        <div 
            onClick={() => setActiveTab?.('printers')}
            className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] shadow-xl border border-zinc-100 dark:border-zinc-900 relative overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl w-fit mb-6">
              <PrinterIcon size={32} />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Aktif Cihazlar</p>
            <h3 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">{totalActive}<span className="text-emerald-500 text-2xl ml-1">/ {printers.length}</span></h3>
          </div>
        </div>

        {/* Bekleyen Servis -> Servis */}
        <div 
            onClick={() => setActiveTab?.('service')}
            className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] shadow-xl border border-zinc-100 dark:border-zinc-900 relative overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="p-4 bg-orange-50 dark:bg-orange-950/40 text-orange-600 rounded-2xl w-fit mb-6">
              <Clock size={32} />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Bekleyen Servis</p>
            <h3 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">{pendingServices}<span className="text-orange-500 text-2xl ml-1">Kayıt</span></h3>
          </div>
        </div>

        {/* Kritik Stok -> Stok */}
        <div 
            onClick={() => setActiveTab?.('stock')}
            className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] shadow-xl border border-zinc-100 dark:border-zinc-900 relative overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-2xl w-fit mb-6">
              <Package size={32} />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Kritik Stok</p>
            <h3 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">{lowStockCount}<span className="text-red-500 text-2xl ml-1">Model</span></h3>
          </div>
        </div>

        {/* Toner Değişimleri -> Geçmiş Kayıtlar */}
        <div 
            onClick={() => setActiveTab?.('history')}
            className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] shadow-xl border border-zinc-100 dark:border-zinc-900 relative overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-2xl w-fit mb-6">
              <Activity size={32} />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Toner Değişimleri</p>
            <h3 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">{totalTonerOut}<span className="text-blue-500 text-2xl ml-1">Adet</span></h3>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-[3rem] border border-zinc-100 dark:border-zinc-900">
              <h4 className="font-black text-zinc-900 dark:text-white mb-6 uppercase tracking-widest text-sm flex items-center gap-2"><Activity size={20} className="text-emerald-500" /> Son Stok Hareketleri</h4>
              <div className="space-y-4">
                  {logs.slice(0, 5).map(log => {
                      const logDate = new Date(log.date);
                      return (
                        <div key={log.id} className="bg-white dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group/item hover:border-amber-400/50 transition-all">
                            <div className="flex gap-4 items-center">
                                <div className={`p-3 rounded-xl ${log.type === 'IN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                    {log.type === 'IN' ? <Package size={18} /> : <Activity size={18} />}
                                </div>
                                <div>
                                    <p className="font-black text-xs text-zinc-800 dark:text-zinc-100 uppercase tracking-tight">{log.tonerModel}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[9px] text-zinc-400 font-bold uppercase">{log.description}</p>
                                        <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-800 rounded-full"></span>
                                        <p className="text-[9px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar size={10} /> {logDate.toLocaleDateString('tr-TR')} - {logDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl shadow-sm ${log.type === 'IN' ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
                                {log.type === 'IN' ? '+ GİRİŞ' : '- ÇIKIŞ'}
                            </span>
                        </div>
                      );
                  })}
                  {logs.length === 0 && <p className="text-zinc-400 text-xs italic text-center py-4 uppercase font-bold tracking-widest">Henüz kayıt bulunmuyor.</p>}
              </div>
          </div>

          <div className="bg-zinc-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute right-0 bottom-0 opacity-5 transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-1000">
                  <ShieldAlert size={240} />
              </div>
              <div className="relative z-10">
                  <h4 className="text-2xl font-black tracking-tighter mb-4 uppercase">Operasyonel Durum</h4>
                  <p className="text-zinc-400 font-medium mb-8 leading-relaxed italic">"Sisteminiz şu anda sorunsuz çalışıyor. Tüm cihazların sayaçları ve toner seviyeleri kontrol altında."</p>
                  <div className="flex items-center gap-4">
                      <div className="bg-emerald-500/20 p-4 rounded-3xl backdrop-blur-md border border-emerald-500/30">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Son Senkronizasyon</p>
                          <p className="text-xl font-black">{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="bg-amber-500/10 p-4 rounded-3xl backdrop-blur-md border border-amber-500/20">
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Tarih</p>
                          <p className="text-xl font-black">{new Date().toLocaleDateString('tr-TR')}</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
