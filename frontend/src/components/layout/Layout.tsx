import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} />
      
      {/* Main Content Area */}
      <div className={`${isSidebarCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-h-screen transition-all duration-300`}>
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
        
        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-black to-orange-600/5" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-orange-500/3 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-orange-600/3 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
    </div>
  );
};

export default Layout;