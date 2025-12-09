import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { StockLog } from '../types';
import { ArrowDown, ArrowUp, Download, FileSpreadsheet } from 'lucide-react';

export const History: React.FC = () => {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const data = await StorageService.getLogs();
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  // New Feature: Export to CSV
  const downloadCSV = () => {
    if (logs.length === 0) {
        alert('İndirilecek kayıt bulunamadı.');
        return;
    }

    // CSV Headers
    const headers = ["Tarih", "Saat", "Islem Turu", "Toner Modeli", "Miktar", "Maliyet", "Aciklama", "Kullanici"];
    
    // CSV Rows
    const rows = logs.map(log => {
        const d = new Date(log.date);
        const dateStr = d.toLocaleDateString('tr-TR');
        const timeStr = d.toLocaleTimeString('tr-TR');
        const typeStr = log.type === 'IN' ? 'Giris' : 'Cikis';
        // Escape quotes and commas for CSV format
        const cleanDesc = `"${log.description.replace(/"/g, '""')}"`;
        
        return [
            dateStr,
            timeStr,
            typeStr,
            log.tonerModel,
            log.quantity,
            log.cost || 0,
            cleanDesc,
            log.user
        ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + headers.join(",") + "\n" 
        + rows.join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `toner_gecmis_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
      return <div className="p-8 text-center text-slate-500">Geçmiş kayıtları yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">İşlem Geçmişi</h2>
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <FileSpreadsheet size={20} /> Excel'e Aktar (CSV)
          </button>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-medium">
              <tr>
                <th className="p-4">Tarih</th>
                <th className="p-4">Tür</th>
                <th className="p-4">Toner</th>
                <th className="p-4">Miktar</th>
                <th className="p-4">Maliyet</th>
                <th className="p-4">Açıklama</th>
                <th className="p-4">Kullanıcı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="p-4 whitespace-nowrap">
                    {new Date(log.date).toLocaleDateString('tr-TR')} <br/>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(log.date).toLocaleTimeString('tr-TR')}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      log.type === 'IN' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                    }`}>
                      {log.type === 'IN' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                      {log.type === 'IN' ? 'Giriş' : 'Çıkış'}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{log.tonerModel}</td>
                  <td className="p-4">{log.quantity}</td>
                  <td className="p-4">
                     {log.cost ? <span className="text-slate-700 dark:text-slate-300 font-medium">{log.cost} ₺</span> : '-'}
                  </td>
                  <td className="p-4 max-w-xs truncate" title={log.description}>{log.description}</td>
                  <td className="p-4">{log.user}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Kayıt bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};