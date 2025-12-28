
import React, { useState, useRef, useEffect } from 'react';
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

const APP_VERSION = "v3.0 PRO";
const DEVELOPER = "Batuhan Yontuç";

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, onLogout, user, isDarkMode, toggleTheme 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
        setShowScrollTop(scrollRef.current.scrollTop > 300);
    }
  };

  const scrollToTop = () => {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'dashboard', label: 'Özet', icon: LayoutDashboard },
    { id: 'scan', label: 'QR Tara', icon: ScanLine },
    { id: 'printers', label: 'Yazıcılar', icon: Printer },
    { id: 'stock', label: 'Stok', icon: Package },
    { id: 'counters', label: 'Sayaç', icon: Calculator },
    { id: 'service', label: 'Servis', icon: Wrench },
    { id: 'inventory', label: 'Envanter', icon: Box },
    { id: 'history', label: 'Kayıtlar', icon: History },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  const mobileBottomItems = [
    { id: 'dashboard', label: 'Özet', icon: LayoutDashboard },
    { id: 'printers', label: 'Cihazlar', icon: Printer },
    { id: 'scan', label: '', icon: ScanLine }, 
    { id: 'stock', label: 'Stok', icon: Package },
    { id: 'menu', label: 'Menü', icon: MoreHorizontal },
  ];

  return (
    <div className={`h-full flex flex-col md:flex-row bg-zinc-50 dark:bg-black transition-colors duration-500 overflow-hidden fixed inset-0 font-sans ${isDarkMode ? 'dark' : ''}`}>
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-zinc-950 h-full shadow-[20px_0_40px_-20px_rgba(0,0,0,0.1)] dark:shadow-none border-r border-zinc-100 dark:border-zinc-900 z-50">
        <div className="p-8">
          <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-4 group">
             <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 rounded-2xl shadow-xl shadow-emerald-500/30 text-white group-hover:rotate-6 transition-transform">
                <Printer size={32} />
             </div>
             <div className="text-left">
                <h1 className="text-xl font-black text-zinc-900 dark:text-white leading-none tracking-tighter uppercase">TONER <span className="text-emerald-500">TAKİP</span></h1>
                <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase mt-1">Sistem Yönetimi</p>
             </div>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all relative group ${
                activeTab === item.id 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-emerald-600'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
              <span className="font-black text-sm uppercase tracking-wider">{item.label}</span>
              {activeTab === item.id && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#fff]"></div>}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950">
           <div className="flex items-center gap-3 mb-6 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                    {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Kullanıcı</p>
                    <p className="font-bold text-sm truncate dark:text-white">{user.name}</p>
                </div>
           </div>
           <div className="grid grid-cols-2 gap-2">
                <button onClick={toggleTheme} className="flex flex-col items-center justify-center gap-1 p-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded-2xl hover:text-emerald-500 transition-colors">
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    <span className="text-[9px] font-black uppercase">Tema</span>
                </button>
                <button onClick={onLogout} className="flex flex-col items-center justify-center gap-1 p-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl hover:bg-red-100 transition-colors">
                    <LogOut size={18} />
                    <span className="text-[9px] font-black uppercase">Çıkış</span>
                </button>
           </div>
           <div className="mt-6 text-center">
              <p className="text-[9px] text-zinc-400 font-bold tracking-widest opacity-50 uppercase">{APP_VERSION}</p>
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-tighter mt-1">Geliştiren: {DEVELOPER}</p>
           </div>
        </div>
      </aside>

      {/* --- MOBILE DRAWER --- */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-500 md:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className={`absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-zinc-950 shadow-2xl flex flex-col transform transition-transform duration-500 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
                  <h2 className="text-zinc-900 dark:text-white font-black text-xl tracking-tighter">MENÜ</h2>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-zinc-500"><X size={24}/></button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                  {navItems.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-sm uppercase tracking-wider ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 dark:text-zinc-400'}`}
                      >
                          <item.icon size={20} /> {item.label}
                      </button>
                  ))}
              </nav>
              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-900 space-y-3">
                  <div className="text-center pb-4">
                     <p className="text-[10px] text-zinc-400 font-black tracking-widest uppercase">Geliştiren: {DEVELOPER}</p>
                  </div>
                  <button onClick={toggleTheme} className="w-full flex items-center gap-4 px-6 py-4 text-zinc-500 dark:text-zinc-400 bg-white dark:bg-black rounded-2xl font-black text-sm uppercase">
                      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />} Tema
                  </button>
                  <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-4 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-2xl font-black text-sm uppercase">
                      <LogOut size={20} /> Çıkış Yap
                  </button>
              </div>
          </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-black transition-colors duration-500 h-full w-full">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex-none bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-900 p-5 flex items-center justify-between z-20 sticky top-0">
             <div className="flex items-center gap-3">
                 <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                    <Printer size={20} strokeWidth={3} />
                 </div>
                 <h1 className="font-black text-lg text-zinc-900 dark:text-white tracking-tighter uppercase">TONER <span className="text-emerald-500">TAKİP</span></h1>
             </div>
             <div className="text-[10px] font-black px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg uppercase tracking-[0.2em] border border-emerald-100 dark:border-emerald-900/40">
                {activeTab}
             </div>
        </div>

        {/* Scrollable Content */}
        <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth w-full h-full pb-32 md:pb-10 relative custom-scrollbar"
        >
          <div className="max-w-7xl mx-auto min-h-full">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {children}
            </div>
            
            <footer className="mt-20 py-10 text-center border-t border-zinc-100 dark:border-zinc-900">
              <div className="flex flex-col items-center gap-2 opacity-30 group">
                  <Printer size={24} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                  <p className="text-[10px] text-zinc-400 font-black tracking-[0.5em] uppercase">Toner Takip Enterprise Ecosystem</p>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase">Geliştiren: {DEVELOPER} | {APP_VERSION}</p>
              </div>
            </footer>
          </div>

          {/* SCROLL TOP BUTTON */}
          <button
            onClick={scrollToTop}
            className={`fixed bottom-28 md:bottom-10 right-6 md:right-10 z-[60] p-4 rounded-2xl 
            bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800
            text-zinc-900 dark:text-white shadow-2xl transition-all duration-500 transform
            ${showScrollTop ? 'translate-y-0 opacity-100 scale-100 active:scale-90' : 'translate-y-20 opacity-0 scale-50 pointer-events-none'}`}
          >
             <ChevronUp size={24} strokeWidth={3} />
          </button>
        </div>

        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        <div className="md:hidden flex-none bg-white/80 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-100 dark:border-zinc-900 pb-[env(safe-area-inset-bottom)] z-[90] fixed bottom-0 left-0 w-full shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-20 px-2 relative">
                {mobileBottomItems.map((item) => {
                    const isActive = activeTab === item.id || (item.id === 'menu' && isMobileMenuOpen);
                    
                    if (item.id === 'scan') {
                        return (
                            <button 
                                key={item.id}
                                onClick={() => setActiveTab('scan')}
                                className="relative -top-8 flex flex-col items-center justify-center"
                            >
                                <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 transition-all active:scale-95 ${activeTab === 'scan' ? 'bg-zinc-900 dark:bg-white text-emerald-500' : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'}`}>
                                    <ScanLine size={30} strokeWidth={2.5} />
                                </div>
                            </button>
                        )
                    }

                    return (
                        <button 
                            key={item.id}
                            onClick={() => item.id === 'menu' ? setIsMobileMenuOpen(true) : setActiveTab(item.id)}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-all active:scale-90 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}
                        >
                            <div className={isActive ? 'relative' : ''}>
                                <item.icon size={24} strokeWidth={isActive ? 3 : 2} />
                                {isActive && <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
      </main>

    </div>
  );
};
