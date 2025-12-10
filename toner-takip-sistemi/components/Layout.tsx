import React, { useState } from 'react';
import { Menu, X, Printer, Package, LogOut, LayoutDashboard, History, Settings, Moon, Sun, Wrench } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  user: { name: string };
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const APP_VERSION = "v1.006";

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, onLogout, user, isDarkMode, toggleTheme 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Özet', icon: LayoutDashboard },
    { id: 'printers', label: 'Yazıcılar', icon: Printer },
    { id: 'service', label: 'Bakım & Servis', icon: Wrench },
    { id: 'stock', label: 'Stok Yönetimi', icon: Package },
    { id: 'history', label: 'Geçmiş', icon: History },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-zinc-50 dark:bg-black transition-colors duration-300 overflow-hidden fixed inset-0 font-sans">
      
      {/* Mobile Header - Gradient */}
      <div className="flex-none md:hidden bg-gradient-to-r from-zinc-900 to-zinc-800 text-white p-4 flex justify-between items-center shadow-lg shadow-emerald-900/10 z-50 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
             <Printer size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">Toner Takip</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-zinc-300 hover:text-white">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar (Desktop) / Drawer (Mobile) - Dark & Green Theme */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-zinc-900 text-zinc-100 transform transition-transform duration-300 ease-in-out h-full flex flex-col shadow-2xl border-r border-zinc-800
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Logo Section */}
        <div className="p-6 hidden md:block border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-3 mb-1">
             <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 text-white">
                <Printer size={28} />
             </div>
             <h1 className="text-2xl font-bold text-white tracking-tight">Toner<br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 text-lg font-medium">Sistemi</span></h1>
          </div>
          <p className="text-[10px] text-zinc-500 mt-3 ml-1 uppercase tracking-widest font-semibold">Sürüm: {APP_VERSION}</p>
        </div>

        {/* Mobile User Info */}
        <div className="p-4 bg-zinc-800 md:hidden border-b border-zinc-700">
          <p className="text-xs text-zinc-400">Giriş Yapıldı:</p>
          <p className="font-semibold text-emerald-400">{user.name}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                activeTab === item.id 
                  ? 'text-white shadow-lg shadow-emerald-900/20' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {/* Active Tab Background Gradient */}
              {activeTab === item.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 opacity-90"></div>
              )}
              
              <div className="relative z-10 flex items-center gap-3">
                  <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'group-hover:text-emerald-400 transition-colors'} />
                  <span className="font-medium tracking-wide">{item.label}</span>
              </div>
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-zinc-800 space-y-3 bg-zinc-900">
           <div className="hidden md:block px-2 mb-2">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-xs text-zinc-500">Kullanıcı</p>
                    <p className="font-medium text-sm truncate text-zinc-200">{user.name}</p>
                </div>
            </div>
          </div>
          
          <button
            onClick={toggleTheme}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400 rounded-xl transition-colors"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-sm">{isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-400 hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 h-full">
        
        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth w-full h-full pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto min-h-full flex flex-col">
            <div className="flex-1 animate-in fade-in duration-500 slide-in-from-bottom-2">
              {children}
            </div>
            
            {/* COPYRIGHT FOOTER - ALWAYS VISIBLE */}
            <footer className="mt-12 py-6 text-center border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-zinc-400 font-mono tracking-[0.2em] uppercase">
                    Toner Takip Sistemi
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold tracking-wide">
                    Designed by Batuhan Yontuç
                  </p>
                  <p className="text-[9px] text-zinc-300 dark:text-zinc-700 mt-1">
                      {APP_VERSION} &copy; {new Date().getFullYear()}
                  </p>
              </div>
            </footer>
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};