import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Zap, Hash, ArrowRight, Loader2 } from 'lucide-react';
import { StorageService } from '../services/storage';

export const QrScanner: React.FC = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    const config = { 
        fps: 15, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };

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
    ).catch(err => {
      setError("Kamera başlatılamadı. Lütfen izinleri kontrol edin.");
    });

    return () => {
       if (html5QrCode.isScanning) {
           html5QrCode.stop().catch(err => console.error("Error stopping scanner", err));
       }
       html5QrCode.clear();
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
              setError("Geçersiz QR Kod.");
          }
      } catch (e) {
          setError("QR Kod okunamadı.");
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
              setError("Cihaz bulunamadı. Lütfen kodu kontrol edin.");
              setIsSearching(false);
          }
      } catch (e) {
          setError("Bir hata oluştu.");
          setIsSearching(false);
      }
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto animate-in fade-in duration-500">
      
      {/* Scanner Viewport */}
      <div className="relative w-full bg-black aspect-square overflow-hidden rounded-2xl shadow-2xl border-4 border-zinc-900">
          <div id="reader" className="w-full h-full object-cover"></div>
          
          {!scanResult && !error && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-emerald-500/30 rounded-3xl relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/50 animate-pulse"></div>
                  </div>
              </div>
          )}

          {scanResult && (
              <div className="absolute inset-0 bg-emerald-900/90 flex flex-col items-center justify-center text-white p-8 text-center">
                  <Zap size={48} className="text-yellow-400 mb-4 animate-bounce" />
                  <h3 className="text-2xl font-bold mb-2">Okundu!</h3>
              </div>
          )}
      </div>

      {/* Manual Entry Section */}
      <div className="mt-6 space-y-4">
          <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">VEYA EL İLE GİRİN</span>
              <div className="flex w-full gap-2">
                  <div className="relative flex-1">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input 
                        type="number" 
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="Hızlı Kod (Örn: 1005)"
                        className="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:border-emerald-500 transition-all font-bold text-lg"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                      />
                  </div>
                  <button 
                    onClick={() => handleManualSubmit()}
                    disabled={!manualCode || isSearching}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl shadow-lg disabled:opacity-50 transition-all"
                  >
                      {isSearching ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                  </button>
              </div>
          </div>

          {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                  <X size={20} />
                  <span>{error}</span>
              </div>
          )}

          <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
             <p><strong>Kamera odaklamıyorsa:</strong> Etiket üzerinde yazan 4 haneli <strong>Hızlı Kod</strong>'u yukarıya yazarak cihaza erişebilirsiniz.</p>
          </div>
      </div>

    </div>
  );
};