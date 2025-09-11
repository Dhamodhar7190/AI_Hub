import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, Bot, Eye, Edit, Save, X } from 'lucide-react';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useAuth } from '../../hooks';
import { apiService } from '../../services/api';

interface UserStats {
  agents: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  engagement: {
    total_views: number;
    most_popular_agent: {
      id: number;
      name: string;
      views: number;
    } | null;
  };
  profile: {
    member_since: string;
    roles: string[];
    is_admin: boolean;
  };
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });

  useEffect(() => {
    if (user) {
      loadUserStats();
      setEditForm({
        username: user.username,
        email: user.email
      });
    }
  }, [user]);

  const loadUserStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const stats = await apiService.getUserStats();
      setUserStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    // This would typically call an API to update the user profile
    // For now, we'll just show a success message
    setIsEditing(false);
    // Note: You would need to implement the update user profile API endpoint
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      username: user?.username || '',
      email: user?.email || ''
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  const isAdmin = user.roles.includes('admin');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl">
              {user.username.charAt(0).toUpperCase()}
            </div>
            
            <div>
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="text-2xl font-bold bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                  />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="text-gray-300 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-white mb-2">{user.username}</h1>
                  <div className="flex items-center gap-4 text-gray-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex items-center gap-2 mt-3">
                {user.roles.map((role: string) => (
                  <span
                    key={role}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      role === 'admin'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {role === 'admin' && <Shield className="w-3 h-3" />}
                    {role === 'user' && <User className="w-3 h-3" />}
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSaveProfile} variant="primary" size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancelEdit} variant="ghost" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="ghost" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading statistics..." />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      ) : userStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white">{userStats.agents.total}</h3>
            <p className="text-gray-400 text-sm">Total Agents</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-green-400">{userStats.agents.approved}</h3>
            <p className="text-gray-400 text-sm">Approved Agents</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-yellow-400">{userStats.agents.pending}</h3>
            <p className="text-gray-400 text-sm">Pending Review</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-orange-400">{userStats.engagement.total_views.toLocaleString()}</h3>
            <p className="text-gray-400 text-sm">Total Views</p>
          </div>
        </div>
      ) : null}

      {/* Most Popular Agent */}
      {userStats?.engagement.most_popular_agent && (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-orange-400" />
            Most Popular Agent
          </h3>
          
          <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold">
              {userStats.engagement.most_popular_agent.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium">{userStats.engagement.most_popular_agent.name}</h4>
              <p className="text-gray-400 text-sm flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {userStats.engagement.most_popular_agent.views} views
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-6">Account Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Username</label>
              <p className="text-white font-medium">{user.username}</p>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-1">Email Address</label>
              <p className="text-white font-medium">{user.email}</p>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-1">Account Status</label>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                user.is_active
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {user.is_active ? 'Active' : 'Pending Approval'}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Member Since</label>
              <p className="text-white font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            
            {user.approved_at && (
              <div>
                <label className="block text-gray-400 text-sm mb-1">Approved On</label>
                <p className="text-white font-medium">{new Date(user.approved_at).toLocaleDateString()}</p>
              </div>
            )}
            
            <div>
              <label className="block text-gray-400 text-sm mb-1">Permissions</label>
              <div className="flex flex-wrap gap-2">
                {user.roles.map((role: string) => (
                  <span
                    key={role}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;