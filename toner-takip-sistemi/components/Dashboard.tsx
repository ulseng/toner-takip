import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Printer, TonerStock, StockLog, ServiceRecord } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { AlertCircle, CheckCircle2, Clock, Printer as PrinterIcon, Wallet, Wrench, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { LoadingScreen } from './LoadingScreen';

export const Dashboard: React.FC = () => {
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
      return <LoadingScreen message="Özet raporlar hazırlanıyor..." />;
  }

  const totalPrinters = printers.length;
  const totalStockItems = stocks.reduce((acc, curr) => acc + curr.quantity, 0);
  const lowStockItems = stocks.filter(s => s.quantity < 3);

  // Financial Calcs
  const totalServiceCost = services.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const totalTonerCost = logs.filter(l => l.type === 'IN').reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const grandTotal = totalServiceCost + totalTonerCost;

  // Prepare Chart Data
  const stockData = stocks.map(s => ({ name: s.modelName, value: s.quantity }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">Genel Bakış</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Sistem durum özeti ve finansal analiz</p>
          </div>
          <button onClick={fetchData} className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-emerald-500 transition-colors"><RefreshCw size={20}/></button>
      </div>
      
      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group hover:border-emerald-500/50 transition-all">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-wider mb-1">Toplam Yazıcı</p>
            <p className="text-3xl font-bold text-zinc-800 dark:text-white">{totalPrinters}</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:from-emerald-500 group-hover:to-teal-500 group-hover:text-white transition-all shadow-sm">
            <PrinterIcon size={24} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group hover:border-emerald-500/50 transition-all">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-wider mb-1">Stok Adedi</p>
            <p className="text-3xl font-bold text-zinc-800 dark:text-white">{totalStockItems}</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group hover:border-orange-500/50 transition-all">
           <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-wider mb-1">Bakım Maliyeti</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{totalServiceCost.toLocaleString()} ₺</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm">
            <Wrench size={24} />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group hover:border-emerald-500/50 transition-all">
           <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-wider mb-1">Toner Maliyeti</p>
            <p className="text-3xl font-bold text-zinc-800 dark:text-white">{totalTonerCost.toLocaleString()} ₺</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
            <Wallet size={24} />
          </div>
        </div>
      </div>

      {lowStockItems.length > 0 && (
         <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex items-start gap-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600">
                <AlertCircle size={20} />
            </div>
            <div>
               <h4 className="font-bold text-red-700 dark:text-red-400">Kritik Stok Uyarısı</h4>
               <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  Şu modellerde stok 3'ün altına düştü: <span className="font-bold">{lowStockItems.map(s => s.modelName).join(', ')}</span>
               </p>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 h-[400px] flex flex-col">
          <h3 className="font-bold text-zinc-700 dark:text-zinc-200 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500"/> Stok Dağılımı
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockData}>
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: '#18181b',
                        color: '#fff'
                    }}
                    itemStyle={{ color: '#34d399' }}
                />
                <Bar dataKey="value" fill="url(#colorGradient)" radius={[6, 6, 0, 0]}>
                    {stockData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#059669'} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 h-[400px] flex flex-col">
          <h3 className="font-bold text-zinc-700 dark:text-zinc-200 mb-4 sticky top-0 bg-white dark:bg-zinc-900 pb-2 flex items-center gap-2">
             <Clock size={20} className="text-emerald-500"/> Son Hareketler
          </h3>
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {logs.length === 0 && <p className="text-zinc-400 text-sm text-center py-10">Hareket kaydı bulunamadı.</p>}
            {logs.slice(0, 10).map(log => (
              <div key={log.id} className="flex gap-4 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors group">
                <div className={`mt-1 min-w-[36px] h-9 rounded-full flex items-center justify-center ${log.type === 'IN' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                    {log.type === 'IN' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                        {log.type === 'IN' ? 'Stok Girişi' : 'Toner Çıkışı'}
                        <span className="text-emerald-600 dark:text-emerald-400 ml-2 font-mono">({log.tonerModel})</span>
                    </p>
                    <span className="text-[10px] text-zinc-400 font-medium">{new Date(log.date).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">{log.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400">
                    <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-300 font-bold">{log.user}</span>
                    <span>{new Date(log.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};