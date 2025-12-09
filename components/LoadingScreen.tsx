import React from 'react';
import { Printer, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Sistem Yükleniyor...', fullScreen = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-slate-500 animate-in fade-in duration-300 ${fullScreen ? 'fixed inset-0 z-50 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm' : 'h-96 w-full'}`}>
      <div className="relative mb-6">
        {/* Ping Animation Background */}
        <div className="absolute inset-0 bg-primary-200 dark:bg-primary-900 rounded-full animate-ping opacity-75"></div>
        
        {/* Icon Container */}
        <div className="relative bg-white dark:bg-slate-800 p-6 rounded-full shadow-xl border-4 border-primary-100 dark:border-primary-900/50 flex items-center justify-center">
          <Printer size={40} className="text-primary-600 dark:text-primary-400" />
          
          {/* Small spinner badge */}
          <div className="absolute -bottom-1 -right-1 bg-primary-600 text-white p-1.5 rounded-full shadow-md border-2 border-white dark:border-slate-800">
            <Loader2 size={14} className="animate-spin" />
          </div>
        </div>
      </div>
      
      <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 animate-pulse">
        {message}
      </h3>
      <p className="text-xs text-slate-400 mt-1">Lütfen bekleyiniz...</p>
    </div>
  );
};