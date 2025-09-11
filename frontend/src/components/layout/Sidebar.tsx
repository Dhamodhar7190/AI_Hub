import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Grid, 
  Bot, 
  Plus, 
  CheckSquare, 
  Users, 
  User, 
  LogOut,
  Shield
} from 'lucide-react';
import { useAuth } from '../../hooks';

interface SidebarProps {
  isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isAdmin = user?.roles.includes('admin');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Grid, path: '/dashboard' },
    { id: 'my-agents', label: 'My Agents', icon: Bot, path: '/my-agents' },
    { id: 'submit', label: 'Submit Agent', icon: Plus, path: '/submit' },
    ...(isAdmin ? [
      { id: 'review-agents', label: 'Review Agents', icon: CheckSquare, path: '/admin/review-agents' },
      { id: 'user-management', label: 'User Management', icon: Users, path: '/admin/users' },
    ] : []),
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const isCurrentPath = (path: string) => {
    if (path.startsWith('/admin/')) {
      return location.pathname === path;
    }
    return location.pathname === path;
  };

  return (
    <div className={`bg-gray-900 border-r border-gray-800 h-screen ${isCollapsed ? 'w-20' : 'w-64'} fixed left-0 top-0 flex flex-col transition-all duration-300`}>
      {/* Logo/Header */}
      <div className={`${isCollapsed ? 'p-4' : 'p-6'} border-b border-gray-800`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} mb-3`}>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold text-white">🤖</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-orange-500">AI Agent Hub</h1>
            </div>
          )}
        </div>
        
        {/* User Info */}
        {!isCollapsed && (
          <div className="space-y-1">
            {/* <p className="text-sm font-medium text-white">{user?.username}</p> */}
            {/* <div className="flex items-center gap-2">
              {isAdmin && (
                <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full">
                  <Shield className="w-3 h-3" />
                  Admin
                </span>
              )}
              <span className="text-xs text-gray-400">
                {user?.roles.includes('user') && 'User'}
              </span>
            </div> */}
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isCurrentPath(item.path);
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${isCollapsed ? 'p-4' : 'p-3'} rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-lg'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon 
                    size={22} 
                    className={`transition-transform duration-200 ${
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    } ${isCollapsed ? 'text-current' : ''}`}
                  />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Logout Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${isCollapsed ? 'p-4' : 'p-3'} rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group border border-transparent hover:border-red-500/30`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut 
            size={22} 
            className={`transition-transform duration-200 group-hover:scale-105 ${isCollapsed ? 'text-current' : ''}`}
          />
          {!isCollapsed && (
            <span className="font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;