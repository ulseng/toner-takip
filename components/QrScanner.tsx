
import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Zap, Hash, ArrowRight, Loader2, RefreshCw, AlertCircle, Maximize } from 'lucide-react';
import { StorageService } from '../services/storage';

export const QrScanner: React.FC = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    setError(null);
    setIsCameraReady(false);
    
    if (scannerRef.current && scannerRef.current.isScanning) {
        try { await scannerRef.current.stop(); } catch (e) {}
    }

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const config = { 
        fps: 30, 
        qrbox: (viewWidth: number, viewHeight: number) => {
            const minDim = Math.min(viewWidth, viewHeight);
            const boxSize = Math.floor(minDim * 0.7);
            return { width: boxSize, height: boxSize };
        },
        aspectRatio: 1.0,
        disableFlip: false
    };

    setTimeout(() => {
        html5QrCode.start(
          { facingMode: "environment" }, 
          config,
          (decodedText) => {
            setScanResult(decodedText);
            html5QrCode.stop().then(() => {
                 handleScanSuccess(decodedText);
            }).catch(err => console.error(err));
          },
          (errorMessage) => {}
        ).then(() => {
            setIsCameraReady(true);
        }).catch(err => {
            console.error("Camera error:", err);
            setError("Kamera başlatılamadı. APK izinlerini kontrol edin.");
        });
    }, 700);
  };

  useEffect(() => {
    startScanner();
    return () => {
       if (scannerRef.current && scannerRef.current.isScanning) {
           scannerRef.current.stop().catch(err => console.error(err));
       }
    };
  }, []);

  const handleScanSuccess = async (text: string) => {
      // 1. Durum: Tam URL okunduysa
      if (text.startsWith('http')) {
          try {
              const url = new URL(text);
              const sc = url.searchParams.get("sc");
              const pid = url.searchParams.get("pid");
              
              if (pid) {
                  window.location.href = `${window.location.origin}${window.location.pathname}?pid=${pid}`;
              } else if (sc) {
                  await handleManualSubmit(sc);
              } else {
                  setError("Okunan QR kodu sistemle uyumlu değil.");
              }
          } catch (e) {
              setError("Geçersiz URL formatı okundu.");
          }
      } 
      // 2. Durum: Sadece Hızlı Kod (4 haneli rakam) okunduysa
      else if (/^\d{4,5}$/.test(text)) {
          await handleManualSubmit(text);
      } 
      else {
          setError("QR içeriği anlaşılamadı. Lütfen sistem tarafından oluşturulan QR kodlarını kullanın.");
      }
  };

  const handleManualSubmit = async (codeToSearch?: string) => {
      const code = codeToSearch || manualCode;
      if (!code) return;
      setIsSearching(true);
      setError(null);
      try {
          const printer = await StorageService.findPrinterByShortCode(code);
          if (printer) {
              // Uygulamayı o yazıcının detayına yönlendir
              window.location.href = `${window.location.origin}${window.location.pathname}?pid=${printer.id}`;
          } else {
              setError(`Hızlı Kod (#${code}) ile eşleşen cihaz bulunamadı.`);
              setIsSearching(false);
          }
      } catch (e) {
          setError("Veritabanı sorgu hatası.");
          setIsSearching(false);
      }
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto animate-in fade-in duration-700 p-4">
      <div className="relative w-full bg-black aspect-square overflow-hidden rounded-[3rem] shadow-2xl border-4 border-zinc-900">
          <div id="reader" className="w-full h-full"></div>
          {!scanResult && isCameraReady && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                  <div className="w-64 h-64 border-2 border-emerald-500/20 rounded-[2.5rem] relative">
                      <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
                      <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
                      <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
                      <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_15px_#10b981] animate-scan"></div>
                  </div>
              </div>
          )}
          {!isCameraReady && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-emerald-500">
                  <Loader2 size={40} className="animate-spin mb-4 opacity-50" />
                  <p className="font-black text-[10px] uppercase tracking-widest">Kamera Aktifleşiyor...</p>
              </div>
          )}
          {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-10 text-center z-30">
                  <AlertCircle size={40} className="text-red-500 mb-4" />
                  <p className="text-white text-xs font-bold mb-6">{error}</p>
                  <button onClick={startScanner} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase"><RefreshCw size={14} className="inline mr-2" /> Yeniden Dene</button>
              </div>
          )}
      </div>

      <div className="mt-8 space-y-6">
          <div className="flex flex-col items-center gap-4">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">MANUEL KOD GİRİŞİ</span>
              <div className="flex w-full gap-2">
                  <div className="relative flex-1">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input 
                        type="number" 
                        pattern="[0-9]*" 
                        inputMode="numeric" 
                        placeholder="Örn: 1022" 
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-black text-xl" 
                        value={manualCode} 
                        onChange={(e) => setManualCode(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()} 
                      />
                  </div>
                  <button onClick={() => handleManualSubmit()} disabled={!manualCode || isSearching} className="bg-emerald-600 text-white px-6 rounded-2xl flex items-center justify-center">
                      {isSearching ? <Loader2 className="animate-spin" size={24}/> : <ArrowRight size={24} />}
                  </button>
              </div>
          </div>
      </div>
      <style>{`
          @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
          .animate-scan { animation: scan 2s linear infinite; }
      `}</style>
    </div>
  );
};
