import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Printer, CounterLog, User } from '../types';
import { Calculator, Upload, Save, AlertTriangle, FileSpreadsheet, CheckCircle2, Search, ArrowRight, ArrowUp, RefreshCw, X, Loader2, Globe } from 'lucide-react';
import { LoadingScreen } from './LoadingScreen';

interface CounterManagementProps {
  user: { name: string };
}

export const CounterManagement: React.FC<CounterManagementProps> = ({ user }) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'LIST' | 'IMPORT'>('LIST');
  const [isSaving, setIsSaving] = useState(false);

  // Input States for manual entry
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  
  // Import States
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [matchResults, setMatchResults] = useState<{matched: any[], unmatched: any[]}>({matched: [], unmatched: []});
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const p = await StorageService.getPrinters();
    setPrinters(p);
    setLoading(false);
  };

  // --- MANUAL ENTRY LOGIC ---
  const handleInputChange = (printerId: string, value: string) => {
    setInputValues(prev => ({ ...prev, [printerId]: value }));
  };

  const handleSingleSave = async (printer: Printer) => {
    const newValStr = inputValues[printer.id];
    if (!newValStr) return;
    
    const newVal = parseInt(newValStr);
    if (isNaN(newVal)) {
        alert('Lütfen geçerli bir sayı giriniz.');
        return;
    }
    
    // Validate counter integrity
    if (newVal < printer.lastCounter) {
        if (!confirm(`UYARI: Girdiğiniz sayaç (${newVal}), eski sayaçtan (${printer.lastCounter}) daha düşük. Cihaz sıfırlanmış olabilir mi? Yine de kaydetmek istiyor musunuz?`)) {
            return;
        }
    }

    try {
        await saveCounterLog(printer, newVal, 'Manuel Giriş');
        alert('Sayaç başarıyla güncellendi.');
        
        // Clear input and refresh
        setInputValues(prev => {
            const copy = {...prev};
            delete copy[printer.id];
            return copy;
        });
        fetchData();
    } catch (error) {
        console.error(error);
        alert('Kayıt sırasında bir hata oluştu.');
    }
  };

  const saveCounterLog = async (printer: Printer, currentCounter: number, method: string) => {
     const usage = currentCounter - printer.lastCounter;
     
     // 1. Create Log Entry (History)
     const log: CounterLog = {
         id: '',
         printerId: printer.id,
         printerName: `${printer.brand} ${printer.model}`,
         serialNumber: printer.serialNumber,
         date: new Date().toISOString(),
         previousCounter: printer.lastCounter,
         currentCounter: currentCounter,
         usage: usage > 0 ? usage : 0, // Prevent negative usage in logs unless strictly needed
         recordedBy: `${user.name} (${method})`
     };

     // 2. Save to Firestore (This adds log AND updates printer doc)
     await StorageService.addCounterLog(log);
  };

  // --- CSV IMPORT LOGIC (IMPROVED FOR CANON + IP INTEGRATION) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (!text) {
            setImportError("Dosya boş veya okunamadı.");
            return;
        }
        parseCSV(text);
    };
    reader.onerror = () => {
        setImportError("Dosya okuma hatası.");
    };
    reader.readAsText(file, 'UTF-8'); // Ensure UTF-8 reading
    e.target.value = ''; // Reset input
  };

  const parseCSV = (text: string) => {
      // Normalize line endings
      const lines = text.split(/\r\n|\n|\r/);
      
      if (lines.length < 2) {
          setImportError("Dosya içeriği çok kısa veya boş.");
          return;
      }

      // 1. Find the Header Row
      let headerRowIndex = -1;
      let delimiter = ','; // Default

      for (let i = 0; i < Math.min(lines.length, 25); i++) {
          const line = lines[i].toLowerCase();
          // Look for keywords common in Canon/Printer exports
          if (line.includes('serial') || line.includes('seri') || line.includes('mc_serial')) {
              headerRowIndex = i;
              
              // Detect delimiter based on occurrence count
              const semicolonCount = (line.match(/;/g) || []).length;
              const commaCount = (line.match(/,/g) || []).length;
              const tabCount = (line.match(/\t/g) || []).length;

              if (tabCount > semicolonCount && tabCount > commaCount) delimiter = '\t';
              else if (semicolonCount > commaCount) delimiter = ';';
              else delimiter = ',';
              
              break;
          }
      }

      if (headerRowIndex === -1) {
          setImportError('Dosyada "Seri No" (Serial) başlığı bulunamadı. Lütfen Canon raporunu değiştirmeden yükleyin.');
          return;
      }

      // 2. Map Headers
      const headers = lines[headerRowIndex].split(delimiter).map(h => h.trim().toLowerCase().replace(/^"|"$/g, '').replace(/^\ufeff/, ''));
      
      // Determine Indexes
      const serialIndex = headers.findIndex(h => h.includes('serial') || h.includes('seri'));
      const totalCounterIndex = headers.findIndex(h => h.includes('total') || h.includes('toplam') || h.includes('counter') || h.includes('sayaç') || h.includes('101:'));
      const ipIndex = headers.findIndex(h => h.includes('ip address') || h.includes('ip adresi') || h.includes('ipv4') || h.includes('address') || h.includes('adres'));

      if (serialIndex === -1 || totalCounterIndex === -1) {
          setImportError('Gerekli sütunlar bulunamadı. "Seri No" ve "Toplam Sayaç" sütunlarının olduğundan emin olun.');
          return;
      }

      // 3. Extract Data
      const results: any[] = [];
      let successCount = 0;

      for (let i = headerRowIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
          
          const serial = cols[serialIndex];
          const counterStr = cols[totalCounterIndex];
          const ipStr = ipIndex !== -1 ? cols[ipIndex] : null;

          if (serial && counterStr) {
              const cleanCounter = parseInt(counterStr.replace(/\D/g, ''));
              
              if (!isNaN(cleanCounter) && cleanCounter > 0) {
                  results.push({ 
                      serial, 
                      counter: cleanCounter,
                      ip: ipStr // Can be null
                  });
                  successCount++;
              }
          }
      }

      if (successCount === 0) {
          setImportError("Dosyada okunabilir veri bulunamadı.");
          return;
      }

      setParsedData(results);
      performMatching(results);
  };

  const normalizeSerial = (s: string) => {
      // Remove all non-alphanumeric chars and lowercase
      return s ? s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';
  };

  const performMatching = (data: any[]) => {
      const matched: any[] = [];
      const unmatched: any[] = [];

      data.forEach(item => {
          const itemSerialNorm = normalizeSerial(item.serial);
          
          // Match logic
          const printer = printers.find(p => normalizeSerial(p.serialNumber) === itemSerialNorm);
          
          if (printer) {
              // Check if IP update is needed
              const needsIpUpdate = item.ip && item.ip !== printer.ipAddress && item.ip.length > 6; // Basic length check for IP
              
              matched.push({
                  printer,
                  newCounter: item.counter,
                  diff: item.counter - printer.lastCounter,
                  newIp: item.ip,
                  needsIpUpdate
              });
          } else {
              unmatched.push(item);
          }
      });

      setMatchResults({ matched, unmatched });
      if (matched.length === 0 && unmatched.length > 0) {
          setImportError("Seri numaraları eşleşmedi. Sistemdeki seri numaralarını kontrol edin.");
      }
  };

  const confirmImport = async () => {
      if (matchResults.matched.length === 0) return;

      if (!confirm(`${matchResults.matched.length} adet cihazın sayacı güncellenecek. Onaylıyor musunuz?`)) return;

      setIsSaving(true);
      
      let processedCount = 0;
      let errorCount = 0;

      // Iterate sequentially to ensure DB stability
      for (const item of matchResults.matched) {
          try {
             // 1. Save Counter (Updates Printer LastCounter + Adds History Log)
             await saveCounterLog(item.printer, item.newCounter, 'Canon Import');
             
             // 2. Update IP Address if detected and changed
             if (item.needsIpUpdate) {
                const updatedPrinter = { 
                    ...item.printer, 
                    ipAddress: item.newIp,
                    lastCounter: item.newCounter // Ensure local object is updated for next operations
                };
                // We need to call StorageService.updatePrinter directly
                await StorageService.updatePrinter(updatedPrinter);
             }

             processedCount++;
          } catch (e) {
             console.error("Error saving for", item.printer.serialNumber, e);
             errorCount++;
          }
      }
      
      setIsSaving(false);
      alert(`İşlem Tamamlandı.\nBaşarılı: ${processedCount}\nHatalı: ${errorCount}`);
      
      // Cleanup
      setMatchResults({ matched: [], unmatched: [] });
      setParsedData([]);
      setActiveTab('LIST');
      fetchData(); // Refresh UI with new data
  };

  const resetImport = () => {
      setParsedData([]);
      setMatchResults({matched: [], unmatched: []});
      setImportError(null);
  };

  const filteredPrinters = printers.filter(p => 
      p.location.toLowerCase().includes(filterTerm.toLowerCase()) || 
      p.model.toLowerCase().includes(filterTerm.toLowerCase()) ||
      p.serialNumber.toLowerCase().includes(filterTerm.toLowerCase())
  );

  if (loading) return <LoadingScreen message="Sayaç verileri yükleniyor..." />;

  return (
    <div className="space-y-6 pb-20">
       <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-white flex items-center gap-2">
             <Calculator size={24} className="text-blue-500" />
             Sayaç (Endeks) Yönetimi v2
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Excel/CSV ile toplu sayaç ve IP güncelleme</p>
        </div>
        <button onClick={fetchData} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 transition-colors">
            <RefreshCw size={20} className="text-zinc-500"/>
        </button>
      </div>

      {/* TABS */}
      <div className="flex space-x-2 bg-white dark:bg-zinc-900 p-1 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 w-fit">
        <button 
          onClick={() => setActiveTab('LIST')}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'LIST' ? 'bg-zinc-900 dark:bg-zinc-700 text-white' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          Manuel Liste
        </button>
        <button 
          onClick={() => setActiveTab('IMPORT')}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'IMPORT' ? 'bg-blue-600 text-white' : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
        >
          <Upload size={16} /> Excel/CSV İçe Aktar (Canon)
        </button>
      </div>

      {/* --- LIST VIEW --- */}
      {activeTab === 'LIST' && (
        <div className="space-y-4">
           {/* Search */}
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                 type="text" 
                 placeholder="Cihaz ara (Model, Konum, Seri No)..." 
                 className="w-full pl-10 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                 value={filterTerm}
                 onChange={e => setFilterTerm(e.target.value)}
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrinters.map(printer => {
                 const currentInput = inputValues[printer.id] || '';
                 const diff = currentInput ? (parseInt(currentInput) - printer.lastCounter) : 0;
                 
                 return (
                    <div key={printer.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                           <div>
                              <h4 className="font-bold text-zinc-800 dark:text-white">{printer.model}</h4>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{printer.location}</p>
                           </div>
                           <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${printer.connectionType === 'Network' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                               {printer.connectionType === 'Network' ? 'Ağ' : 'USB'}
                           </div>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <p className="text-[10px] text-zinc-400 uppercase font-bold">Son Sayaç</p>
                                <p className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{printer.lastCounter}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-400 uppercase font-bold">Fark</p>
                                <p className={`font-mono font-bold ${diff > 0 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                    {diff > 0 ? `+${diff}` : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 items-center mt-auto">
                            <input 
                                type="number" 
                                className="flex-1 p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                placeholder="Yeni Sayaç"
                                value={currentInput}
                                onChange={(e) => handleInputChange(printer.id, e.target.value)}
                            />
                            <button 
                                onClick={() => handleSingleSave(printer)}
                                disabled={!currentInput}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={18} />
                            </button>
                        </div>
                    </div>
                 );
              })}
           </div>
        </div>
      )}

      {/* --- IMPORT VIEW --- */}
      {activeTab === 'IMPORT' && (
         <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             
             {/* Import Error Message */}
             {importError && (
                 <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-start gap-3">
                     <AlertTriangle className="shrink-0" />
                     <div>
                         <p className="font-bold">Hata Oluştu</p>
                         <p className="text-sm">{importError}</p>
                     </div>
                     <button onClick={() => setImportError(null)} className="ml-auto"><X size={18}/></button>
                 </div>
             )}

             {/* Upload Area */}
             {!isSaving ? (
                <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-8 text-center bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <input 
                    type="file" 
                    accept=".csv,.txt"
                    className="hidden" 
                    id="csv-upload"
                    onChange={handleFileUpload}
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-3">
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                            <FileSpreadsheet size={32} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-zinc-800 dark:text-white">Canon Raporunu Yükle</h3>
                            <p className="text-zinc-500 text-sm mt-1">Management Console'dan alınan CSV dosyasını seçin</p>
                        </div>
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20">Dosya Seç</span>
                    </label>
                </div>
             ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-8 rounded-2xl flex flex-col items-center justify-center gap-4">
                    <Loader2 size={40} className="text-blue-600 animate-spin" />
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300">Veriler İşleniyor</h3>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Sayaçlar ve IP adresleri güncelleniyor, lütfen bekleyin...</p>
                    </div>
                </div>
             )}

             {/* Results Preview */}
             {matchResults.matched.length > 0 && !isSaving && (
                 <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                     <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10">
                        <h3 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                            <CheckCircle2 size={20} />
                            {matchResults.matched.length} Cihaz Eşleşti
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={resetImport} className="text-sm text-zinc-500 hover:text-zinc-700 px-3 py-2">İptal</button>
                            <button 
                                onClick={confirmImport}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                            >
                                Verileri Kaydet <ArrowRight size={16}/>
                            </button>
                        </div>
                     </div>
                     <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 sticky top-0">
                                <tr>
                                    <th className="p-3">Seri No / Model</th>
                                    <th className="p-3">Eski Sayaç</th>
                                    <th className="p-3">Yeni Sayaç</th>
                                    <th className="p-3">Kullanım</th>
                                    <th className="p-3">IP Durumu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {matchResults.matched.map((item, i) => (
                                    <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <td className="p-3">
                                            <p className="font-bold text-zinc-800 dark:text-white">{item.printer.model}</p>
                                            <p className="text-xs text-zinc-500 font-mono">{item.printer.serialNumber}</p>
                                        </td>
                                        <td className="p-3 text-zinc-500">{item.printer.lastCounter}</td>
                                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{item.newCounter}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.diff >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                {item.diff > 0 ? '+' : ''}{item.diff}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {item.needsIpUpdate ? (
                                                <span className="flex items-center gap-1 text-xs text-blue-600 font-bold bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                                                    <Globe size={12}/> {item.newIp}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-zinc-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                 </div>
             )}

             {/* Unmatched Warning */}
             {matchResults.unmatched.length > 0 && !isSaving && (
                 <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-xl p-4">
                     <h4 className="font-bold text-orange-700 dark:text-orange-400 flex items-center gap-2 mb-2">
                        <AlertTriangle size={18} />
                        {matchResults.unmatched.length} Kayıt Eşleşmedi
                     </h4>
                     <p className="text-xs text-orange-600 dark:text-orange-300 mb-2">
                        Bu seri numaraları sistemde bulunamadı. Lütfen "Yazıcılar" menüsünden seri numaralarını kontrol edin.
                     </p>
                     <div className="flex flex-wrap gap-2">
                        {matchResults.unmatched.map((u, i) => (
                            <span key={i} className="bg-white dark:bg-zinc-800 border border-orange-200 dark:border-orange-900 text-zinc-500 text-xs px-2 py-1 rounded font-mono">
                                {u.serial}
                            </span>
                        ))}
                     </div>
                 </div>
             )}
         </div>
      )}
    </div>
  );
};