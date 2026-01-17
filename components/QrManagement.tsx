
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Printer, SystemConfig } from '../types';
import { LoadingScreen } from './LoadingScreen';
import { Printer as PrinterIcon, QrCode, Download, Image as ImageIcon, CheckCircle2, Loader2, X, AlertTriangle, Settings } from 'lucide-react';

declare const html2canvas: any;
declare const jspdf: any;

export const QrManagement: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPrinters, setSelectedPrinters] = useState<string[]>([]);
  const [generating, setGenerating] = useState<null | 'pdf' | 'jpeg'>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [pData, cData] = await Promise.all([
        StorageService.getPrinters(),
        StorageService.getConfig()
    ]);
    setPrinters(pData.sort((a, b) => (a.shortCode || '').localeCompare(b.shortCode || '')));
    setConfig(cData);
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedPrinters(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedPrinters.length === printers.length) setSelectedPrinters([]);
    else setSelectedPrinters(printers.map(p => p.id));
  };

  const chunkArray = (array: any[], size: number) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  };

  const getQrUrl = (sc: string) => {
      const baseUrl = config?.appUrl || window.location.origin + window.location.pathname;
      const cleanBase = baseUrl.replace(/\/$/, ""); 
      return `${cleanBase}?sc=${sc}`;
  };

  const handleDownload = async (type: 'pdf' | 'jpeg') => {
    if (selectedPrinters.length === 0) return;
    
    if (!config?.appUrl) {
        if (!confirm("UYARI: Ayarlar sayfasında 'Uygulama Genel URL Adresi' tanımlanmamış. QR kodlar sadece bu bilgisayarda çalışabilir, telefonda 'DNS Hatası' verebilir. Devam edilsin mi?")) {
            return;
        }
    }

    setGenerating(type);
    const selectedData = printers.filter(p => selectedPrinters.includes(p.id));
    const pages = chunkArray(selectedData, 12); 

    try {
      const pdf = type === 'pdf' ? new jspdf.jsPDF('p', 'mm', 'a4') : null;

      for (let i = 0; i < pages.length; i++) {
        const pageId = `page-${i}`;
        const pageElement = document.getElementById(pageId);
        
        if (pageElement) {
          const canvas = await html2canvas(pageElement, {
            scale: 3, // Performans ve kalite dengesi
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794, // 210mm @ 96dpi
            windowHeight: 1123 // 297mm @ 96dpi
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);

          if (type === 'pdf') {
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
          } else {
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `toner_etiket_sayfa_${i + 1}.jpg`;
            link.click();
          }
        }
      }

      if (type === 'pdf') {
        pdf.save(`toner_etiketleri_${new Date().getTime()}.pdf`);
      }
    } catch (error) {
      console.error("Hata:", error);
      alert("İşlem sırasında bir hata oluştu.");
    } finally {
      setGenerating(null);
    }
  };

  if (loading) return <LoadingScreen message="Cihaz listesi hazırlanıyor..." />;

  const printerPages = chunkArray(printers.filter(p => selectedPrinters.includes(p.id)), 12);

  return (
    <div className="space-y-8 pb-32">
      {!config?.appUrl && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-[2rem] flex items-center gap-4 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={32} />
              <div className="flex-1">
                  <p className="font-black text-sm uppercase tracking-tighter leading-none">DNS HATASI UYARISI</p>
                  <p className="text-xs font-bold mt-1 opacity-80">Telefonda 'Siteye Ulaşılamıyor' hatası almamak için 'Ayarlar' sayfasından uygulamanın internet adresini kaydetmelisiniz.</p>
              </div>
          </div>
      )}

      <div className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-500/10 text-blue-500 rounded-3xl border border-blue-500/20"><QrCode size={40} strokeWidth={2.5}/></div>
            <div>
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase leading-none">ETİKET YÖNETİMİ</h2>
                <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-2 text-[10px]">A4 SAYFA BAŞI 12 ETİKET (62x67mm)</p>
            </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-center">
            <button onClick={selectAll} className="px-6 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-zinc-500 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900">
                {selectedPrinters.length === printers.length ? 'TEMİZLE' : 'HEPSİNİ SEÇ'}
            </button>
            <button onClick={() => handleDownload('jpeg')} disabled={selectedPrinters.length === 0 || !!generating} className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl disabled:opacity-50 transition-all flex items-center gap-3 text-[10px] tracking-widest uppercase">
                {generating === 'jpeg' ? <Loader2 className="animate-spin" size={18}/> : <ImageIcon size={18} />} JPG
            </button>
            <button onClick={() => handleDownload('pdf')} disabled={selectedPrinters.length === 0 || !!generating} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-3 text-[10px] tracking-widest uppercase">
                {generating === 'pdf' ? <Loader2 className="animate-spin" size={18}/> : <Download size={18} />} PDF
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {printers.map(printer => (
            <div key={printer.id} onClick={() => toggleSelect(printer.id)} className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer relative group flex flex-col justify-between h-44 ${selectedPrinters.includes(printer.id) ? 'bg-blue-600 border-blue-500 shadow-xl' : 'bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900'}`}>
                <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-xl ${selectedPrinters.includes(printer.id) ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400'}`}>
                        <PrinterIcon size={18} />
                    </div>
                    {selectedPrinters.includes(printer.id) && <CheckCircle2 size={24} className="text-white" />}
                </div>
                <div>
                    <h3 className={`font-black text-sm uppercase tracking-tighter truncate ${selectedPrinters.includes(printer.id) ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>{printer.model}</h3>
                    <p className={`text-[9px] font-bold uppercase mt-1 tracking-widest ${selectedPrinters.includes(printer.id) ? 'text-blue-100' : 'text-zinc-500'}`}>{printer.location}</p>
                </div>
                <div className={`absolute bottom-4 right-6 font-mono font-black text-lg ${selectedPrinters.includes(printer.id) ? 'text-white/40' : 'text-zinc-100 dark:text-zinc-900'}`}>#{printer.shortCode}</div>
            </div>
        ))}
      </div>

      {/* GİZLİ SAYFALAMA ALANI - A4 BOYUTLARI (210x297mm) */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {printerPages.map((pagePrinters, pageIdx) => (
          <div key={pageIdx} id={`page-${pageIdx}`} style={{ width: '210mm', height: '297mm', padding: '10mm', backgroundColor: 'white', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', gap: '3mm', boxSizing: 'border-box' }}>
            {pagePrinters.map((printer) => (
              <div key={printer.id} style={{ width: '62mm', height: '67mm', border: '0.3mm solid #e2e8f0', borderRadius: '6mm', backgroundColor: 'white', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
                {/* HEADER (15mm) */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '15mm', textAlign: 'center', padding: '2mm 1mm' }}>
                    <div style={{ fontSize: '8pt', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', lineHeight: '1.1', marginBottom: '1mm', whiteSpace: 'nowrap', overflow: 'hidden' }}>{printer.brand} {printer.model}</div>
                    <div style={{ backgroundColor: '#0f172a', color: 'white', fontSize: '6pt', fontWeight: '800', borderRadius: '2mm', padding: '1mm 3mm', display: 'inline-block', textTransform: 'uppercase' }}>{printer.location}</div>
                </div>
                {/* QR KOD (35mm) */}
                <div style={{ position: 'absolute', top: '16mm', left: 0, width: '100%', height: '35mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getQrUrl(printer.shortCode || ''))}`} style={{ width: '33mm', height: '33mm' }} alt="QR" />
                </div>
                {/* FOOTER (15mm) */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '15mm', padding: '0 3mm' }}>
                    <div style={{ position: 'absolute', bottom: '3mm', left: '3mm', display: 'flex', alignItems: 'center', gap: '1mm', backgroundColor: '#f1f5f9', border: '0.1mm solid #e2e8f0', borderRadius: '1.5mm', padding: '1.5mm 3mm' }}>
                        <div style={{ width: '1.5mm', height: '1.5mm', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
                        <span style={{ fontSize: '7pt', fontWeight: '900', color: '#1e293b', fontFamily: 'monospace' }}>{printer.connectionType === 'Network' ? (printer.ipAddress?.split('.').pop() || 'IP') : 'USB'}</span>
                    </div>
                    <div style={{ position: 'absolute', bottom: '2mm', right: '3mm', fontSize: '16pt', fontWeight: '950', color: '#10b981', fontFamily: 'monospace', letterSpacing: '-0.5mm' }}>#{printer.shortCode}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

