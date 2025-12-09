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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-primary-800 text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-50">
        <h1 className="text-xl font-bold">Toner Takip</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar (Desktop) / Drawer (Mobile) */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-primary-900 text-primary-50 transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 flex flex-col shadow-xl
      `}>
        <div className="p-6 hidden md:block border-b border-primary-800">
          <h1 className="text-2xl font-bold text-white">Toner Takip</h1>
          <p className="text-xs text-primary-200 mt-1">v1.3.0 - Service Module</p>
        </div>

        <div className="p-4 bg-primary-800 md:hidden">
          <p className="text-sm text-primary-200">Hoşgeldin,</p>
          <p className="font-semibold text-white">{user.name}</p>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2">
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

        <div className="p-4 border-t border-primary-800 space-y-3">
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

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <div className="max-w-5xl mx-auto">
          {children}
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