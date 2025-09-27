import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Shield, Calendar, Mail, Filter, Search, UserPlus, Eye, EyeOff, X, Users, TrendingUp } from 'lucide-react';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { User, AdminStats } from '../../types';
import { apiService } from '../../services/api';

const UserManagement: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<{ [key: number]: string | null }>({});
  const [showAddUser, setShowAddUser] = useState(false);
  
  // Add User Form State
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [addUserErrors, setAddUserErrors] = useState<{ [key: string]: string }>({});
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: number | null;
    action: string;
    userName: string;
  }>({
    isOpen: false,
    userId: null,
    action: '',
    userName: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [allUsersData, pendingUsersData, adminStats] = await Promise.all([
        apiService.getAllUsers(),
        apiService.getPendingUsers(),
        apiService.getAdminStats()
      ]);
      
      setAllUsers(allUsersData);
      setPendingUsers(pendingUsersData);
      setStats(adminStats);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = (user: User, action: string) => {
    setConfirmDialog({
      isOpen: true,
      userId: user.id,
      action,
      userName: user.username
    });
  };

  const confirmAction = async () => {
    if (!confirmDialog.userId) return;
    
    const { userId, action } = confirmDialog;
    setActionLoading(prev => ({ ...prev, [userId]: action }));
    
    try {
      switch (action) {
        case 'approve':
          await apiService.approveUser(userId);
          setPendingUsers(prev => prev.filter(user => user.id !== userId));
          // Refresh all users to show the newly approved user
          loadUsers();
          break;
        case 'reject':
          await apiService.rejectUser(userId);
          setPendingUsers(prev => prev.filter(user => user.id !== userId));
          // Also remove from all users if it exists there
          setAllUsers(prev => prev.filter(user => user.id !== userId));
          break;
        case 'deactivate':
          await apiService.deactivateUser(userId);
          setAllUsers(prev => prev.map(user =>
            user.id === userId ? { ...user, is_active: false } : user
          ));
          break;
        case 'make_admin':
          await apiService.makeUserAdmin(userId);
          setAllUsers(prev => prev.map(user =>
            user.id === userId ? { ...user, roles: [...user.roles, 'admin'] } : user
          ));
          break;
      }
      
      setConfirmDialog({
        isOpen: false,
        userId: null,
        action: '',
        userName: ''
      });
    } catch (err: any) {
      setError(err.message || `Failed to ${action} user`);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'approve': return 'approve';
      case 'reject': return 'reject';
      case 'deactivate': return 'deactivate';
      case 'make_admin': return 'grant admin access to';
      default: return action;
    }
  };

  const validateAddUserForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!newUser.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!newUser.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (newUser.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!newUser.password) {
      newErrors.password = 'Password is required';
    } else if (newUser.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (newUser.password !== newUser.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setAddUserErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddUserForm()) return;

    setAddUserLoading(true);
    try {
      await apiService.register({
        email: newUser.email,
        username: newUser.username,
        password: newUser.password
      });

      // Reset form
      setNewUser({ email: '', username: '', password: '', confirmPassword: '' });
      setAddUserErrors({});
      setShowAddUser(false);
      await loadUsers(); // Refresh the lists
    } catch (error: any) {
      setAddUserErrors({ general: error.message || 'Failed to add user' });
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
    if (addUserErrors[field]) {
      setAddUserErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const filteredUsers = (activeTab === 'pending' ? pendingUsers : allUsers).filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading users..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
        <div className="text-center">
          <Button onClick={loadUsers} variant="primary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Add User Form */}
      {showAddUser && (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Add New User</h3>
            <button
              onClick={() => {
                setShowAddUser(false);
                setNewUser({ email: '', username: '', password: '', confirmPassword: '' });
                setAddUserErrors({});
              }}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 font-medium">Email *</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full p-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                  addUserErrors.email ? 'border-red-500' : 'border-gray-700 focus:border-orange-500'
                }`}
                placeholder="user@example.com"
              />
              {addUserErrors.email && <p className="text-sm text-red-400 mt-1">{addUserErrors.email}</p>}
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">Username *</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`w-full p-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                  addUserErrors.username ? 'border-red-500' : 'border-gray-700 focus:border-orange-500'
                }`}
                placeholder="username"
              />
              {addUserErrors.username && <p className="text-sm text-red-400 mt-1">{addUserErrors.username}</p>}
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newUser.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full p-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors pr-10 ${
                    addUserErrors.password ? 'border-red-500' : 'border-gray-700 focus:border-orange-500'
                  }`}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {addUserErrors.password && <p className="text-sm text-red-400 mt-1">{addUserErrors.password}</p>}
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">Confirm Password *</label>
              <input
                type="password"
                value={newUser.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full p-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                  addUserErrors.confirmPassword ? 'border-red-500' : 'border-gray-700 focus:border-orange-500'
                }`}
                placeholder="Confirm password"
              />
              {addUserErrors.confirmPassword && <p className="text-sm text-red-400 mt-1">{addUserErrors.confirmPassword}</p>}
            </div>

            {addUserErrors.general && (
              <div className="md:col-span-2">
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {addUserErrors.general}
                </p>
              </div>
            )}

            <div className="md:col-span-2 flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowAddUser(false);
                  setNewUser({ email: '', username: '', password: '', confirmPassword: '' });
                  setAddUserErrors({});
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={addUserLoading}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-4">
        <div className="flex border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Pending Approval ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            All Users ({allUsers.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-colors"
          />
        </div>

        <Button
          onClick={() => setShowAddUser(!showAddUser)}
          variant="primary"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Users List */}
      {filteredUsers.length > 0 ? (
        <div className="space-y-4">
          {filteredUsers.map((user) => {
            const isProcessing = actionLoading[user.id];
            const isAdmin = user.roles.includes('admin');
            
            return (
              <div key={user.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-orange-500/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* User Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">{user.username}</h3>
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                        {!user.is_active && (
                          <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!user.is_active ? (
                      // Pending user actions
                      <>
                        <Button
                          onClick={() => handleUserAction(user, 'reject')}
                          variant="danger"
                          size="sm"
                          loading={isProcessing === 'reject'}
                          disabled={!!isProcessing}
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleUserAction(user, 'approve')}
                          variant="primary"
                          size="sm"
                          loading={isProcessing === 'approve'}
                          disabled={!!isProcessing}
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </>
                    ) : (
                      // Active user actions
                      <>
                        {!isAdmin && (
                          <Button
                            onClick={() => handleUserAction(user, 'make_admin')}
                            variant="ghost"
                            size="sm"
                            loading={isProcessing === 'make_admin'}
                            disabled={!!isProcessing}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Make Admin
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => handleUserAction(user, 'deactivate')}
                          variant="danger"
                          size="sm"
                          loading={isProcessing === 'deactivate'}
                          disabled={!!isProcessing}
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Deactivate
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No {activeTab} users found
          </h3>
          <p className="text-gray-400 mb-4">
            {searchTerm 
              ? `No users match your search term "${searchTerm}"`
              : activeTab === 'pending'
                ? "There are no pending user registrations"
                : "No users found"
            }
          </p>
          {searchTerm && (
            <Button onClick={() => setSearchTerm('')} variant="ghost">
              Clear Search
            </Button>
          )}
        </div>
      )}  
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmAction}
        title={`User Action Confirmation`}
        message={`Are you sure you want to ${getActionText(confirmDialog.action)} "${confirmDialog.userName}"?`}
        confirmText="Confirm"
        variant={confirmDialog.action === 'deactivate' || confirmDialog.action === 'reject' ? 'danger' : 'info'}
        loading={!!confirmDialog.userId && !!actionLoading[confirmDialog.userId]}
      />
    </div>
  );
};

export default UserManagement;