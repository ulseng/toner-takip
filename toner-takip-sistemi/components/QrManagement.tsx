import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Printer } from '../types';
import { LoadingScreen } from './LoadingScreen';
import { Printer as PrinterIcon, QrCode, ArrowRight, CheckCircle2, AlertCircle, Download, Save, Image as ImageIcon } from 'lucide-react';

export const QrManagement: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [downloadingPage, setDownloadingPage] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Escape key to exit print mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPrintMode) {
        setIsPrintMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrintMode]);

  const loadData = async () => {
    setLoading(true);
    const p = await StorageService.getPrinters();
    setPrinters(p);
    setLoading(false);
  };

  // Helper to split array into chunks of 20
  const chunkArray = (arr: any[], size: number) => {
    const results = [];
    while (arr.length) {
        results.push(arr.splice(0, size));
    }
    return results;
  };

  const handlePrint = () => {
    setTimeout(() => {
        window.print();
    }, 100);
  };

  const downloadAsImage = async (pageIndex: number) => {
    const element = document.getElementById(`qr-page-${pageIndex}`);
    if (!element) return;

    setDownloadingPage(pageIndex);

    try {
        // Use html2canvas from global scope (added in index.html)
        const canvas = await (window as any).html2canvas(element, {
            useCORS: true, // Important for QR images from external API
            scale: 2, // Better quality
            backgroundColor: '#ffffff'
        });

        const link = document.createElement('a');
        link.download = `toner-takip-qr-sayfa-${pageIndex + 1}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    } catch (error) {
        console.error("Image generation failed:", error);
        alert("Resim oluşturulamadı. Lütfen sayfayı yenileyip tekrar deneyin.");
    } finally {
        setDownloadingPage(null);
    }
  };

  if (loading) return <LoadingScreen message="Cihaz listesi hazırlanıyor..." />;

  // --- PRINT MODE VIEW (OVERLAY) ---
  if (isPrintMode) {
    // Create a copy to not mutate state during splice
    const pages = chunkArray([...printers], 20); 
    
    return (
      <div className="fixed inset-0 z-[100] bg-zinc-800 overflow-auto text-black custom-scrollbar">
          {/* Control Bar (Hidden when printing) */}
          <div className="sticky top-0 left-0 right-0 bg-zinc-900 text-white p-4 shadow-lg flex flex-col md:flex-row justify-between items-center print:hidden z-50 gap-4 border-b border-zinc-700">
              <div>
                  <h2 className="text-xl font-bold flex items-center gap-2"><QrCode /> Baskı Önizleme</h2>
                  <p className="text-sm text-zinc-400">Toplam {printers.length} etiket. {pages.length} Sayfa.</p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                  <div className="hidden md:block text-xs text-zinc-500 mr-2 max-w-[200px] text-right">
                      Yazıcıdan çıktı alamıyorsanız, sayfaları aşağıdan "JPG İndir" butonuyla resim olarak kaydedebilirsiniz.
                  </div>
                  <button 
                      onClick={handlePrint} 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                      <Save size={18} /> Yazdır (PDF)
                  </button>
                  <button 
                      onClick={() => setIsPrintMode(false)} 
                      className="bg-zinc-700 hover:bg-zinc-600 text-white px-5 py-2 rounded-lg font-bold transition-colors"
                  >
                      Kapat
                  </button>
              </div>
          </div>

          {/* Printable Area Wrapper */}
          <div id="printable-area" className="flex flex-col items-center gap-12 p-8 print:p-0 print:gap-0 print:block">
              {pages.map((pagePrinters, pageIndex) => (
                  <div key={pageIndex} className="flex flex-col gap-2 print:block">
                      
                      {/* Download Button for this specific page (Hidden in print) */}
                      <div className="flex justify-between items-end print:hidden px-1">
                          <span className="text-zinc-400 text-sm font-bold">Sayfa {pageIndex + 1}</span>
                          <button 
                            onClick={() => downloadAsImage(pageIndex)}
                            disabled={downloadingPage !== null}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                          >
                             {downloadingPage === pageIndex ? (
                                 <span>Hazırlanıyor...</span>
                             ) : (
                                 <>
                                    <ImageIcon size={16} /> Resmi İndir (JPG)
                                 </>
                             )}
                          </button>
                      </div>

                      {/* The A4 Page */}
                      <div 
                          id={`qr-page-${pageIndex}`}
                          className="bg-white shadow-2xl print:shadow-none w-[210mm] min-h-[297mm] p-[10mm] grid grid-cols-4 grid-rows-5 gap-2 content-start relative page-break-after-always mx-auto"
                          style={{ pageBreakAfter: 'always' }}
                      >
                          {/* Page Content */}
                          {pagePrinters.map((p) => {
                             // Use '0' correction level for simpler QR codes if needed, using default here
                             const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + window.location.pathname + '?pid=' + p.id)}`;
                             
                             return (
                                 <div key={p.id} className="border border-zinc-900 p-2 flex flex-col items-center justify-between text-center h-[52mm] overflow-hidden relative">
                                      {/* Crop Marks (Visual only) */}
                                      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-black/20"></div>
                                      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-black/20"></div>
                                      <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-black/20"></div>
                                      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-black/20"></div>

                                      <div className="w-full flex justify-center pt-1">
                                          {/* Use proxy or set crossOrigin to anonymous if possible, but api.qrserver usually allows CORS */}
                                          <img src={qrUrl} alt="QR" className="w-[32mm] h-[32mm] object-contain" crossOrigin="anonymous" />
                                      </div>
                                      
                                      <div className="w-full pb-1">
                                          <p className="font-bold text-[10px] uppercase leading-tight truncate px-1 text-black">
                                              {p.brand} {p.model}
                                          </p>
                                          <p className="text-[9px] font-semibold leading-tight mt-0.5 truncate bg-black text-white px-1 mx-2 rounded-sm print-color-adjust">
                                              {p.location}
                                          </p>
                                          <p className="text-[7px] text-zinc-500 mt-0.5 font-mono">{p.serialNumber}</p>
                                      </div>
                                 </div>
                             )
                          })}
                      </div>
                  </div>
              ))}
          </div>

          {/* Critical Print Styles */}
          <style>{`
              @media print {
                  @page { 
                      size: A4; 
                      margin: 0; 
                  }
                  body { 
                      visibility: hidden; 
                      background: white;
                  }
                  /* Hide everything by default */
                  body * {
                      visibility: hidden;
                  }
                  /* Only show our printable area and its children */
                  #printable-area, #printable-area * {
                      visibility: visible;
                  }
                  /* Hide the manual download buttons in print view */
                  .print\\:hidden {
                      display: none !important;
                  }
                  /* Position the printable area absolutely to top left */
                  #printable-area {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                      margin: 0;
                      padding: 0;
                      display: block !important;
                  }
                  
                  .page-break-after-always { page-break-after: always !important; }
                  
                  .print-color-adjust {
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                  }
              }
          `}</style>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-2xl font-bold text-zinc-800 dark:text-white flex items-center gap-2 mb-2">
           <QrCode size={28} className="text-emerald-500" />
           QR Kod Yönetimi
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
            Cihazların üzerine yapıştırılacak etiketleri buradan toplu olarak yazdırabilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info Card */}
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-2xl flex flex-col justify-center">
              <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-4 text-lg">Sistem Durumu</h3>
              <div className="space-y-3">
                  <div className="flex items-center gap-3">
                      <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-500" />
                      <span className="text-emerald-900 dark:text-emerald-200 font-medium">Toplam {printers.length} Cihaz Kayıtlı</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-500" />
                      <span className="text-emerald-900 dark:text-emerald-200 font-medium">Etiket Boyutu: A4 Kağıda 20'li (4x5)</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-500" />
                      <span className="text-emerald-900 dark:text-emerald-200 font-medium">QR İçeriği: Otomatik Cihaz Sayfası Linki</span>
                  </div>
              </div>
          </div>

          {/* Action Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center shadow-sm">
             <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4">
                <PrinterIcon size={40} className="text-zinc-400" />
             </div>
             <h3 className="font-bold text-zinc-800 dark:text-white text-lg mb-2">Toplu Etiket Basımı</h3>
             <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-xs">
                Tüm kayıtlı yazıcılar için QR kodlarını A4 formatında hazırlar. PDF olarak yazdırabilir veya <strong>Resim (JPG) olarak indirebilirsiniz.</strong>
             </p>
             <button 
                onClick={() => setIsPrintMode(true)}
                className="w-full max-w-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
             >
                <QrCode size={20} />
                Etiketleri Hazırla <ArrowRight size={18} />
             </button>
          </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl">
          <h4 className="font-bold text-blue-800 dark:text-blue-400 flex items-center gap-2 mb-2">
             <AlertCircle size={18}/> Nasıl Kullanılır?
          </h4>
          <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-1">
             <li>"Etiketleri Hazırla" butonuna basın.</li>
             <li>Eğer doğrudan çıktı alamıyorsanız, her sayfanın üzerindeki <strong>"Resmi İndir (JPG)"</strong> butonunu kullanın.</li>
             <li>İnen resmi bilgisayarınızda açıp yazdırın (Sayfaya Sığdır seçeneği ile).</li>
             <li>Etiketleri kesip yazıcıların üzerine yapıştırın.</li>
          </ul>
      </div>

    </div>
  );
};