
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { PrinterList } from './components/PrinterList';
import { StockManagement } from './components/StockManagement';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { ServiceManagement } from './components/ServiceManagement';
import { QrManagement } from './components/QrManagement';
import { QrScanner } from './components/QrScanner';
import { Inventory } from './components/Inventory';
import { CounterManagement } from './components/CounterManagement';
import { Notes } from './components/Notes';
import { Invoices } from './components/Invoices';
import { User } from './types';
import { StorageService } from './services/storage';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [targetPrinterId, setTargetPrinterId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Kullanıcıyı Yükle
    const savedUser = localStorage.getItem('app_user');
    if (savedUser) {
        try {
            setUser(JSON.parse(savedUser));
        } catch (e) {
            localStorage.removeItem('app_user');
        }
    }
    
    // 2. Temayı Yükle
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'dark') setIsDarkMode(true);

    // 3. QR/URL Parametrelerini Çöz
    const resolveUrlParams = async () => {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get('pid');
      const sc = params.get('sc');

      if (pid) {
        setTargetPrinterId(pid);
        // URL'yi temizle ama state'i koru
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (sc) {
        // Hızlı kod ile yazıcı id'sini bul
        try {
            const printer = await StorageService.findPrinterByShortCode(sc);
            if (printer) {
                setTargetPrinterId(printer.id);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (error) {
            console.error("Yazıcı arama hatası:", error);
        }
      }
    };

    resolveUrlParams();
  }, []);

  // Kullanıcı giriş yaptıysa ve bir hedef yazıcı varsa direkt detayları gösteren sekmeye at
  useEffect(() => {
    if (user && targetPrinterId) {
        setActiveTab('printers');
    }
  }, [user, targetPrinterId]);

  const handleLogin = (loggedInUser: User) => {
    localStorage.setItem('app_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    // targetPrinterId zaten state'de olduğu için yukarıdaki useEffect yönlendirme yapacak
  };

  const handleLogout = () => {
    if (confirm("Sistemden çıkış yapmak istediğinize emin misiniz?")) {
        localStorage.removeItem('app_user');
        setUser(null);
        setActiveTab('dashboard');
        setTargetPrinterId(null);
        // Tüm URL query'lerini temizle
        window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('app_theme', newMode ? 'dark' : 'light');
  };

  if (!user) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <Login onLogin={handleLogin} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        user={user as any} // Desktop/Mobil farketmeksizin aynı logout tetiklenir
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      >
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'invoices' && <Invoices />}
        {activeTab === 'scan' && <QrScanner />}
        {activeTab === 'qr' && <QrManagement />}
        {activeTab === 'notes' && <Notes user={user} />}
        {activeTab === 'printers' && (
            <PrinterList 
                targetPrinterId={targetPrinterId} 
                clearTarget={() => setTargetPrinterId(null)} 
            />
        )}
        {activeTab === 'inventory' && <Inventory />} 
        {activeTab === 'counters' && <CounterManagement user={user} />}
        {activeTab === 'service' && <ServiceManagement user={user} />}
        {activeTab === 'stock' && <StockManagement user={user} />}
        {activeTab === 'history' && <History />}
        {activeTab === 'settings' && <Settings />}
      </Layout>
    </div>
  );
}

export default App;
