import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Printer, CounterLog, User } from '../types';
import { Calculator, Upload, Save, AlertTriangle, FileSpreadsheet, CheckCircle2, Search, ArrowRight, ArrowUp, RefreshCw, X, Loader2, Globe, History, Calendar, TrendingUp, Droplet, PlusCircle, CalendarDays, Usb, Layers, MinusCircle, Scan, Cpu, Zap } from 'lucide-react';
import { LoadingScreen } from './LoadingScreen';

interface CounterManagementProps {
  user: { name: string };
}

export const CounterManagement: React.FC<CounterManagementProps> = ({ user }) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [allLogs, setAllLogs] = useState<CounterLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'LIST' | 'IMPORT' | 'HISTORY_ENTRY' | 'SCAN'>('LIST');
  const [isSaving, setIsSaving] = useState(false);

  // History Modal State
  const [selectedHistoryPrinter, setSelectedHistoryPrinter] = useState<Printer | null>(null);

  // Input States for manual entry
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  
  // Historical Entry States
  const [histPrinterId, setHistPrinterId] = useState('');
  const [histDate, setHistDate] = useState('');
  const [histEntryMode, setHistEntryMode] = useState<'SIMPLE' | 'STD' | 'ADVANCED'>('SIMPLE');
  const [histValueTotal, setHistValueTotal] = useState('');
  const [histValueBW, setHistValueBW] = useState('');
  const [histValueColor, setHistValueColor] = useState('');

  // Scanning States
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<Record<string, { status: 'waiting' | 'loading' | 'done' | 'error', value?: number }>>({});

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

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
        if (selectedHistoryPrinter) {
            setSelectedHistoryPrinter(null);
        }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedHistoryPrinter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedHistoryPrinter) {
          window.history.back();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedHistoryPrinter]);

  useEffect(() => {
      const printer = printers.find(p => p.id === histPrinterId);
      if (printer) {
          if (printer.isColor) setHistEntryMode('STD');
          else setHistEntryMode('SIMPLE');
      }
  }, [histPrinterId, printers]);

  useEffect(() => {
      setCustomCounters(prev => {
          const newArr = [...prev];
          if (customCounterCount > prev.length) {
              for (let i = prev.length; i < customCounterCount; i++) {
                  newArr.push({ label: '', value: '' });
              }
          } else {
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
    
    if (isNaN(newValTotal)) return;
    
    if (newValTotal < printer.lastCounter) {
        if (!confirm(`UYARI: Girdiğiniz sayaç (${newValTotal}), eskiden (${printer.lastCounter}) düşük.`)) return;
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
        setInputValues(prev => {
            const copy = {...prev};
            delete copy[`${printer.id}_TOTAL`];
            delete copy[`${printer.id}_BW`];
            delete copy[`${printer.id}_COLOR`];
            return copy;
        });
        fetchData();
    } catch (error) {
        alert('Hata oluştu.');
    }
  };

  const handleAutoScan = async () => {
      const networkPrinters = printers.filter(p => p.connectionType === 'Network' && p.ipAddress);
      if (networkPrinters.length === 0) {
          alert("Ağ üzerinde (Network) tanımlı yazıcı bulunamadı.");
          return;
      }

      setIsScanning(true);
      const initialStatus: Record<string, any> = {};
      networkPrinters.forEach(p => initialStatus[p.id] = { status: 'waiting' });
      setScanResults(initialStatus);

      for (const p of networkPrinters) {
          setScanResults(prev => ({ ...prev, [p.id]: { status: 'loading' } }));
          try {
              const data = await StorageService.fetchPrinterCounterSimulated(p);
              await saveCounterLog({
                  printer: p,
                  currentCounter: data.total,
                  method: 'Otomatik Tarama (Ağ)',
                  updateMaster: true,
                  bw: data.bw,
                  color: data.color
              });
              setScanResults(prev => ({ ...prev, [p.id]: { status: 'done', value: data.total } }));
          } catch (error) {
              setScanResults(prev => ({ ...prev, [p.id]: { status: 'error' } }));
          }
      }
      setIsScanning(false);
      fetchData();
  };

  const handleHistoricalSave = async (e: React.FormEvent) => {
      e.preventDefault();
      const printer = printers.find(p => p.id === histPrinterId);
      if (!printer) return;

      let totalVal = 0;
      let bwVal: number | undefined = undefined;
      let colorVal: number | undefined = undefined;
      let finalCustomCounters: { label: string; value: number }[] | undefined = undefined;

      if (histEntryMode === 'ADVANCED') {
          const validCounters = customCounters.filter(c => c.label.trim() !== '' && c.value !== '');
          finalCustomCounters = validCounters.map(c => ({ label: c.label, value: parseInt(c.value) }));
          totalVal = finalCustomCounters.reduce((acc, curr) => acc + curr.value, 0);
      } else if (histEntryMode === 'STD') {
          bwVal = parseInt(histValueBW);
          colorVal = parseInt(histValueColor);
          totalVal = bwVal + colorVal;
      } else {
          totalVal = parseInt(histValueTotal);
      }

      const logDate = new Date(histDate);
      const logsForPrinter = allLogs.filter(l => l.printerId === printer.id && new Date(l.date) < logDate).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const prevCounter = logsForPrinter.length > 0 ? logsForPrinter[0].currentCounter : 0;
      const usage = totalVal - prevCounter;

      try {
          const log: CounterLog = {
            id: '',
            printerId: printer.id,
            printerName: `${printer.brand} ${printer.model} (${printer.location})`,
            serialNumber: printer.serialNumber,
            date: logDate.toISOString(),
            previousCounter: prevCounter,
            currentCounter: totalVal,
            usage: usage > 0 ? usage : 0,
            recordedBy: `${user.name} (Geçmiş Veri)`,
            currentBW: bwVal,
            currentColor: colorVal,
            customCounters: finalCustomCounters,
            usageBW: (bwVal !== undefined && logsForPrinter[0]?.currentBW) ? Math.max(0, bwVal - logsForPrinter[0].currentBW) : undefined,
            usageColor: (colorVal !== undefined && logsForPrinter[0]?.currentColor) ? Math.max(0, colorVal - logsForPrinter[0].currentColor) : undefined
          };
          await StorageService.addCounterLog(log, false);
          alert("Kaydedildi.");
          setActiveTab('LIST');
          fetchData(); 
      } catch (error) { alert("Hata"); }
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
     let usageBW = (bw !== undefined && printer.lastCounterBW !== undefined) ? Math.max(0, bw - printer.lastCounterBW) : undefined;
     let usageColor = (color !== undefined && printer.lastCounterColor !== undefined) ? Math.max(0, color - printer.lastCounterColor) : undefined;

     const log: CounterLog = {
         id: '',
         printerId: printer.id,
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

  const filteredPrinters = printers.filter(p => {
      const searchLower = filterTerm.toLocaleLowerCase('tr-TR');
      return (p.location.toLocaleLowerCase('tr-TR').includes(searchLower) || p.model.toLocaleLowerCase('tr-TR').includes(searchLower) || p.serialNumber.toLocaleLowerCase('tr-TR').includes(searchLower));
  });

  if (loading) return <LoadingScreen message="Sayaç verileri yükleniyor..." />;

  return (
    <div className="space-y-6 pb-20">
       <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-white flex items-center gap-2">
             <Calculator size={24} className="text-blue-500" /> Sayaç Yönetimi
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Otomatik ve manuel endeks takibi</p>
        </div>
        <button onClick={fetchData} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 transition-colors">
            <RefreshCw size={20} className="text-zinc-500"/>
        </button>
      </div>

      <div className="flex space-x-2 bg-white dark:bg-zinc-900 p-1 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 w-fit overflow-x-auto">
        <button 
          onClick={() => setActiveTab('LIST')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'LIST' ? 'bg-zinc-900 dark:bg-zinc-700 text-white' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          Güncel Giriş
        </button>
        <button 
          onClick={() => setActiveTab('SCAN')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'SCAN' ? 'bg-emerald-600 text-white' : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
        >
          <Scan size={16} /> Otomatik Tarama
        </button>
        <button 
          onClick={() => setActiveTab('IMPORT')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'IMPORT' ? 'bg-blue-600 text-white' : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
        >
          <Upload size={16} /> Excel/CSV
        </button>
        <button 
          onClick={() => setActiveTab('HISTORY_ENTRY')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'HISTORY_ENTRY' ? 'bg-orange-600 text-white' : 'text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
        >
          <CalendarDays size={16} /> Geçmiş Veri
        </button>
      </div>

      {activeTab === 'LIST' && (
        <div className="space-y-4">
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
                 let currentInputTotal = '';
                 let inputValid = false;
                 if (printer.isColor) {
                     const bw = inputValues[`${printer.id}_BW`] || '';
                     const col = inputValues[`${printer.id}_COLOR`] || '';
                     inputValid = (bw !== '' || col !== '');
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
                                  <div className="flex items-center gap-1">
                                      {printer.connectionType === 'Network' ? (
                                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono flex items-center gap-1 w-fit"><Globe size={10} /> {printer.ipAddress}</span>
                                      ) : (
                                          <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-mono flex items-center gap-1 w-fit"><Usb size={10} /> USB</span>
                                      )}
                                  </div>
                              </div>
                           </div>
                           <button onClick={() => openHistoryModal(printer)} className="text-zinc-400 hover:text-blue-500 p-1"><History size={20} /></button>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg grid grid-cols-2 gap-2 text-sm">
                            <div><p className="text-[10px] text-zinc-400 uppercase font-bold">Son Sayaç</p><p className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{printer.lastCounter}</p></div>
                            <div><p className="text-[10px] text-zinc-400 uppercase font-bold">Fark</p><p className={`font-mono font-bold ${diff > 0 ? 'text-emerald-500' : 'text-zinc-400'}`}>{diff > 0 ? `+${diff}` : '-'}</p></div>
                        </div>
                        <div className="flex gap-2 items-end mt-auto">
                            {printer.isColor ? (
                                <div className="flex gap-2 flex-1">
                                    <div className="flex-1"><label className="text-[9px] text-zinc-400 font-bold uppercase ml-1">Siyah</label><input type="number" className="w-full p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" value={inputValues[`${printer.id}_BW`] || ''} onChange={(e) => handleInputChange(`${printer.id}_BW`, e.target.value)}/></div>
                                    <div className="flex-1"><label className="text-[9px] text-purple-400 font-bold uppercase ml-1">Renkli</label><input type="number" className="w-full p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm" value={inputValues[`${printer.id}_COLOR`] || ''} onChange={(e) => handleInputChange(`${printer.id}_COLOR`, e.target.value)}/></div>
                                </div>
                            ) : (
                                <input type="number" className="flex-1 p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" placeholder="Yeni Sayaç" value={inputValues[`${printer.id}_TOTAL`] || ''} onChange={(e) => handleInputChange(`${printer.id}_TOTAL`, e.target.value)}/>
                            )}
                            <button onClick={() => handleSingleSave(printer)} disabled={!inputValid} className="p-2 h-[38px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"><Save size={18} /></button>
                        </div>
                    </div>
                 );
              })}
           </div>
        </div>
      )}

      {activeTab === 'SCAN' && (
          <div className="space-y-6">
              <div className="bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-8 rounded-2xl flex flex-col items-center text-center">
                  <div className="bg-emerald-500 text-white p-4 rounded-full shadow-lg mb-4 animate-pulse">
                      <Cpu size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-800 dark:text-white mb-2">Network Otomatik Tarama</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
                      Ağda (IP) tanımlı olan tüm yazıcılara SNMP protokolü ile bağlanılarak son sayaç verileri otomatik olarak çekilir ve kaydedilir.
                  </p>
                  <button 
                    disabled={isScanning}
                    onClick={handleAutoScan}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all active:scale-95"
                  >
                      {isScanning ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                      {isScanning ? "Tarama Yapılıyor..." : "Tüm Ağdaki Yazıcıları Tara"}
                  </button>
              </div>

              {Object.keys(scanResults).length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 flex justify-between">
                          <span className="font-bold text-sm">Tarama Durumu</span>
                          <span className="text-xs text-zinc-400">{Object.keys(scanResults).length} Cihaz</span>
                      </div>
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {printers.filter(p => scanResults[p.id]).map(p => {
                              const res = scanResults[p.id];
                              return (
                                  <div key={p.id} className="p-4 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-2 h-2 rounded-full ${res.status === 'loading' ? 'bg-blue-500 animate-pulse' : res.status === 'done' ? 'bg-emerald-500' : res.status === 'error' ? 'bg-red-500' : 'bg-zinc-300'}`}></div>
                                          <div>
                                              <p className="font-bold text-sm">{p.model}</p>
                                              <p className="text-[10px] text-zinc-400">{p.ipAddress}</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          {res.status === 'loading' && <span className="text-xs text-blue-500 italic">Bağlanıyor...</span>}
                                          {res.status === 'done' && (
                                              <div className="flex flex-col items-end">
                                                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Başarılı</span>
                                                  <span className="text-[10px] font-mono">{res.value} Endeks</span>
                                              </div>
                                          )}
                                          {res.status === 'error' && <span className="text-xs text-red-500 font-bold">Hata!</span>}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              )}
          </div>
      )}

      {activeTab === 'HISTORY_ENTRY' && (
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-zinc-800 dark:text-white flex items-center gap-2 mb-6"><History size={24} className="text-orange-500"/> Geçmiş Sayaç Girişi</h3>
              <form onSubmit={handleHistoricalSave} className="space-y-6">
                  <div><label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Cihaz</label><select required className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white" value={histPrinterId} onChange={e => setHistPrinterId(e.target.value)}><option value="">-- Seçiniz --</option>{printers.map(p => <option key={p.id} value={p.id}>{p.brand} {p.model} - {p.location}</option>)}</select></div>
                  <div><label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Tarih</label><input required type="date" className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white cursor-pointer" value={histDate} onChange={e => setHistDate(e.target.value)} onClick={(e) => e.currentTarget.showPicker()}/></div>
                  <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl"><div className="flex gap-2"><button type="button" onClick={() => setHistEntryMode('SIMPLE')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${histEntryMode === 'SIMPLE' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Basit</button><button type="button" onClick={() => setHistEntryMode('STD')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${histEntryMode === 'STD' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Standart</button></div></div>
                  {histEntryMode === 'SIMPLE' ? (<div><label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Toplam Sayaç</label><input required type="number" className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 font-mono" value={histValueTotal} onChange={e => setHistValueTotal(e.target.value)}/></div>) : (
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Siyah</label><input required type="number" className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 font-mono" value={histValueBW} onChange={e => setHistValueBW(e.target.value)}/></div>
                          <div><label className="block text-sm font-bold text-purple-700 dark:text-purple-400 mb-1">Renkli</label><input required type="number" className="w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 font-mono" value={histValueColor} onChange={e => setHistValueColor(e.target.value)}/></div>
                      </div>
                  )}
                  <button type="submit" className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Save size={20}/> Kaydet</button>
              </form>
          </div>
      )}

      {selectedHistoryPrinter && (
        <div className="fixed inset-0 z-50 flex justify-end">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={closeModalViaBack}></div>
             <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-300 flex flex-col">
                 <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-between items-start">
                     <div><h3 className="text-2xl font-bold text-zinc-800 dark:text-white">{selectedHistoryPrinter.model}</h3><span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{selectedHistoryPrinter.location}</span></div>
                     <button onClick={closeModalViaBack} className="p-2 bg-white dark:bg-zinc-800 rounded-full"><X size={20} className="text-zinc-500"/></button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-black/50 custom-scrollbar">
                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-between">
                        <div><p className="text-xs text-zinc-500 uppercase font-bold">Güncel Sayaç</p><p className="text-2xl font-bold text-zinc-800 dark:text-white">{selectedHistoryPrinter.lastCounter.toLocaleString()}</p></div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg"><Calculator size={24} className="text-blue-600 dark:text-blue-400" /></div>
                    </div>
                    <h4 className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mt-2"><History size={16} /> Sayaç Geçmişi</h4>
                    {(() => {
                        const logs = allLogs.filter(l => l.printerId === selectedHistoryPrinter.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        if (logs.length === 0) return <div className="text-center py-10 opacity-60"><Droplet size={40} className="mx-auto mb-2"/><p>Kayıt bulunamadı.</p></div>;
                        return (
                            <div className="space-y-3 relative">
                                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-zinc-200 dark:bg-zinc-800 z-0"></div>
                                {logs.map((log) => (
                                    <div key={log.id} className="relative z-10 pl-10">
                                        <div className="absolute left-[11px] top-4 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900"></div>
                                        <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
                                            <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2"><Calendar size={14} className="text-zinc-400" /><span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{new Date(log.date).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</span></div><span className="text-[10px] text-zinc-400">{new Date(log.date).toLocaleDateString('tr-TR')}</span></div>
                                            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg">
                                                <div><p className="text-[10px] text-zinc-400 uppercase">Okunan</p><p className="font-mono font-bold">{log.currentCounter.toLocaleString()}</p></div>
                                                <div className="text-right"><p className="text-[10px] text-zinc-400 uppercase">Fark</p><p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><TrendingUp size={12}/> {log.usage > 0 ? `+${log.usage.toLocaleString()}` : log.usage}</p></div>
                                            </div>
                                            <div className="mt-2 text-[10px] text-zinc-400">Yöntem: {log.recordedBy}</div>
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