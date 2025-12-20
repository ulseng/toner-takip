import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Printer, CounterLog, User } from '../types';
import { Calculator, Upload, Save, AlertTriangle, FileSpreadsheet, CheckCircle2, Search, ArrowRight, ArrowUp, RefreshCw, X, Loader2, Globe, History, Calendar, TrendingUp, Droplet, PlusCircle, CalendarDays, Usb, Layers, MinusCircle } from 'lucide-react';
import { LoadingScreen } from './LoadingScreen';

interface CounterManagementProps {
  user: { name: string };
}

export const CounterManagement: React.FC<CounterManagementProps> = ({ user }) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [allLogs, setAllLogs] = useState<CounterLog[]>([]); // Store all logs
  const [loading, setLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'LIST' | 'IMPORT' | 'HISTORY_ENTRY'>('LIST');
  const [isSaving, setIsSaving] = useState(false);

  // History Modal State
  const [selectedHistoryPrinter, setSelectedHistoryPrinter] = useState<Printer | null>(null);

  // Input States for manual entry (Dictionary key: printerId_TYPE)
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  
  // Historical Entry States
  const [histPrinterId, setHistPrinterId] = useState('');
  const [histDate, setHistDate] = useState('');
  
  // Entry Modes: SIMPLE (Total only), STD (BW/Color), ADVANCED (Custom dynamic)
  const [histEntryMode, setHistEntryMode] = useState<'SIMPLE' | 'STD' | 'ADVANCED'>('SIMPLE');
  
  // Standard Inputs
  const [histValueTotal, setHistValueTotal] = useState('');
  const [histValueBW, setHistValueBW] = useState('');
  const [histValueColor, setHistValueColor] = useState('');

  // Advanced Inputs
  const [customCounterCount, setCustomCounterCount] = useState<number>(2);
  const [customCounters, setCustomCounters] = useState<{label: string, value: string}[]>([
      { label: 'A4 Siyah', value: '' },
      { label: 'A4 Renkli', value: '' }
  ]);

  // Import States
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [matchResults, setMatchResults] = useState<{matched: any[], unmatched: any[]}>({matched: [], unmatched: []});
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // --- HISTORY / BACK BUTTON HANDLER ---
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
        if (selectedHistoryPrinter) {
            setSelectedHistoryPrinter(null);
        }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedHistoryPrinter]);

  // Close modal on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedHistoryPrinter) {
          window.history.back();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedHistoryPrinter]);

  // Watch for Printer Selection changes to set default mode
  useEffect(() => {
      const printer = printers.find(p => p.id === histPrinterId);
      if (printer) {
          if (printer.isColor) setHistEntryMode('STD');
          else setHistEntryMode('SIMPLE');
      }
  }, [histPrinterId, printers]);

  // Watch for Custom Count changes
  useEffect(() => {
      setCustomCounters(prev => {
          const newArr = [...prev];
          if (customCounterCount > prev.length) {
              // Add rows
              for (let i = prev.length; i < customCounterCount; i++) {
                  newArr.push({ label: '', value: '' });
              }
          } else {
              // Remove rows
              return newArr.slice(0, customCounterCount);
          }
          return newArr;
      });
  }, [customCounterCount]);

  const fetchData = async () => {
    setLoading(true);
    const [p, l] = await Promise.all([
        StorageService.getPrinters(),
        StorageService.getCounterLogs()
    ]);
    setPrinters(p);
    setAllLogs(l);
    setLoading(false);
  };

  const openHistoryModal = (printer: Printer) => {
      window.history.pushState({ modal: 'counterHistory' }, '');
      setSelectedHistoryPrinter(printer);
  };

  const closeModalViaBack = () => {
      window.history.back();
  };

  // --- MANUAL ENTRY LOGIC ---
  const handleInputChange = (key: string, value: string) => {
    setInputValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSingleSave = async (printer: Printer) => {
    let newValTotal = 0;
    let newValBW = 0;
    let newValColor = 0;

    if (printer.isColor) {
        const bwStr = inputValues[`${printer.id}_BW`];
        const colorStr = inputValues[`${printer.id}_COLOR`];
        
        if (!bwStr && !colorStr) return;

        newValBW = parseInt(bwStr || '0');
        newValColor = parseInt(colorStr || '0');
        newValTotal = newValBW + newValColor; 
    } else {
        const valStr = inputValues[`${printer.id}_TOTAL`];
        if (!valStr) return;
        newValTotal = parseInt(valStr);
    }
    
    if (isNaN(newValTotal)) {
        alert('Lütfen geçerli bir sayı giriniz.');
        return;
    }
    
    if (newValTotal < printer.lastCounter) {
        if (!confirm(`UYARI: Girdiğiniz toplam sayaç (${newValTotal}), eski sayaçtan (${printer.lastCounter}) daha düşük. Cihaz sıfırlanmış olabilir mi? Yine de kaydetmek istiyor musunuz?`)) {
            return;
        }
    }

    try {
        await saveCounterLog({
            printer, 
            currentCounter: newValTotal, 
            method: 'Manuel Giriş', 
            updateMaster: true, 
            bw: printer.isColor ? newValBW : undefined, 
            color: printer.isColor ? newValColor : undefined
        });
        alert('Sayaç başarıyla güncellendi.');
        
        setInputValues(prev => {
            const copy = {...prev};
            delete copy[`${printer.id}_TOTAL`];
            delete copy[`${printer.id}_BW`];
            delete copy[`${printer.id}_COLOR`];
            return copy;
        });
        fetchData();
    } catch (error) {
        console.error(error);
        alert('Kayıt sırasında bir hata oluştu.');
    }
  };

  // --- HISTORICAL ENTRY LOGIC (UPDATED FOR ADVANCED MODE) ---
  const handleHistoricalSave = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const printer = printers.find(p => p.id === histPrinterId);
      if (!printer) return;

      let totalVal = 0;
      let bwVal: number | undefined = undefined;
      let colorVal: number | undefined = undefined;
      let finalCustomCounters: { label: string; value: number }[] | undefined = undefined;

      if (histEntryMode === 'ADVANCED') {
          // Validate custom counters
          const validCounters = customCounters.filter(c => c.label.trim() !== '' && c.value !== '');
          if (validCounters.length === 0) {
              alert("Lütfen en az bir sayaç tanımı ve değeri giriniz.");
              return;
          }
          
          finalCustomCounters = validCounters.map(c => ({
              label: c.label,
              value: parseInt(c.value)
          }));

          // Calculate Total from custom fields
          totalVal = finalCustomCounters.reduce((acc, curr) => acc + curr.value, 0);

      } else if (histEntryMode === 'STD') {
          if (!histValueBW || !histValueColor || !histDate) {
              alert("Lütfen Siyah ve Renkli sayaçları doldurun.");
              return;
          }
          bwVal = parseInt(histValueBW);
          colorVal = parseInt(histValueColor);
          totalVal = bwVal + colorVal;
      } else {
          // SIMPLE
          if (!histValueTotal || !histDate) {
              alert("Lütfen sayaç değerini doldurun.");
              return;
          }
          totalVal = parseInt(histValueTotal);
      }

      const logDate = new Date(histDate);

      // Simple previous Log finding to calculate usage (Approximation)
      const logsForPrinter = allLogs
          .filter(l => l.printerId === printer.id && new Date(l.date) < logDate)
          .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const prevCounter = logsForPrinter.length > 0 ? logsForPrinter[0].currentCounter : 0;
      const usage = totalVal - prevCounter;

      try {
          // Log object
          const log: CounterLog = {
            id: '',
            printerId: printer.id,
            // CAPTURE HISTORICAL LOCATION SNAPSHOT
            printerName: `${printer.brand} ${printer.model} (${printer.location})`,
            serialNumber: printer.serialNumber,
            date: logDate.toISOString(),
            previousCounter: prevCounter,
            currentCounter: totalVal,
            usage: usage > 0 ? usage : 0,
            recordedBy: `${user.name} (Geçmiş Veri)`,
            currentBW: bwVal,
            currentColor: colorVal,
            customCounters: finalCustomCounters, // Save array
            // Usage calculation for standard fields
            usageBW: (bwVal !== undefined && logsForPrinter[0]?.currentBW) ? Math.max(0, bwVal - logsForPrinter[0].currentBW) : undefined,
            usageColor: (colorVal !== undefined && logsForPrinter[0]?.currentColor) ? Math.max(0, colorVal - logsForPrinter[0].currentColor) : undefined
          };

          await StorageService.addCounterLog(log, false);
          
          alert("Geçmiş veri başarıyla eklendi.");
          // Reset fields
          setHistValueTotal('');
          setHistValueBW('');
          setHistValueColor('');
          setCustomCounters([{ label: '', value: '' }, { label: '', value: '' }]);
          setCustomCounterCount(2);
          fetchData(); 
      } catch (error) {
          console.error(error);
          alert("Hata oluştu: " + error);
      }
  };

  interface SaveLogParams {
      printer: Printer;
      currentCounter: number;
      method: string;
      updateMaster: boolean;
      bw?: number;
      color?: number;
      customCounters?: { label: string; value: number }[];
  }

  const saveCounterLog = async ({ printer, currentCounter, method, updateMaster, bw, color, customCounters }: SaveLogParams) => {
     const usage = currentCounter - printer.lastCounter;
     
     let usageBW = undefined;
     let usageColor = undefined;

     if (bw !== undefined && printer.lastCounterBW !== undefined) {
         usageBW = Math.max(0, bw - printer.lastCounterBW);
     }
     if (color !== undefined && printer.lastCounterColor !== undefined) {
         usageColor = Math.max(0, color - printer.lastCounterColor);
     }

     const log: CounterLog = {
         id: '',
         printerId: printer.id,
         // CAPTURE HISTORICAL LOCATION SNAPSHOT
         printerName: `${printer.brand} ${printer.model} (${printer.location})`,
         serialNumber: printer.serialNumber,
         date: new Date().toISOString(),
         previousCounter: printer.lastCounter,
         currentCounter: currentCounter,
         usage: usage > 0 ? usage : 0, 
         recordedBy: `${user.name} (${method})`,
         currentBW: bw,
         currentColor: color,
         usageBW,
         usageColor,
         customCounters
     };

     await StorageService.addCounterLog(log, updateMaster);
  };

  const handleCustomCounterChange = (index: number, field: 'label' | 'value', val: string) => {
      setCustomCounters(prev => {
          const newArr = [...prev];
          newArr[index] = { ...newArr[index], [field]: val };
          return newArr;
      });
  };

  // ... (Import Logic remains the same) ...
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
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const parseCSV = (text: string) => {
      const lines = text.split(/\r\n|\n|\r/);
      if (lines.length < 2) { setImportError("Dosya içeriği çok kısa."); return; }

      let headerRowIndex = -1;
      let delimiter = ',';

      for (let i = 0; i < Math.min(lines.length, 25); i++) {
          const line = lines[i].toLowerCase();
          if (line.includes('serial') || line.includes('seri') || line.includes('mc_serial')) {
              headerRowIndex = i;
              const semicolonCount = (line.match(/;/g) || []).length;
              const commaCount = (line.match(/,/g) || []).length;
              const tabCount = (line.match(/\t/g) || []).length;
              if (tabCount > semicolonCount && tabCount > commaCount) delimiter = '\t';
              else if (semicolonCount > commaCount) delimiter = ';';
              else delimiter = ',';
              break;
          }
      }

      if (headerRowIndex === -1) { setImportError('Seri No başlığı bulunamadı.'); return; }

      const headers = lines[headerRowIndex].split(delimiter).map(h => h.trim().toLowerCase().replace(/^"|"$/g, '').replace(/^\ufeff/, ''));
      const serialIndex = headers.findIndex(h => h.includes('serial') || h.includes('seri'));
      const totalCounterIndex = headers.findIndex(h => h.includes('total') || h.includes('toplam') || h.includes('counter') || h.includes('sayaç') || h.includes('101:'));
      const ipIndex = headers.findIndex(h => h.includes('ip address') || h.includes('ip adresi') || h.includes('ipv4') || h.includes('address') || h.includes('adres'));

      if (serialIndex === -1 || totalCounterIndex === -1) { setImportError('Gerekli sütunlar eksik.'); return; }

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
                  results.push({ serial, counter: cleanCounter, ip: ipStr });
                  successCount++;
              }
          }
      }

      if (successCount === 0) { setImportError("Veri bulunamadı."); return; }
      setParsedData(results);
      performMatching(results);
  };

  const normalizeSerial = (s: string) => s ? s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';

  const performMatching = (data: any[]) => {
      const matched: any[] = [];
      const unmatched: any[] = [];

      data.forEach(item => {
          const itemSerialNorm = normalizeSerial(item.serial);
          const printer = printers.find(p => normalizeSerial(p.serialNumber) === itemSerialNorm);
          
          if (printer) {
              const needsIpUpdate = item.ip && item.ip !== printer.ipAddress && item.ip.length > 6;
              matched.push({ printer, newCounter: item.counter, diff: item.counter - printer.lastCounter, newIp: item.ip, needsIpUpdate });
          } else {
              unmatched.push(item);
          }
      });
      setMatchResults({ matched, unmatched });
  };

  const confirmImport = async () => {
      if (matchResults.matched.length === 0) return;
      if (!confirm(`${matchResults.matched.length} adet cihazın sayacı güncellenecek.`)) return;
      setIsSaving(true);
      
      let processedCount = 0;
      for (const item of matchResults.matched) {
          try {
             await saveCounterLog({ printer: item.printer, currentCounter: item.newCounter, method: 'Canon Import', updateMaster: true });
             if (item.needsIpUpdate) {
                const updatedPrinter = { ...item.printer, ipAddress: item.newIp, lastCounter: item.newCounter };
                await StorageService.updatePrinter(updatedPrinter);
             }
             processedCount++;
          } catch (e) { console.error(e); }
      }
      
      setIsSaving(false);
      alert(`İşlem Tamamlandı. Başarılı: ${processedCount}`);
      setMatchResults({ matched: [], unmatched: [] });
      setParsedData([]);
      setActiveTab('LIST');
      fetchData(); 
  };

  const resetImport = () => { setParsedData([]); setMatchResults({matched: [], unmatched: []}); setImportError(null); };

  // UPDATED FILTER LOGIC FOR TURKISH CHARACTERS
  const filteredPrinters = printers.filter(p => {
      const searchLower = filterTerm.toLocaleLowerCase('tr-TR');
      return (
        p.location.toLocaleLowerCase('tr-TR').includes(searchLower) || 
        p.model.toLocaleLowerCase('tr-TR').includes(searchLower) ||
        p.serialNumber.toLocaleLowerCase('tr-TR').includes(searchLower)
      );
  });

  if (loading) return <LoadingScreen message="Sayaç verileri yükleniyor..." />;

  return (
    <div className="space-y-6 pb-20">
       <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-white flex items-center gap-2">
             <Calculator size={24} className="text-blue-500" />
             Sayaç (Endeks) Yönetimi
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Excel/CSV ile toplu sayaç ve IP güncelleme</p>
        </div>
        <button onClick={fetchData} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 transition-colors">
            <RefreshCw size={20} className="text-zinc-500"/>
        </button>
      </div>

      {/* TABS */}
      <div className="flex space-x-2 bg-white dark:bg-zinc-900 p-1 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 w-fit overflow-x-auto">
        <button 
          onClick={() => setActiveTab('LIST')}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'LIST' ? 'bg-zinc-900 dark:bg-zinc-700 text-white' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          Güncel Giriş
        </button>
        <button 
          onClick={() => setActiveTab('IMPORT')}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'IMPORT' ? 'bg-blue-600 text-white' : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
        >
          <Upload size={16} /> Excel/CSV
        </button>
        <button 
          onClick={() => setActiveTab('HISTORY_ENTRY')}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'HISTORY_ENTRY' ? 'bg-orange-600 text-white' : 'text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
        >
          <CalendarDays size={16} /> Geçmiş Veri Ekle
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
                 // For Color printers, check logic slightly differently
                 let currentInputTotal = '';
                 let inputValid = false;

                 if (printer.isColor) {
                     const bw = inputValues[`${printer.id}_BW`] || '';
                     const col = inputValues[`${printer.id}_COLOR`] || '';
                     inputValid = (bw !== '' || col !== ''); // At least one entry
                     currentInputTotal = (parseInt(bw || '0') + parseInt(col || '0')).toString();
                 } else {
                     currentInputTotal = inputValues[`${printer.id}_TOTAL`] || '';
                     inputValid = currentInputTotal !== '';
                 }

                 const diff = currentInputTotal ? (parseInt(currentInputTotal) - printer.lastCounter) : 0;
                 
                 return (
                    <div key={printer.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                           <div>
                              <h4 className="font-bold text-zinc-800 dark:text-white">{printer.model}</h4>
                              <div className="flex flex-col gap-1">
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{printer.location}</p>
                                  
                                  {/* Connection Type Indicator */}
                                  <div className="flex items-center gap-1">
                                      {printer.connectionType === 'Network' ? (
                                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono flex items-center gap-1 w-fit">
                                              <Globe size={10} /> {printer.ipAddress}
                                          </span>
                                      ) : (
                                          <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-mono flex items-center gap-1 w-fit">
                                              <Usb size={10} /> USB
                                          </span>
                                      )}
                                  </div>
                              </div>
                           </div>
                           <button 
                              onClick={() => openHistoryModal(printer)}
                              className="text-zinc-400 hover:text-blue-500 p-1"
                              title="Geçmişi Gör"
                           >
                               <History size={20} />
                           </button>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <p className="text-[10px] text-zinc-400 uppercase font-bold">Son Sayaç</p>
                                <p className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{printer.lastCounter}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-400 uppercase font-bold">Anlık Fark</p>
                                <p className={`font-mono font-bold ${diff > 0 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                    {diff > 0 ? `+${diff}` : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 items-end mt-auto">
                            {printer.isColor ? (
                                <div className="flex gap-2 flex-1">
                                    <div className="flex-1">
                                        <label className="text-[9px] text-zinc-400 font-bold uppercase ml-1">Siyah (SB)</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                            placeholder={printer.lastCounterBW ? String(printer.lastCounterBW) : "0"}
                                            value={inputValues[`${printer.id}_BW`] || ''}
                                            onChange={(e) => handleInputChange(`${printer.id}_BW`, e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[9px] text-purple-400 font-bold uppercase ml-1">Renkli (RL)</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                                            placeholder={printer.lastCounterColor ? String(printer.lastCounterColor) : "0"}
                                            value={inputValues[`${printer.id}_COLOR`] || ''}
                                            onChange={(e) => handleInputChange(`${printer.id}_COLOR`, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <input 
                                    type="number" 
                                    className="flex-1 p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    placeholder="Yeni Sayaç"
                                    value={inputValues[`${printer.id}_TOTAL`] || ''}
                                    onChange={(e) => handleInputChange(`${printer.id}_TOTAL`, e.target.value)}
                                />
                            )}
                            
                            <button 
                                onClick={() => handleSingleSave(printer)}
                                disabled={!inputValid}
                                className="p-2 h-[38px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

      {/* --- HISTORICAL ENTRY VIEW (UPDATED) --- */}
      {activeTab === 'HISTORY_ENTRY' && (
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-xl font-bold text-zinc-800 dark:text-white flex items-center gap-2 mb-2">
                 <History size={24} className="text-orange-500"/> Geçmiş Sayaç Girişi
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                 Buradan geçmiş aylara ait sayaç verilerini girebilirsiniz. Bu işlem cihazın şu anki güncel sayacını değiştirmez.
              </p>

              <form onSubmit={handleHistoricalSave} className="space-y-6">
                  <div>
                      <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Cihaz Seçin</label>
                      <select 
                        required
                        className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                        value={histPrinterId}
                        onChange={e => {
                            setHistPrinterId(e.target.value);
                            setHistValueTotal('');
                            setHistValueBW('');
                            setHistValueColor('');
                        }}
                      >
                          <option value="">-- Cihaz Seçiniz --</option>
                          {printers.map(p => (
                              <option key={p.id} value={p.id}>
                                  {p.brand} {p.model} - {p.location} ({p.serialNumber})
                              </option>
                          ))}
                      </select>
                  </div>

                  <div>
                      <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Tarih</label>
                      <input 
                        required
                        type="date"
                        className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                        value={histDate}
                        onChange={e => setHistDate(e.target.value)}
                        onClick={(e) => e.currentTarget.showPicker()}
                      />
                  </div>

                  {/* Mode Selector */}
                  <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <p className="text-xs font-bold text-zinc-500 mb-2 uppercase">Giriş Tipi</p>
                      <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setHistEntryMode('SIMPLE')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${histEntryMode === 'SIMPLE' ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                          >
                              Basit (Toplam)
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistEntryMode('STD')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${histEntryMode === 'STD' ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                          >
                              Standart (SB/RL)
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistEntryMode('ADVANCED')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${histEntryMode === 'ADVANCED' ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
                          >
                              <Layers size={14} /> Gelişmiş (Çoklu)
                          </button>
                      </div>
                  </div>

                  {/* Dynamic Inputs based on Mode */}
                  {histEntryMode === 'SIMPLE' && (
                      <div>
                          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Toplam Sayaç</label>
                          <input 
                            required
                            type="number"
                            placeholder="Örn: 10500"
                            className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                            value={histValueTotal}
                            onChange={e => setHistValueTotal(e.target.value)}
                          />
                      </div>
                  )}

                  {histEntryMode === 'STD' && (
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Siyah (SB)</label>
                              <input 
                                required
                                type="number"
                                className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                                value={histValueBW}
                                onChange={e => setHistValueBW(e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-purple-700 dark:text-purple-400 mb-1">Renkli (RL)</label>
                              <input 
                                required
                                type="number"
                                className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                                value={histValueColor}
                                onChange={e => setHistValueColor(e.target.value)}
                              />
                          </div>
                      </div>
                  )}

                  {histEntryMode === 'ADVANCED' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                          <div className="flex items-center gap-4">
                              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">Kaç farklı sayaç var?</label>
                              <div className="flex items-center gap-2">
                                  <button type="button" onClick={() => setCustomCounterCount(Math.max(1, customCounterCount - 1))} className="p-2 bg-zinc-100 dark:bg-zinc-700 rounded hover:bg-zinc-200"><MinusCircle size={16}/></button>
                                  <span className="font-bold w-8 text-center">{customCounterCount}</span>
                                  <button type="button" onClick={() => setCustomCounterCount(customCounterCount + 1)} className="p-2 bg-zinc-100 dark:bg-zinc-700 rounded hover:bg-zinc-200"><PlusCircle size={16}/></button>
                              </div>
                          </div>

                          <div className="space-y-2">
                              {customCounters.map((c, i) => (
                                  <div key={i} className="flex gap-2">
                                      <input 
                                        type="text"
                                        placeholder={`Sayaç Adı (Örn: A${3 + (i%2)} ${i%2===0?'SB':'RL'})`}
                                        className="flex-1 p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                                        value={c.label}
                                        onChange={(e) => handleCustomCounterChange(i, 'label', e.target.value)}
                                      />
                                      <input 
                                        type="number"
                                        placeholder="Değer"
                                        className="w-32 p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-sm"
                                        value={c.value}
                                        onChange={(e) => handleCustomCounterChange(i, 'value', e.target.value)}
                                      />
                                  </div>
                              ))}
                          </div>
                          
                          <div className="text-right text-xs text-zinc-500">
                              Toplam otomatik hesaplanacaktır: <span className="font-bold text-zinc-800 dark:text-white">{customCounters.reduce((acc, curr) => acc + (parseInt(curr.value) || 0), 0)}</span>
                          </div>
                      </div>
                  )}

                  <button 
                    type="submit" 
                    className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20 mt-4 flex items-center justify-center gap-2"
                  >
                     <Save size={20}/> Geçmiş Veriyi Kaydet
                  </button>
              </form>
          </div>
      )}

      {/* ... (Import View remains same) ... */}
      {/* ... (List View remains same) ... */}
      
      {/* --- HISTORY MODAL --- */}
      {selectedHistoryPrinter && (
        <div className="fixed inset-0 z-50 flex justify-end">
             {/* Backdrop */}
             <div 
               className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
               onClick={closeModalViaBack}
             ></div>

             {/* Slide-over Panel */}
             <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-300 flex flex-col">
                 
                 {/* Header */}
                 <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-between items-start">
                     <div>
                        <h3 className="text-2xl font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                           {selectedHistoryPrinter.model}
                        </h3>
                        <div className="flex flex-col mt-1">
                            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{selectedHistoryPrinter.location}</span>
                            <span className="text-xs text-zinc-400 font-mono">{selectedHistoryPrinter.serialNumber}</span>
                        </div>
                     </div>
                     <button 
                       onClick={closeModalViaBack}
                       className="p-2 bg-white dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                     >
                        <X size={20} className="text-zinc-500"/>
                     </button>
                 </div>

                 {/* Scrollable Content */}
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-black/50 custom-scrollbar">
                    
                    {/* Summary Card */}
                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-bold">Güncel Sayaç</p>
                            <p className="text-2xl font-bold text-zinc-800 dark:text-white">{selectedHistoryPrinter.lastCounter.toLocaleString()}</p>
                            {selectedHistoryPrinter.isColor && (
                                <div className="flex gap-3 mt-1 text-xs">
                                    <span className="text-zinc-500">SB: <b>{selectedHistoryPrinter.lastCounterBW?.toLocaleString()}</b></span>
                                    <span className="text-purple-500">RL: <b>{selectedHistoryPrinter.lastCounterColor?.toLocaleString()}</b></span>
                                </div>
                            )}
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                             <Calculator size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>

                    <h4 className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mt-2">
                        <History size={16} /> Sayaç Geçmişi
                    </h4>

                    {(() => {
                        const logs = allLogs.filter(l => l.printerId === selectedHistoryPrinter.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        
                        if (logs.length === 0) {
                            return (
                                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                                    <Droplet size={40} className="text-zinc-300 dark:text-zinc-600 mb-2"/>
                                    <p className="text-zinc-500 font-medium">Sayaç kaydı bulunamadı.</p>
                                    <p className="text-xs text-zinc-400 mt-1 max-w-[200px]">Mürekkepli yazıcı veya henüz sayaç girişi yapılmamış cihaz.</p>
                                </div>
                            );
                        }

                        return (
                            <div className="space-y-3 relative">
                                {/* Timeline Line */}
                                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-zinc-200 dark:bg-zinc-800 z-0"></div>

                                {logs.map((log) => (
                                    <div key={log.id} className="relative z-10 pl-10">
                                        {/* Timeline Dot */}
                                        <div className="absolute left-[11px] top-4 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900"></div>

                                        <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-zinc-400" />
                                                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                                                        {new Date(log.date).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-zinc-400">
                                                    {new Date(log.date).toLocaleDateString('tr-TR')}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg">
                                                <div>
                                                    <p className="text-[10px] text-zinc-400 uppercase">Okunan Değer</p>
                                                    <p className="font-mono font-bold text-zinc-800 dark:text-white">{log.currentCounter.toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-zinc-400 uppercase">Aylık Fark</p>
                                                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                        <TrendingUp size={12}/> {log.usage > 0 ? `+${log.usage.toLocaleString()}` : log.usage}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Detail Counters for this Log (Standard) */}
                                            {(!log.customCounters && (log.currentBW !== undefined || log.currentColor !== undefined)) && (
                                                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                                                    <div className="bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded">
                                                        <span className="text-zinc-500 block">Siyah</span>
                                                        <span className="font-mono font-bold">{log.currentBW?.toLocaleString() || '-'}</span>
                                                        {log.usageBW !== undefined && <span className="text-emerald-500 ml-1">(+{log.usageBW})</span>}
                                                    </div>
                                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-1.5 rounded">
                                                        <span className="text-purple-500 block">Renkli</span>
                                                        <span className="font-mono font-bold text-purple-700 dark:text-purple-300">{log.currentColor?.toLocaleString() || '-'}</span>
                                                        {log.usageColor !== undefined && <span className="text-emerald-500 ml-1">(+{log.usageColor})</span>}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Advanced Custom Counters Display */}
                                            {log.customCounters && log.customCounters.length > 0 && (
                                                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                                                    {log.customCounters.map((c, i) => (
                                                        <div key={i} className="bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded border border-zinc-200 dark:border-zinc-800">
                                                            <span className="text-zinc-500 block truncate" title={c.label}>{c.label}</span>
                                                            <span className="font-mono font-bold">{c.value.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-2 text-[10px] text-zinc-400 flex justify-between">
                                                <span>Yöntem: {log.recordedBy}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                 </div>
             </div>
        </div>
      )}

    </div>
  );
};