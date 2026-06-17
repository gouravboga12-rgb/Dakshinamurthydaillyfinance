import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import CustomerManagement from './pages/CustomerManagement';
import LoanManagement from './pages/LoanManagement';
import PaymentTracking from './pages/PaymentTracking';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import DelayedPayments from './pages/DelayedPayments';

export default function App() {
  // Initial state check from localStorage
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin-token'));
  const [adminName, setAdminName] = useState<string>(localStorage.getItem('admin-name') || 'Dakshinamurthy');
  const [currentPage, setCurrentPage] = useState<string>(localStorage.getItem('admin-current-page') || 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('admin-current-page', currentPage);
  }, [currentPage]);

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin-name');
    localStorage.removeItem('admin-current-page');
    setToken(null);
  };

  if (!token) {
    return (
      <Login 
        onLoginSuccess={(t, name) => {
          localStorage.setItem('admin-token', t);
          localStorage.setItem('admin-name', name || 'Dakshinamurthy');
          setToken(t);
          setAdminName(name || 'Dakshinamurthy');
        }}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard token={token} setCurrentPage={setCurrentPage} />;
      case 'customers':
        return <CustomerManagement token={token} />;
      case 'loans':
        return <LoanManagement token={token} />;
      case 'payments':
        return <PaymentTracking token={token} />;
      case 'delays':
        return <DelayedPayments token={token} />;
      case 'reports':
        return <Reports token={token} />;
      case 'settings':
        return <Settings token={token} />;
      default:
        return <Dashboard token={token} setCurrentPage={setCurrentPage} />;
    }
  };



  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar navigation */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={(page) => {
          setCurrentPage(page);
          setSidebarOpen(false); // Auto-close drawer on navigation
        }} 
        adminName={adminName} 
        onLogout={handleLogout} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={currentPage} 
          onMenuToggle={() => setSidebarOpen(true)} 
        />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
