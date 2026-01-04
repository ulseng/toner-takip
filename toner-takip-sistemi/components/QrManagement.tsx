
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Printer } from '../types';
import { LoadingScreen } from './LoadingScreen';
import { Printer as PrinterIcon, QrCode, Download, Save, Hash, FileText, Layers, RefreshCw, Wifi, Globe, Loader2, CheckCircle2 } from 'lucide-react';

export const QrManagement: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const p = await StorageService.getPrinters();
    setPrinters(p.sort((a, b) => parseInt(a.shortCode || '0') - parseInt(b.shortCode || '0')));
    setLoading(false);
  };

  const chunkArray = (arr: any[], size: number) => {
    const results = [];
    const copy = [...arr];
    while (copy.length) results.push(copy.splice(0, size));
    return results;
  };

  const handleDownloadPdf = async () => {
    if (generatingPdf) return;
    
    setGeneratingPdf(true);
    try {
        const { jsPDF } = (window as any).jspdf;
        const html2canvas = (window as any).html2canvas;
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageElements = document.querySelectorAll('.a4-page-capture');
        
        for (let i = 0; i < pageElements.length; i++) {
            const element = pageElements[i] as HTMLElement;
            
            // Capture each A4 page group
            const canvas = await html2canvas(element, {
                scale: 2, // High resolution
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
        
        pdf.save(`Yazici_Etiketleri_${new Date().toLocaleDateString('tr-TR')}.pdf`);
    } catch (error) {
        console.error("PDF Generation Error:", error);
        alert("PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
        setGeneratingPdf(false);
    }
  };

  if (loading) return <LoadingScreen message="Etiket şablonları hazırlanıyor..." />;

  if (isPrintMode) {
    // 4 columns x 4 rows = 16 labels per page
    const pages = chunkArray(printers, 16); 
    
    return (
      <div className="fixed inset-0 z-[100] bg-zinc-900 overflow-auto text-black custom-scrollbar">
          {generatingPdf && (
              <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white">
                  <div className="bg-zinc-900 p-10 rounded-[3rem] border border-zinc-800 flex flex-col items-center gap-6 shadow-2xl">
                      <div className="relative">
                          <Loader2 size={64} className="text-emerald-500 animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                              <FileText size={24} className="text-emerald-200" />
                          </div>
                      </div>
                      <div className="text-center">
                          <h3 className="text-xl font-black uppercase tracking-tighter">PDF OLUŞTURULUYOR</h3>
                          <p className="text-zinc-500 text-xs mt-2 font-bold uppercase tracking-widest">Lütfen Bekleyin, Sayfalar İşleniyor...</p>
                      </div>
                  </div>
              </div>
          )}

          <div className="sticky top-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-md text-white p-6 shadow-2xl flex flex-col md:flex-row justify-between items-center print:hidden z-50 gap-4 border-b border-zinc-800">
              <div className="flex items-center gap-4">
                  <div className="bg-emerald-500 p-2 rounded-xl"><QrCode size={24}/></div>
                  <div>
                      <h2 className="text-xl font-black tracking-tighter uppercase">BASKI ÖNİZLEME (A4)</h2>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{printers.length} Etiket | {pages.length} Sayfa | 4x4 Izgara</p>
                  </div>
              </div>
              <div className="flex gap-3">
                  <button onClick={() => setIsPrintMode(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-2xl font-black text-xs tracking-widest transition-all">VAZGEÇ</button>
                  <button 
                    onClick={handleDownloadPdf} 
                    disabled={generatingPdf}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                      {generatingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} 
                      PDF OLARAK İNDİR
                  </button>
              </div>
          </div>

          <div id="printable-area" className="flex flex-col items-center gap-10 p-10 print:p-0 print:gap-0 print:block bg-zinc-100 print:bg-white">
              {pages.map((pagePrinters, pageIndex) => (
                  <div key={pageIndex} className="flex flex-col gap-4 print:block mb-10 print:mb-0">
                      <div className="flex justify-between items-end print:hidden px-2">
                          <span className="text-zinc-500 text-xs font-black uppercase tracking-widest">SAYFA {pageIndex + 1} / {pages.length}</span>
                      </div>

                      <div 
                        className="a4-page-capture bg-white shadow-2xl print:shadow-none w-[210mm] h-[297mm] p-[12mm] grid grid-cols-4 grid-rows-4 gap-4 content-start relative mx-auto border border-zinc-200 print:border-none" 
                        style={{ pageBreakAfter: 'always' }}
                      >
                          {pagePrinters.map((p) => {
                             const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + window.location.pathname + '?pid=' + p.id + '&sc=' + (p.shortCode || ''))}`;
                             return (
                                 <div key={p.id} className="border-[1.5px] border-zinc-200 print:border-zinc-300 rounded-[2.5rem] p-4 flex flex-col items-center justify-between text-center h-[66mm] overflow-hidden relative print-color-adjust">
                                      <div className="w-full">
                                          <p className="font-black text-[9px] uppercase leading-tight truncate px-1 text-zinc-900 mb-0.5">{p.brand} {p.model}</p>
                                          <div className="bg-zinc-900 text-white text-[7px] font-black px-2 py-0.5 rounded-lg tracking-[0.1em] uppercase truncate inline-block max-w-[95%]">{p.location}</div>
                                      </div>

                                      <div className="w-full flex justify-center py-1">
                                          <div className="p-1.5 bg-white rounded-2xl border-2 border-zinc-50 shadow-sm">
                                            <img src={qrUrl} alt="QR" className="w-[32mm] h-[32mm] object-contain" crossOrigin="anonymous" />
                                          </div>
                                      </div>
                                      
                                      <div className="w-full">
                                          <div className="mb-1 flex items-center justify-center gap-1">
                                              {p.connectionType === 'Network' ? (
                                                  <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase flex items-center gap-1">
                                                      <Globe size={10} /> {p.ipAddress}
                                                  </span>
                                              ) : (
                                                  <span className="text-[8px] font-black text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-100 uppercase">
                                                      USB BAĞLANTI
                                                  </span>
                                              )}
                                          </div>
                                          <div className="flex justify-between items-center px-1 border-t border-zinc-100 pt-1.5 mt-0.5">
                                              <p className="text-[7px] text-zinc-400 font-mono font-bold truncate max-w-[45%]">{p.serialNumber}</p>
                                              <p className="text-[12px] font-black text-emerald-600 tracking-tighter">#{p.shortCode}</p>
                                          </div>
                                      </div>
                                 </div>
                             )
                          })}
                      </div>
                  </div>
              ))}
          </div>

          <style>{`
              @media print {
                  @page { size: A4; margin: 0; }
                  body { visibility: hidden; background: white; }
                  #root { display: none !important; }
                  #printable-area, #printable-area * { visibility: visible; }
                  #printable-area { position: absolute; left: 0; top: 0; width: 210mm; margin: 0; padding: 0; display: block !important; }
                  .print\\:hidden { display: none !important; }
                  .print-color-adjust { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
          `}</style>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-zinc-950 p-10 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-900 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h2 className="text-4xl font-black text-zinc-900 dark:text-white flex items-center gap-4 tracking-tighter uppercase">
                   <QrCode size={48} className="text-emerald-500" /> QR & Etiket Merkezi
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg font-medium max-w-2xl">Laminasyon işlemi için 4x4 grid düzeninde (A4 başına 16 etiket) profesyonel baskı alabilirsiniz.</p>
            </div>
            <button onClick={loadData} className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl hover:text-emerald-500 transition-all"><RefreshCw size={24}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-100/50 dark:border-emerald-500/10 p-10 rounded-[3rem] relative overflow-hidden">
              <h3 className="font-black text-emerald-900 dark:text-emerald-400 mb-8 text-2xl uppercase">ETİKET YAPISI</h3>
              <div className="space-y-6">
                  <div className="flex items-center gap-5">
                      <div className="bg-emerald-500 text-white p-2.5 rounded-2xl shadow-lg"><Globe size={24} strokeWidth={3}/></div>
                      <span className="text-emerald-900 dark:text-emerald-100 font-black text-sm uppercase">IP ADRESİ BİLGİSİ EKLENDİ</span>
                  </div>
                  <div className="flex items-center gap-5">
                      <div className="bg-emerald-500 text-white p-2.5 rounded-2xl shadow-lg"><Layers size={24} strokeWidth={3}/></div>
                      <span className="text-emerald-900 dark:text-emerald-100 font-black text-sm uppercase">QR + HIZLI KOD (#) ENTEGRASYONU</span>
                  </div>
                  <div className="flex items-center gap-5">
                      <div className="bg-emerald-500 text-white p-2.5 rounded-2xl shadow-lg"><FileText size={24} strokeWidth={3}/></div>
                      <span className="text-emerald-900 dark:text-emerald-100 font-black text-sm uppercase">16'LI LAMİNASYON VE KESİM UYUMLU</span>
                  </div>
              </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-10 rounded-[3rem] border border-zinc-100 dark:border-zinc-900 flex flex-col items-center justify-center text-center shadow-xl group hover:border-emerald-500/30 transition-all">
             <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] mb-8 transform group-hover:scale-110 transition-transform"><PrinterIcon size={64} className="text-zinc-400 dark:text-zinc-600" /></div>
             <h3 className="font-black text-zinc-900 dark:text-white text-2xl mb-4 uppercase">ETİKETLERİ HAZIRLA</h3>
             <p className="text-sm text-zinc-500 mb-10 max-w-xs font-medium">Toplam {printers.length} adet cihaz için IP adresli PDF sayfaları oluşturulacaktır.</p>
             <button onClick={() => setIsPrintMode(true)} className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-500 text-white font-black py-6 rounded-[2rem] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 text-sm tracking-widest uppercase">
                <Download size={24} strokeWidth={2.5} /> BASKI ŞABLONUNU AÇ
             </button>
          </div>
      </div>
    </div>
  );
};
