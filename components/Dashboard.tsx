import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Printer, TonerStock, StockLog, ServiceRecord } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { AlertCircle, CheckCircle2, Clock, Printer as PrinterIcon, Wallet, Wrench, RefreshCw } from 'lucide-react';
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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Genel Bakış & Finansal Durum</h2>
          <button onClick={fetchData} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-500 hover:text-primary-500"><RefreshCw size={20}/></button>
      </div>
      
      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:border-primary-200 transition-all">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Toplam Yazıcı</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{totalPrinters}</p>
          </div>
          <div className="p-3 bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-full">
            <PrinterIcon size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Stok Adedi</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{totalStockItems}</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
           <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Bakım Maliyeti</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{totalServiceCost.toLocaleString()} ₺</p>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-full">
            <Wrench size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
           <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Toner Maliyeti</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{totalTonerCost.toLocaleString()} ₺</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
            <Wallet size={20} />
          </div>
        </div>
      </div>

      {lowStockItems.length > 0 && (
         <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-red-600 dark:text-red-400" />
            <div>
               <h4 className="font-bold text-red-700 dark:text-red-400">Kritik Stok Uyarısı</h4>
               <p className="text-sm text-red-600 dark:text-red-300">
                  Şu modellerde stok 3'ün altına düştü: {lowStockItems.map(s => s.modelName).join(', ')}
               </p>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-80">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Stok Dağılımı</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockData}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-80 overflow-y-auto">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 sticky top-0 bg-white dark:bg-slate-800 pb-2 border-b dark:border-slate-700">Son Hareketler</h3>
          <div className="space-y-4">
            {logs.length === 0 && <p className="text-slate-400 text-sm">Hareket kaydı bulunamadı.</p>}
            {logs.slice(0, 10).map(log => (
              <div key={log.id} className="flex gap-3 text-sm">
                <div className={`mt-1 min-w-[8px] h-2 rounded-full ${log.type === 'IN' ? 'bg-green-500' : 'bg-orange-500'}`} />
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">
                    {log.type === 'IN' ? 'Stok Girişi' : 'Toner Çıkışı'}
                    <span className="text-slate-400 dark:text-slate-500 font-normal ml-2">({log.tonerModel})</span>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{log.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500">
                    <Clock size={10} />
                    <span>{new Date(log.date).toLocaleDateString('tr-TR')} {new Date(log.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</span>
                    <span>•</span>
                    <span>{log.user}</span>
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