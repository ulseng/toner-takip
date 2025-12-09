import React, { useState } from 'react';
import { User } from '../types';
import { Moon, Sun } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
      <div className="absolute top-4 right-4">
        {toggleTheme && (
           <button onClick={toggleTheme} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
             {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
           </button>
        )}
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="bg-primary-800 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Toner Takip</h1>
          <p className="text-primary-200">Personel Girişi (Online)</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kullanıcı Adı</label>
            <input 
              type="text" 
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adınızı giriniz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Şifre</label>
            <input 
              type="password" 
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi giriniz"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-primary-200 dark:shadow-none disabled:opacity-50"
          >
            {loading ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
          </button>
        </form>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700 font-medium">
           Batuhan Yontuç
        </div>
      </div>
    </div>
  );
};