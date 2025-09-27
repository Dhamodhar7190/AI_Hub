import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../../hooks';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    switch (true) {
      case path === '/dashboard':
        return 'Dashboard';
      case path === '/my-agents':
        return 'My Agents';
      case path === '/submit':
        return 'Submit Agent';
      case path === '/admin/review-agents':
        return 'Review Agents';
      case path === '/admin/users':
        return 'User Management';
      case path.startsWith('/admin'):
        return 'Admin Panel';
      case path === '/profile':
        return 'Profile';
      default:
        return 'FARM';
    }
  };

  // Get page description based on current route
  const getPageDescription = () => {
    const path = location.pathname;
    switch (true) {
      case path === '/dashboard':
        return 'Discover and explore AI agents';
      case path === '/my-agents':
        return 'Manage your submitted agents';
      case path === '/submit':
        return 'Share your AI agent with the community';
      case path === '/admin/review-agents':
        return 'Review and moderate agent submissions';
      case path === '/admin/users':
        return 'Manage users, approvals, and permissions';
      case path.startsWith('/admin'):
        return 'Manage users and moderate content';
      case path === '/profile':
        return 'View and edit your profile';
      default:
        return 'Welcome to FARM';
    }
  };

  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Left Section with Toggle and Title */}
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Page Title Section */}
          <div>
            <h1 className="text-2xl font-bold text-white">
              {getPageTitle()}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {getPageDescription()}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">


          {/* User Avatar */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {user?.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-white">
                {user?.username}
              </p>
              {/* <p className="text-xs text-gray-400">
                {user?.roles.includes('admin') ? 'Administrator' : 'User'}
              </p> */}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;