import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Zap } from 'lucide-react';

export const QrScanner: React.FC = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize QR Code Scanner
    const html5QrCode = new Html5Qrcode("reader");
    
    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };

    html5QrCode.start(
      { facingMode: "environment" }, 
      config,
      (decodedText) => {
        // SUCCESS CALLBACK
        setScanResult(decodedText);
        html5QrCode.stop().then(() => {
             handleScanSuccess(decodedText);
        }).catch(err => console.error(err));
      },
      (errorMessage) => {
        // parse error, ignore it.
      }
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
      // 1. Parse URL to get 'pid'
      try {
          const urlObj = new URL(url);
          const pid = urlObj.searchParams.get("pid");
          
          if (pid) {
              // 2. Redirect/Reload to activate the printer
              // We use window.location to force a deep link trigger in App.tsx
              window.location.href = window.location.origin + window.location.pathname + "?pid=" + pid;
          } else {
              setError("Geçersiz QR Kod. Cihaz ID'si bulunamadı.");
          }
      } catch (e) {
          setError("QR Kod okunamadı. Lütfen sistemden üretilen bir kod okutun.");
      }
  };

  return (
    <div className="flex flex-col items-center h-full max-w-md mx-auto relative animate-in fade-in duration-500">
      
      <div className="w-full bg-zinc-900 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
              <Camera className="text-emerald-400" /> QR Kod Tara
          </h2>
          <div className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">
             Kamerayı QR koda tutun
          </div>
      </div>

      <div className="relative w-full bg-black flex-1 flex flex-col items-center justify-center overflow-hidden rounded-b-2xl shadow-2xl">
          {/* Camera Viewport */}
          <div id="reader" className="w-full h-full object-cover"></div>

          {/* Overlay UI */}
          {!scanResult && !error && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-emerald-500/50 rounded-3xl relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>
                      
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/50 animate-pulse"></div>
                  </div>
              </div>
          )}

          {scanResult && (
              <div className="absolute inset-0 bg-emerald-900/90 flex flex-col items-center justify-center text-white p-8 text-center animate-in zoom-in">
                  <Zap size={48} className="text-yellow-400 mb-4 animate-bounce" />
                  <h3 className="text-2xl font-bold mb-2">QR Okundu!</h3>
                  <p className="text-emerald-200">Cihaz sayfasına yönlendiriliyorsunuz...</p>
              </div>
          )}

          {error && (
              <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center text-white p-8 text-center">
                  <X size={48} className="text-red-500 mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-red-400">Hata</h3>
                  <p className="text-zinc-400">{error}</p>
                  <button onClick={() => window.location.reload()} className="mt-6 bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-xl font-bold">Tekrar Dene</button>
              </div>
          )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl w-full">
         <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
            <strong>İpucu:</strong> QR kodu okuttuktan sonra otomatik olarak yazıcı ekranı açılacak ve "Hızlı Stok Düş" butonunu kullanabileceksiniz.
         </p>
      </div>

    </div>
  );
};