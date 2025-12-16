import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Printer, SystemConfig } from '../types';
import { LoadingScreen } from './LoadingScreen';
import { Box, MapPin, X, Search, CheckCircle2, AlertTriangle, Truck, Archive, XCircle, ChevronRight, Hash, Printer as PrinterIcon } from 'lucide-react';

interface ModelGroup {
  modelName: string;
  count: number;
  printers: Printer[];
}

export const Inventory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
          e.preventDefault(); // Stop other browser actions
          window.history.back(); // Trigger popstate to close
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
      // Push history state so back button works
      window.history.pushState({ modal: 'modelDetail' }, '');
      setSelectedModel(group);
  };

  // This function explicitly calls history back, which triggers the popstate listener
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

  const filteredGroups = modelGroups.filter(g => g.modelName.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <LoadingScreen message="Envanter analizi yapılıyor..." />;

  return (
    <div className="space-y-6 pb-20 h-full flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div>
           <h2 className="text-2xl font-bold text-zinc-800 dark:text-white flex items-center gap-2">
             <Box size={28} className="text-blue-600" />
             Model Envanteri
           </h2>
           <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
             Hangi modelden kaç adet cihaz olduğunu ve dağılımlarını inceleyin.
           </p>
        </div>
        
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
           <input 
             type="text" 
             placeholder="Model ara..."
             className="w-full pl-10 p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-zinc-800 dark:text-white"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 overflow-y-auto pb-4">
         {filteredGroups.map((group) => {
            const imgUrl = getModelImage(group.modelName);
            const total = modelGroups.reduce((acc, curr) => acc + curr.count, 0);
            const percentage = Math.round((group.count / total) * 100);

            return (
               <div 
                 key={group.modelName}
                 onClick={() => handleGroupClick(group)}
                 className="group bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-xl hover:border-blue-400/50 dark:hover:border-blue-600/50 transition-all cursor-pointer relative overflow-hidden flex flex-col"
               >
                  {/* Background decoration */}
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>

                  <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg text-xs font-bold">
                         {percentage}% Pay
                      </div>
                      {imgUrl ? (
                          <div className="w-12 h-12 bg-white rounded-lg p-1 border border-zinc-100 shadow-sm">
                             <img src={imgUrl} alt={group.modelName} className="w-full h-full object-contain" />
                          </div>
                      ) : (
                          <PrinterIcon className="text-zinc-300" size={32} />
                      )}
                  </div>

                  <div className="mt-auto relative z-10">
                      <h3 className="text-xl font-bold text-zinc-800 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {group.modelName}
                      </h3>
                      <div className="flex items-end gap-2">
                          <span className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tighter">
                              {group.count}
                          </span>
                          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Adet</span>
                      </div>
                  </div>

                  <div className="mt-4 w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
               </div>
            );
         })}
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {selectedModel && (
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
                           {selectedModel.modelName}
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                           Toplam {selectedModel.count} adet cihaz listeleniyor
                        </p>
                     </div>
                     <button 
                       onClick={closeModalViaBack}
                       className="p-2 bg-white dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                     >
                        <X size={20} className="text-zinc-500"/>
                     </button>
                 </div>

                 {/* Scrollable Content */}
                 <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50 dark:bg-black/50">
                    {selectedModel.printers.map((printer) => (
                       <div key={printer.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm flex flex-col gap-2 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                           <div className="flex justify-between items-start">
                               <div className="flex items-center gap-2">
                                   <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                      <MapPin size={18} />
                                   </div>
                                   <div>
                                       <h4 className="font-bold text-zinc-800 dark:text-white text-sm">{printer.location}</h4>
                                       <p className="text-xs text-zinc-500 dark:text-zinc-400">{printer.floor}</p>
                                   </div>
                               </div>
                               {getStatusBadge(printer.status)}
                           </div>
                           
                           <div className="flex items-center gap-4 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400">
                               <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900/50 px-2 py-1 rounded">
                                   <Hash size={12} />
                                   <span className="font-mono">{printer.serialNumber}</span>
                               </div>
                               {printer.ipAddress && (
                                   <div className="font-mono">{printer.ipAddress}</div>
                               )}
                           </div>
                       </div>
                    ))}
                 </div>
                 
                 {/* Footer */}
                 <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                    <button 
                      onClick={closeModalViaBack}
                      className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                       Kapat
                    </button>
                 </div>

             </div>
         </div>
      )}

    </div>
  );
};