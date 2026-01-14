
import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Zap, Hash, ArrowRight, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
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
    
    // Eski instance varsa temizle
    if (scannerRef.current && scannerRef.current.isScanning) {
        try {
            await scannerRef.current.stop();
        } catch (e) {}
    }

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const config = { 
        fps: 20, 
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0,
        disableFlip: false
    };

    // Hafif bir delay kameranın WebView içinde hazır olması için yardımcı olur
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
          (errorMessage) => {
              // Sürekli hata loglamaya gerek yok
          }
        ).then(() => {
            setIsCameraReady(true);
        }).catch(err => {
            console.error("Camera error:", err);
            setError("Kamera başlatılamadı. Lütfen kamera izinlerini kontrol edin veya tarayıcıyı yenileyin.");
        });
    }, 500);
  };

  useEffect(() => {
    startScanner();
    return () => {
       if (scannerRef.current && scannerRef.current.isScanning) {
           scannerRef.current.stop().catch(err => console.error("Error stopping scanner", err));
       }
    };
  }, []);

  const handleScanSuccess = (url: string) => {
      try {
          const urlObj = new URL(url);
          const pid = urlObj.searchParams.get("pid");
          const sc = urlObj.searchParams.get("sc");
          
          if (pid) {
              window.location.href = window.location.origin + window.location.pathname + "?pid=" + pid;
          } else if (sc) {
              handleManualSubmit(sc);
          } else {
              setError("Geçersiz QR Kod. Lütfen sistem tarafından oluşturulan etiketleri kullanın.");
          }
      } catch (e) {
          setError("QR Kod formatı geçersiz.");
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
              window.location.href = window.location.origin + window.location.pathname + "?pid=" + printer.id;
          } else {
              setError("Cihaz bulunamadı. Lütfen 4 haneli Hızlı Kod'u kontrol edin.");
              setIsSearching(false);
          }
      } catch (e) {
          setError("Sorgulama sırasında bir hata oluştu.");
          setIsSearching(false);
      }
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto animate-in fade-in duration-700 p-4 md:p-0">
      
      {/* Scanner Viewport */}
      <div className="relative w-full bg-black aspect-square overflow-hidden rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border-4 border-zinc-900 group">
          <div id="reader" className="w-full h-full object-cover"></div>
          
          {/* Tarama Maskesi ve Animasyonlar */}
          {!scanResult && isCameraReady && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                  <div className="w-72 h-72 border-2 border-emerald-500/20 rounded-[2.5rem] relative">
                      {/* Köşe Çerçeveleri */}
                      <div className="absolute -top-1 -left-1 w-12 h-12 border-t-8 border-l-8 border-emerald-500 rounded-tl-[1.5rem]"></div>
                      <div className="absolute -top-1 -right-1 w-12 h-12 border-t-8 border-r-8 border-emerald-500 rounded-tr-[1.5rem]"></div>
                      <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-8 border-l-8 border-emerald-500 rounded-bl-[1.5rem]"></div>
                      <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-8 border-r-8 border-emerald-500 rounded-br-[1.5rem]"></div>
                      
                      {/* Tarama Çizgisi */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-scan"></div>
                  </div>
              </div>
          )}

          {/* Kamera Yükleniyor veya Hata Durumu */}
          {!isCameraReady && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-emerald-500 gap-4">
                  <Loader2 size={48} className="animate-spin opacity-50" />
                  <p className="font-black text-[10px] uppercase tracking-[0.4em]">Optik Sistem Hazırlanıyor</p>
              </div>
          )}

          {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 text-white p-10 text-center gap-6 z-30">
                  <div className="bg-red-500 p-6 rounded-full shadow-2xl"><AlertCircle size={40} /></div>
                  <div>
                      <h4 className="font-black text-xl uppercase tracking-tighter">KAMERA HATASI</h4>
                      <p className="text-red-200 text-xs mt-2 font-medium leading-relaxed">{error}</p>
                  </div>
                  <button onClick={startScanner} className="bg-white text-red-900 px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center gap-2 shadow-xl active:scale-95 transition-all">
                      <RefreshCw size={18} /> TEKRAR DENE
                  </button>
              </div>
          )}

          {scanResult && (
              <div className="absolute inset-0 bg-emerald-900/95 flex flex-col items-center justify-center text-white p-10 text-center z-40">
                  <div className="bg-white text-emerald-600 p-6 rounded-full shadow-2xl mb-6"><Zap size={48} className="animate-pulse" /></div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">CİHAZ BULUNDU</h3>
                  <p className="text-emerald-200 text-xs mt-4 font-bold tracking-widest">Yönlendiriliyorsunuz...</p>
              </div>
          )}
      </div>

      {/* Manual Entry Section */}
      <div className="mt-10 space-y-6">
          <div className="flex flex-col items-center gap-4">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">VEYA HIZLI KOD GİRİN</span>
              <div className="flex w-full gap-3">
                  <div className="relative flex-1">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="number" 
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="4 Haneli Kod (Örn: 1001)"
                        className="w-full pl-12 pr-6 py-5 rounded-2xl border-2 border-transparent bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:border-emerald-500 transition-all font-black text-xl shadow-inner placeholder:text-zinc-400 dark:placeholder:text-zinc-800"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                      />
                  </div>
                  <button 
                    onClick={() => handleManualSubmit()}
                    disabled={!manualCode || isSearching}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 rounded-2xl shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center"
                  >
                      {isSearching ? <Loader2 className="animate-spin" size={24}/> : <ArrowRight size={24} strokeWidth={3}/>}
                  </button>
              </div>
          </div>

          <div className="p-8 bg-zinc-50 dark:bg-zinc-950/50 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-900 text-center space-y-3">
             <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">
               Uygulamayı APK olarak kullanırken kameraya <span className="text-emerald-500">HER ZAMAN</span> izin vermeniz gerekir. Eğer görüntü gelmiyorsa, sağ üstten tarayıcıyı yenileyin.
             </p>
          </div>
      </div>

      <style>{`
          @keyframes scan {
              0% { top: 0; opacity: 0; }
              50% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
          }
          .animate-scan {
              animation: scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
      `}</style>

    </div>
  );
};
