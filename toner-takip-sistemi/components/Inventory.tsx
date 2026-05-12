import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { Printer, SystemConfig } from '../types';
import { LoadingScreen } from './LoadingScreen';
import { 
  Box, MapPin, X, Search, CheckCircle2, AlertTriangle, 
  Truck, Archive, XCircle, ChevronRight, Hash, 
  Printer as PrinterIcon, PieChart as PieChartIcon, 
  BarChart3, Activity, Info
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';

interface ModelGroup {
  modelName: string;
  count: number;
  printers: Printer[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const Inventory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'chart'>('grid');

  useEffect(() => {
    loadData();
  }, []);

  // --- HISTORY / BACK BUTTON HANDLER ---
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
        if (selectedModel) {
            setSelectedModel(null);
        }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedModel]);

  // Close modal on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedModel) {
          e.preventDefault();
          window.history.back();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedModel]);

  const loadData = async () => {
    setLoading(true);
    const [allPrinters, sysConfig] = await Promise.all([
      StorageService.getPrinters(),
      StorageService.getConfig()
    ]);

    // Group by Model
    const groups: Record<string, Printer[]> = {};
    allPrinters.forEach(p => {
      const m = p.model || 'Bilinmeyen Model';
      if (!groups[m]) groups[m] = [];
      groups[m].push(p);
    });

    // Convert to Array and Sort by Count (Desc)
    const groupArray: ModelGroup[] = Object.keys(groups).map(key => ({
      modelName: key,
      count: groups[key].length,
      printers: groups[key]
    })).sort((a, b) => b.count - a.count);

    setModelGroups(groupArray);
    setConfig(sysConfig);
    setLoading(false);
  };

  const handleGroupClick = (group: ModelGroup) => {
      window.history.pushState({ modal: 'modelDetail' }, '');
      setSelectedModel(group);
  };

  const closeModalViaBack = () => {
      window.history.back();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 size={12}/> AKTİF</span>;
      case 'SPARE': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"><Archive size={12}/> YEDEK</span>;
      case 'MAINTENANCE': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"><Truck size={12}/> SERVİSTE</span>;
      case 'BROKEN': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><AlertTriangle size={12}/> ARIZALI</span>;
      default: return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"><XCircle size={12}/> HURDA</span>;
    }
  };

  const getModelImage = (model: string) => {
      return config?.modelImages?.[model] || null;
  };

  const filteredGroups = useMemo(() => 
    modelGroups.filter(g => 
      g.modelName.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))
    ), [modelGroups, searchTerm]
  );

  const totalPrinters = useMemo(() => 
    modelGroups.reduce((acc, curr) => acc + curr.count, 0), [modelGroups]
  );

  const chartData = useMemo(() => 
    modelGroups.map(g => ({
      name: g.modelName,
      value: g.count,
      percentage: Math.round((g.count / totalPrinters) * 100)
    })), [modelGroups, totalPrinters]
  );

  if (loading) return <LoadingScreen message="Envanter analizi yapılıyor..." />;

  return (
    <div className="space-y-6 pb-20 h-full flex flex-col">
      
      {/* Header & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col justify-between bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                <Box size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-zinc-800 dark:text-white tracking-tighter uppercase leading-none">
                  Model Envanteri
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold mt-2 uppercase tracking-widest">
                  {modelGroups.length} Farklı Model — {totalPrinters} Toplam Cihaz
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-8">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Model ismine göre filtrele..."
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-zinc-800 dark:text-white font-bold transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm' : 'text-zinc-500'}`}
                >
                  <Box size={16} /> Izgara
                </button>
                <button 
                  onClick={() => setViewMode('chart')}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'chart' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm' : 'text-zinc-500'}`}
                >
                  <PieChartIcon size={16} /> Dağılım
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col justify-center items-center text-center">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-2">TOPLAM CİHAZ SAYISI</p>
          <h3 className="text-7xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
            {totalPrinters}
          </h3>
          <div className="mt-6 flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-full">
            <Activity size={14} /> Sistem Aktif
          </div>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'chart' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800 h-[400px]">
            <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <PieChartIcon size={18} className="text-blue-500" /> Model Dağılım Oranları
            </h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800 h-[400px]">
            <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-500" /> Cihaz Sayısı Karşılaştırması
            </h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
           {filteredGroups.map((group, index) => {
              const imgUrl = getModelImage(group.modelName);
              const percentage = Math.round((group.count / totalPrinters) * 100);

              return (
                 <div 
                   key={group.modelName}
                   onClick={() => handleGroupClick(group)}
                   className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 hover:shadow-2xl hover:border-blue-500/30 transition-all cursor-pointer relative overflow-hidden flex flex-col"
                 >
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/10">
                           {percentage}% PAY
                        </div>
                        {imgUrl ? (
                            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-2 border border-zinc-100 dark:border-zinc-700 shadow-sm group-hover:scale-110 transition-transform duration-500">
                               <img src={imgUrl} alt={group.modelName} className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-300">
                              <PrinterIcon size={32} />
                            </div>
                        )}
                    </div>

                    <div className="mt-auto relative z-10">
                        <h3 className="text-xl font-black text-zinc-800 dark:text-white mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tighter leading-tight">
                            {group.modelName}
                        </h3>
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
                                {group.count}
                            </span>
                            <span className="text-xs font-black text-zinc-400 mb-2 uppercase tracking-widest">ADET</span>
                        </div>
                    </div>

                    <div className="mt-8 w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                 </div>
              );
           })}
           {filteredGroups.length === 0 && (
             <div className="col-span-full py-32 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-6">
                <div className="p-8 bg-zinc-100 dark:bg-zinc-800/50 rounded-[3rem]">
                  <Search size={64} strokeWidth={1} />
                </div>
                <p className="font-black text-sm uppercase tracking-[0.3em] text-center max-w-xs">Eşleşen model bulunamadı.</p>
             </div>
           )}
        </div>
      )}

      {/* DETAIL DRAWER */}
      {selectedModel && (
         <div className="fixed inset-0 z-[1000] flex justify-end">
             <div 
               className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500"
               onClick={closeModalViaBack}
             ></div>

             <div className="relative w-full max-w-2xl bg-zinc-50 dark:bg-[#09090b] h-full shadow-2xl border-l border-white/5 animate-in slide-in-from-right duration-500 flex flex-col overflow-hidden">
                 
                 {/* Detail Header */}
                 <div className="p-10 border-b border-white/5 bg-white dark:bg-zinc-950/50 flex justify-between items-center relative overflow-hidden">
                     <div className="absolute -left-20 -top-20 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full"></div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-blue-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">MODEL DETAYI</span>
                          <span className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">#{selectedModel.printers.length} ÜNİTE</span>
                        </div>
                        <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase leading-none">
                           {selectedModel.modelName}
                        </h3>
                     </div>
                     <button 
                       onClick={closeModalViaBack}
                       className="relative z-10 p-5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-[1.5rem] transition-all shadow-xl border border-white/5"
                     >
                        <X size={24} strokeWidth={3}/>
                     </button>
                 </div>

                 {/* Scrollable Content */}
                 <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                    {selectedModel.printers.map((printer) => (
                       <div 
                         key={printer.id} 
                         onClick={() => {
                           // Navigate to printers tab and select this printer
                           window.location.href = `${window.location.origin}${window.location.pathname}?pid=${printer.id}`;
                         }}
                         className="group bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all flex flex-col gap-6 relative overflow-hidden cursor-pointer active:scale-95"
                       >
                           <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500/20 group-hover:bg-blue-500 transition-colors"></div>
                           
                           <div className="flex justify-between items-start">
                               <div className="flex items-center gap-4">
                                   <div className="p-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/10">
                                      <MapPin size={24} strokeWidth={2.5} />
                                   </div>
                                   <div>
                                       <h4 className="font-black text-zinc-900 dark:text-white text-xl uppercase tracking-tighter leading-none mb-1">{printer.location}</h4>
                                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{printer.floor || 'KAT BİLGİSİ YOK'}</p>
                                   </div>
                               </div>
                               <div className="flex flex-col items-end gap-2">
                                 {getStatusBadge(printer.status)}
                                 <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg text-[9px] font-black text-zinc-500 uppercase tracking-widest border border-white/5">#{printer.shortCode}</span>
                                 <div className="flex items-center gap-1 text-blue-500 text-[8px] font-black uppercase mt-1">GİT <ChevronRight size={10}/></div>
                               </div>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-100 dark:border-white/5">
                               <div className="space-y-1">
                                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Hash size={10} /> SERİ NUMARASI</p>
                                 <p className="font-mono font-black text-zinc-700 dark:text-zinc-300 text-sm">{printer.serialNumber}</p>
                               </div>
                               <div className="space-y-1">
                                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Info size={10} /> IP ADRESİ</p>
                                 <p className="font-mono font-black text-zinc-700 dark:text-zinc-300 text-sm">{printer.ipAddress || 'USB BAĞLANTI'}</p>
                               </div>
                           </div>
                       </div>
                    ))}
                 </div>
                 
                 {/* Footer */}
                 <div className="p-8 bg-white dark:bg-zinc-950 border-t border-white/5">
                    <button 
                      onClick={closeModalViaBack}
                      className="w-full py-6 bg-zinc-900 dark:bg-zinc-900 text-white font-black rounded-[1.5rem] hover:bg-zinc-800 transition-all shadow-xl uppercase tracking-[0.3em] text-[10px]"
                    >
                       Listeyi Kapat
                    </button>
                 </div>

             </div>
         </div>
      )}

    </div>
  );
};
