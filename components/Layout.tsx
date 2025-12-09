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

const APP_VERSION = "v0.003";

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
    <div className="h-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 transition-colors duration-200 overflow-hidden fixed inset-0">
      
      {/* Mobile Header - Flex None (Fixed height) */}
      <div className="flex-none md:hidden bg-primary-800 text-white p-4 flex justify-between items-center shadow-md z-50">
        <div className="flex items-center gap-2">
          <div className="bg-white/10 p-1.5 rounded-lg shadow-inner">
             <Printer size={20} className="text-primary-100" />
          </div>
          <h1 className="text-xl font-bold">Toner Takip</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar (Desktop) / Drawer (Mobile) */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-primary-900 text-primary-50 transform transition-transform duration-200 ease-in-out h-full flex flex-col shadow-xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6 hidden md:block border-b border-primary-800">
          <div className="flex items-center gap-3 mb-1">
             <div className="bg-white/10 p-2 rounded-xl shadow-inner text-primary-200">
                <Printer size={28} />
             </div>
             <h1 className="text-2xl font-bold text-white">Toner<br/><span className="text-primary-300 text-lg font-medium">Takip</span></h1>
          </div>
          <p className="text-xs text-primary-400 mt-2 ml-1">Sürüm: {APP_VERSION}</p>
        </div>

        <div className="p-4 bg-primary-800 md:hidden">
          <p className="text-sm text-primary-200">Hoşgeldin,</p>
          <p className="font-semibold text-white">{user.name}</p>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-primary-700 text-white shadow-lg border border-primary-600' 
                  : 'text-primary-100 hover:bg-primary-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-primary-800 space-y-3 bg-primary-900">
           <div className="hidden md:block px-2">
            <p className="text-xs text-primary-300">Kullanıcı</p>
            <p className="font-medium text-sm truncate text-white">{user.name}</p>
          </div>
          
          <button
            onClick={toggleTheme}
            className="w-full flex items-center space-x-3 px-4 py-2 text-primary-100 hover:bg-primary-800 rounded-lg transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area - Flex 1 (Takes remaining space) */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 h-full">
        
        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth w-full h-full pb-20 md:pb-8">
          <div className="max-w-5xl mx-auto min-h-full flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            
            {/* Footer with Version - Always at bottom of content */}
            <footer className="mt-8 py-4 text-center border-t border-slate-200 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                Toner Takip Sistemi <span className="text-primary-500 font-bold ml-1">{APP_VERSION}</span>
              </p>
            </footer>
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};