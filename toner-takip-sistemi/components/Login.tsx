import React, { useState } from 'react';
import { User } from '../types';
import { Moon, Sun, Printer, Lock } from 'lucide-react';
import { StorageService } from '../services/storage';

interface LoginProps {
  onLogin: (user: User) => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, isDarkMode, toggleTheme }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await StorageService.login(username, password);
      
      if (user) {
        onLogin(user);
      } else {
        setError('Hatalı kullanıcı adı veya şifre! (Admin/yasam)');
      }
    } catch (err) {
      setError('Veritabanı bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black flex items-center justify-center p-4 transition-colors relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="absolute top-6 right-6 z-10">
        {toggleTheme && (
           <button onClick={toggleTheme} className="p-3 bg-white dark:bg-zinc-900 rounded-full shadow-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
             {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
           </button>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header with Gradient */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-10 text-center flex flex-col items-center justify-center border-b border-zinc-800 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-xl shadow-emerald-500/20 mb-4 relative z-10">
             <Printer size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Toner Takip</h1>
          <p className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Kurumsal Stok Yönetimi</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm text-center border border-red-100 dark:border-red-900/50 flex items-center justify-center gap-2">
              <span className="font-bold">!</span> {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase ml-1">Kullanıcı Adı</label>
                <input 
                type="text" 
                className="w-full p-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white transition-all placeholder:text-zinc-400"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="örn: admin"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase ml-1">Şifre</label>
                <div className="relative">
                    <input 
                    type="password" 
                    className="w-full p-4 border border-zinc-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white transition-all placeholder:text-zinc-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
          >
            {loading ? 'Giriş Yapılıyor...' : 'GİRİŞ YAP'}
          </button>
        </form>
        
        <div className="bg-zinc-50 dark:bg-black/20 p-5 text-center border-t border-zinc-100 dark:border-zinc-800">
           <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium tracking-wide">
             Designed by <span className="text-emerald-600 dark:text-emerald-500 font-bold">Batuhan Yontuç</span>
           </p>
        </div>
      </div>
    </div>
  );
};