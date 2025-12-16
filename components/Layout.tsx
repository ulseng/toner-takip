import React, { useState, useRef } from 'react';
import { Menu, X, Printer, Package, LogOut, LayoutDashboard, History, Settings, Moon, Sun, Wrench, QrCode, ScanLine, Box, Calculator, MoreHorizontal, ChevronUp } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  user: { name: string };
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const APP_VERSION = "v2.006-mobile";

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, onLogout, user, isDarkMode, toggleTheme 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll Handler
  const handleScroll = () => {
    if (scrollRef.current) {
        const scrollTop = scrollRef.current.scrollTop;
        setShowScrollTop(scrollTop > 300);
    }
  };

  const scrollToTop = () => {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToDashboard = () => {
      setActiveTab('dashboard');
      scrollToTop();
  };

  // All Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Özet', icon: LayoutDashboard },
    { id: 'scan', label: 'QR Oku', icon: ScanLine }, // Will be handled specially in mobile
    { id: 'printers', label: 'Yazıcılar', icon: Printer },
    { id: 'stock', label: 'Stok', icon: Package },
    { id: 'counters', label: 'Sayaç', icon: Calculator },
    { id: 'service', label: 'Servis', icon: Wrench },
    { id: 'inventory', label: 'Envanter', icon: Box },
    { id: 'qr', label: 'QR Yönetim', icon: QrCode },
    { id: 'history', label: 'Geçmiş', icon: History },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  // Mobile Bottom Nav Items (Limited selection)
  const mobileBottomItems = [
    { id: 'dashboard', label: 'Özet', icon: LayoutDashboard },
    { id: 'printers', label: 'Yazıcılar', icon: Printer },
    { id: 'scan', label: '', icon: ScanLine }, // Center Action Button
    { id: 'stock', label: 'Stok', icon: Package },
    { id: 'menu', label: 'Diğer', icon: MoreHorizontal }, // Triggers drawer
  ];

  const handleNavClick = (id: string) => {
    if (id === 'menu') {
      setIsMobileMenuOpen(true);
    } else {
      setActiveTab(id);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-zinc-50 dark:bg-black transition-colors duration-300 overflow-hidden fixed inset-0 font-sans">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-900 text-zinc-100 h-full shadow-2xl border-r border-zinc-800 z-50">
        {/* Logo Section */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-900">
          <button 
            onClick={goToDashboard}
            className="flex items-center gap-3 mb-1 cursor-pointer hover:opacity-80 transition-opacity text-left w-full group"
          >
             <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 text-white group-hover:scale-105 transition-transform duration-300">
                <Printer size={28} />
             </div>
             <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Toner<br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 text-lg font-medium">Sistemi</span></h1>
          </button>
          <p className="text-[10px] text-zinc-500 mt-3 ml-1 uppercase tracking-widest font-semibold">Sürüm: {APP_VERSION}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
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
           <div className="px-2 mb-2">
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
          <button onClick={toggleTheme} className="w-full flex items-center space-x-3 px-4 py-2.5 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400 rounded-xl transition-colors">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-sm">{isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}</span>
          </button>
          <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-400 hover:bg-red-900/20 rounded-xl transition-colors">
            <LogOut size={18} />
            <span className="text-sm">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE DRAWER (For "More" Menu) --- */}
      <div className={`fixed inset-0 z-[60] transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-72 bg-zinc-900 h-full shadow-2xl flex flex-col">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                  <h2 className="text-white font-bold text-lg">Menü</h2>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400"><X size={24}/></button>
              </div>
              <div className="p-4 bg-zinc-800/50">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">{user.name.charAt(0)}</div>
                      <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-xs text-zinc-400">Aktif Kullanıcı</p>
                      </div>
                  </div>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                  {navItems.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === item.id ? 'bg-emerald-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}
                      >
                          <item.icon size={20} />
                          {item.label}
                      </button>
                  ))}
              </nav>
              <div className="p-4 border-t border-zinc-800 space-y-3">
                  <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 text-zinc-300 hover:bg-zinc-800 rounded-xl">
                      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                      {isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}
                  </button>
                  <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-xl">
                      <LogOut size={20} /> Çıkış Yap
                  </button>
              </div>
          </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 h-full w-full">
        {/* Mobile Top Bar (Simplified) */}
        <div className="md:hidden flex-none bg-white dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between z-20 sticky top-0">
             <button 
               onClick={goToDashboard}
               className="flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity"
             >
                 <Printer className="text-emerald-500" size={24} />
                 <h1 className="font-bold text-lg text-zinc-800 dark:text-white tracking-tight">Toner Takip</h1>
             </button>
             <div className="text-xs font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500 uppercase tracking-wider">
                 {activeTab === 'dashboard' ? 'Özet' : 
                  activeTab === 'printers' ? 'Yazıcılar' : 
                  activeTab === 'scan' ? 'Tarama' : 
                  navItems.find(i => i.id === activeTab)?.label}
             </div>
        </div>

        {/* Scrollable Content */}
        <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth w-full h-full pb-24 md:pb-8 relative"
        >
          <div className="max-w-6xl mx-auto min-h-full flex flex-col">
            <div className="flex-1 animate-in fade-in duration-300 slide-in-from-bottom-2">
              {children}
            </div>
            
            {/* Footer */}
            <footer className="mt-12 py-6 text-center border-t border-zinc-200 dark:border-zinc-800 mb-20 md:mb-0">
              <div className="flex flex-col items-center justify-center gap-1 opacity-60">
                  <p className="text-[10px] text-zinc-400 font-mono tracking-[0.2em] uppercase">Toner Takip Sistemi</p>
                  <p className="text-[9px] text-zinc-300 dark:text-zinc-700">{APP_VERSION}</p>
              </div>
            </footer>
          </div>

          {/* NEON SCROLL TO TOP BUTTON */}
          <button
            onClick={scrollToTop}
            className={`fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40 p-3.5 rounded-full 
            bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl
            border border-zinc-200 dark:border-emerald-500/30
            text-zinc-600 dark:text-emerald-400 
            shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_0_20px_rgba(16,185,129,0.25)] 
            transition-all duration-500 ease-out transform group
            ${showScrollTop ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-75 pointer-events-none'}`}
            aria-label="Yukarı Çık"
          >
             <ChevronUp 
                size={24} 
                strokeWidth={2.5} 
                className="group-hover:-translate-y-1 transition-transform duration-300 ease-out" 
             />
          </button>

        </div>

        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        <div className="md:hidden flex-none bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)] z-30 fixed bottom-0 left-0 w-full shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]">
            <div className="flex justify-around items-center h-16 px-1 relative">
                {mobileBottomItems.map((item) => {
                    const isActive = activeTab === item.id || (item.id === 'menu' && isMobileMenuOpen);
                    
                    // Special Center Button (Scan)
                    if (item.id === 'scan') {
                        return (
                            <button 
                                key={item.id}
                                onClick={() => handleNavClick('scan')}
                                className="relative -top-5 flex flex-col items-center justify-center"
                            >
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform active:scale-90 ${activeTab === 'scan' ? 'bg-zinc-800 text-emerald-400 border-2 border-emerald-500' : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'}`}>
                                    <ScanLine size={24} strokeWidth={2.5} />
                                </div>
                                <span className="text-[10px] font-bold mt-1 text-zinc-500 dark:text-zinc-400">QR Tara</span>
                            </button>
                        )
                    }

                    return (
                        <button 
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`}
                        >
                            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
      </main>

    </div>
  );
};