
import React, { useState } from 'react';
import { User } from '../types';
import { Moon, Sun, Printer, Lock, Key } from 'lucide-react';
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
      if (user) onLogin(user);
      else setError('Hatalı kimlik bilgileri! (admin/yasam)');
    } catch (err) {
      setError('Veritabanı bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-6 transition-colors relative overflow-hidden font-sans">
      
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[120px] animate-pulse"></div>

      <div className="w-full max-w-md bg-white/70 dark:bg-zinc-900/80 backdrop-blur-3xl rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] border border-white dark:border-zinc-800 relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-700">
        
        <div className="p-12 text-center flex flex-col items-center">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[2rem] shadow-2xl shadow-emerald-500/30 mb-8 transform hover:rotate-6 transition-transform">
             <Printer size={56} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-1 uppercase">TONER <span className="text-emerald-500">TAKİP</span></h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10">Kurumsal Yönetim Ekosistemi</p>
          
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-900/50 flex items-center justify-center gap-2 animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="relative group">
                  <input 
                    type="text" 
                    required
                    className="w-full pl-12 pr-6 py-5 bg-zinc-100/50 dark:bg-zinc-950/50 border-2 border-transparent rounded-[1.5rem] focus:border-emerald-500 focus:bg-white dark:focus:bg-black outline-none text-zinc-900 dark:text-white font-bold transition-all placeholder:text-zinc-400"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Kullanıcı Adı"
                  />
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              </div>

              <div className="relative group">
                  <input 
                    type="password" 
                    required
                    className="w-full pl-12 pr-6 py-5 bg-zinc-100/50 dark:bg-zinc-950/50 border-2 border-transparent rounded-[1.5rem] focus:border-emerald-500 focus:bg-white dark:focus:bg-black outline-none text-zinc-900 dark:text-white font-bold transition-all placeholder:text-zinc-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifre"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-widest rounded-[1.5rem] transition-all shadow-xl shadow-emerald-500/30 disabled:opacity-50 active:scale-[0.97]"
            >
              {loading ? 'Bağlanıyor...' : 'Sisteme Giriş Yap'}
            </button>
          </form>
        </div>
        
        <div className="p-8 bg-zinc-50/50 dark:bg-black/20 text-center border-t border-zinc-100 dark:border-zinc-800">
           <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">
             Geliştiren: <span className="text-emerald-600">Batuhan Yontuç</span>
           </p>
        </div>
      </div>
      
      {/* Theme Toggle in Login */}
      <button onClick={toggleTheme} className="fixed top-8 right-8 p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl text-zinc-500 transition-all active:scale-90">
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>
    </div>
  );
};
