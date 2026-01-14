
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { StockLog, ActivityLog } from '../types';
import { ArrowDown, ArrowUp, Download, FileSpreadsheet, History as HistoryIcon, Clock, User as UserIcon, Activity } from 'lucide-react';
import { LoadingScreen } from './LoadingScreen';

export const History: React.FC = () => {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'STOCK' | 'SYSTEM'>('STOCK');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      setLoading(true);
      const [stockLogs, activityLogs] = await Promise.all([
          StorageService.getLogs(),
          StorageService.getActivities()
      ]);
      setLogs(stockLogs);
      setActivities(activityLogs);
      setLoading(false);
  };

  const downloadCSV = () => {
    if (tab === 'STOCK' && logs.length === 0) return;
    
    const headers = tab === 'STOCK' 
        ? ["Tarih", "Saat", "Islem Turu", "Toner Modeli", "Miktar", "Maliyet", "Aciklama", "Kullanici"]
        : ["Tarih", "Saat", "Aktivite", "Detay", "Kullanici"];
    
    const rows = tab === 'STOCK' 
        ? logs.map(log => {
            const d = new Date(log.date);
            return [d.toLocaleDateString('tr-TR'), d.toLocaleTimeString('tr-TR'), log.type === 'IN' ? 'Giris' : 'Cikis', log.tonerModel, log.quantity, log.cost || 0, `"${log.description}"`, log.user].join(",");
          })
        : activities.map(act => {
            const d = new Date(act.date);
            return [d.toLocaleDateString('tr-TR'), d.toLocaleTimeString('tr-TR'), act.action, `"${act.details}"`, act.user].join(",");
          });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `toner_${tab.toLowerCase()}_gecmis_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <LoadingScreen message="Geçmiş kayıtlar analiz ediliyor..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">İşlem Geçmişi & Loglar</h2>
          <div className="flex gap-2 w-full sm:w-auto">
              <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl flex gap-1">
                  <button onClick={() => setTab('STOCK')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${tab === 'STOCK' ? 'bg-zinc-900 dark:bg-zinc-700 text-white shadow-lg' : 'text-zinc-500'}`}>Stok</button>
                  <button onClick={() => setTab('SYSTEM')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${tab === 'SYSTEM' ? 'bg-zinc-900 dark:bg-zinc-700 text-white shadow-lg' : 'text-zinc-500'}`}>Sistem</button>
              </div>
              <button onClick={downloadCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase transition-all shadow-lg shadow-emerald-500/20"><FileSpreadsheet size={18} /> Aktar</button>
          </div>
      </div>
      
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'STOCK' ? (
              <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-black uppercase text-[10px] tracking-widest border-b border-zinc-100 dark:border-zinc-800">
                  <tr>
                    <th className="p-5">Zaman</th>
                    <th className="p-5">Tür</th>
                    <th className="p-5">Toner</th>
                    <th className="p-5">Miktar</th>
                    <th className="p-5">Maliyet</th>
                    <th className="p-5">Açıklama</th>
                    <th className="p-5">Kullanıcı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="p-5 whitespace-nowrap">
                        <span className="font-bold">{new Date(log.date).toLocaleDateString('tr-TR')}</span><br/>
                        <span className="text-[10px] opacity-40 font-mono">{new Date(log.date).toLocaleTimeString('tr-TR')}</span>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${log.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {log.type === 'IN' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                          {log.type === 'IN' ? 'Giriş' : 'Çıkış'}
                        </span>
                      </td>
                      <td className="p-5 font-black text-zinc-900 dark:text-white">{log.tonerModel}</td>
                      <td className="p-5 font-mono">{log.quantity}</td>
                      <td className="p-5 font-bold">{log.cost ? `${log.cost} ₺` : '-'}</td>
                      <td className="p-5 text-xs italic">{log.description}</td>
                      <td className="p-5 font-bold">{log.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {activities.map(act => (
                      <div key={act.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all flex items-start gap-4">
                          <div className={`p-3 rounded-2xl ${act.action.includes('SILINDI') ? 'bg-red-50 text-red-500' : act.action.includes('GUNCELLEME') ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                              <Activity size={20} />
                          </div>
                          <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-black text-zinc-900 dark:text-white text-xs uppercase tracking-widest">{act.action.replace('_', ' ')}</h4>
                                  <span className="text-[10px] font-mono text-zinc-400">{new Date(act.date).toLocaleString('tr-TR')}</span>
                              </div>
                              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{act.details}</p>
                              <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black uppercase text-zinc-400 bg-zinc-100 dark:bg-zinc-800 w-fit px-2 py-1 rounded-md">
                                  <UserIcon size={12}/> {act.user}
                              </div>
                          </div>
                      </div>
                  ))}
                  {activities.length === 0 && <div className="p-20 text-center text-zinc-400 font-bold uppercase tracking-widest">Aktivite kaydı bulunamadı.</div>}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
