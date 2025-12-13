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
import { Inventory } from './components/Inventory'; // New Import
import { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [targetPrinterId, setTargetPrinterId] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('app_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }

    // QR Code Deep Link Handler
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('pid');
    if (pid) {
      // If we have a printer ID in URL, save it to state
      setTargetPrinterId(pid);
      // We will switch tab after login check in render
    }
  }, []);

  // Effect to switch tab once user is logged in and we have a target
  useEffect(() => {
    if (user && targetPrinterId) {
      setActiveTab('printers');
    }
  }, [user, targetPrinterId]);

  const handleLogin = (user: User) => {
    localStorage.setItem('app_user', JSON.stringify(user));
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('app_user');
    setUser(null);
    setActiveTab('dashboard');
    setTargetPrinterId(null);
    // Clear URL params on logout to prevent loop
    window.history.replaceState({}, '', window.location.pathname);
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
        user={user}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      >
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'scan' && <QrScanner />}
        {activeTab === 'printers' && <PrinterList targetPrinterId={targetPrinterId} clearTarget={() => setTargetPrinterId(null)} />}
        {activeTab === 'inventory' && <Inventory />} 
        {activeTab === 'service' && <ServiceManagement />}
        {activeTab === 'stock' && <StockManagement user={user} />}
        {activeTab === 'qr' && <QrManagement />}
        {activeTab === 'history' && <History />}
        {activeTab === 'settings' && <Settings />}
      </Layout>
    </div>
  );
}

export default App;