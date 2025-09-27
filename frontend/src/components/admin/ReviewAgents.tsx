import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, Clock, User, Calendar, Eye, Bot, TrendingUp, TestTube, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { Agent, AdminStats } from '../../types';
import { apiService } from '../../services/api';
import { AGENT_CATEGORIES } from '../../utils/constants';

const ReviewAgents: React.FC = () => {
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: 'approve' | 'reject' | null }>({});
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    agentId: number | null;
    action: 'approve' | 'reject';
    agentName: string;
  }>({
    isOpen: false,
    agentId: null,
    action: 'approve',
    agentName: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load all types of agents and stats
      const [pendingAgents, approvedAgentsResponse, rejectedAgentsResponse, adminStats] = await Promise.all([
        apiService.getPendingAgents(), // Get pending agents
        apiService.getAgents({ status: 'approved' }), // Get approved agents
        apiService.getAgents({ status: 'rejected' }), // Get rejected agents
        apiService.getAdminStats()
      ]);

      // Combine all agents
      const approvedAgents = Array.isArray(approvedAgentsResponse) ? approvedAgentsResponse : approvedAgentsResponse.agents || [];
      const rejectedAgents = Array.isArray(rejectedAgentsResponse) ? rejectedAgentsResponse : rejectedAgentsResponse.agents || [];
      
      const combinedAgents = [
        ...pendingAgents,
        ...approvedAgents,
        ...rejectedAgents
      ];

      setAllAgents(combinedAgents);
      setStats(adminStats);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (agent: Agent, action: 'approve' | 'reject') => {
    setConfirmDialog({
      isOpen: true,
      agentId: agent.id,
      action,
      agentName: agent.name
    });
  };

  const testAgent = (agent: Agent) => {
    // Open the agent URL in the same tab for testing
    window.location.href = agent.app_url;
  };

  const confirmAction = async () => {
    if (!confirmDialog.agentId) return;

    const { agentId, action } = confirmDialog;
    setActionLoading(prev => ({ ...prev, [agentId]: action }));

    try {
      if (action === 'approve') {
        await apiService.approveAgentAdmin(agentId, true);
      } else {
        await apiService.approveAgentAdmin(agentId, false, 'Rejected by admin');
      }

      // Update the agent status in the list
      setAllAgents(prev => prev.map(agent =>
        agent.id === agentId
          ? { ...agent, status: action === 'approve' ? 'approved' : 'rejected' }
          : agent
      ));

      setConfirmDialog({
        isOpen: false,
        agentId: null,
        action: 'approve',
        agentName: ''
      });
    } catch (err: any) {
      setError(err.message || `Failed to ${action} agent`);
    } finally {
      setActionLoading(prev => ({ ...prev, [agentId]: null }));
    }
  };

  // Filter agents based on active tab
  const filteredAgents = allAgents.filter(agent => agent.status === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading agents for review..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
        <div className="text-center">
          <Button onClick={loadData} variant="primary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Tab Navigation */}
      <div className="flex items-center gap-4">
        <div className="flex border border-gray-700 rounded-lg overflow-hidden">
          {(['pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab} ({allAgents.filter(a => a.status === tab).length})
            </button>
          ))}
        </div>
      </div>

      {/* Agents List */}
      {filteredAgents.length > 0 ? (
        <div className="grid gap-6">
          {filteredAgents.map((agent) => {
            const categoryInfo = AGENT_CATEGORIES.find(cat => cat.value === agent.category);
            const isProcessing = actionLoading[agent.id];
            
            return (
              <div key={agent.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden hover:border-orange-500/30 transition-colors">
                {/* Agent Header */}
                <div className="p-6 border-b border-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                        {agent.name.charAt(0)}
                      </div>
                      
                      {/* Agent Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryInfo?.color || 'bg-gray-500'}/20 text-white border border-current`}>
                            {categoryInfo?.label || agent.category}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>by {agent.author.username}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Submitted {new Date(agent.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 leading-relaxed">
                          {agent.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                

                {/* Actions */}
                <div className="p-6 bg-gray-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <a
                      href={agent.app_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm font-medium">Visit Agent</span>
                    </a>
                    <span className="text-gray-600">•</span>
                    <button
                      onClick={() => testAgent(agent)}
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <TestTube className="w-4 h-4" />
                      <span className="text-sm font-medium">Test Agent</span>
                    </button>
                    <span className="text-gray-600">•</span>
                    <span className="text-sm text-gray-400">
                      URL: {agent.app_url}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {agent.status === 'pending' ? (
                      // Show approve/reject buttons for pending agents
                      <>
                        <Button
                          onClick={() => handleAction(agent, 'reject')}
                          variant="danger"
                          size="sm"
                          loading={isProcessing === 'reject'}
                          disabled={!!isProcessing}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        
                        <Button
                          onClick={() => handleAction(agent, 'approve')}
                          variant="primary"
                          size="sm"
                          loading={isProcessing === 'approve'}
                          disabled={!!isProcessing}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </>
                    ) : (
                      // Show status for approved/rejected agents
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                        agent.status === 'approved' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {agent.status === 'approved' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span className="capitalize">{agent.status}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>  
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">All Caught Up! 🎉</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            There are no pending agent submissions to review at the moment. 
            New submissions will appear here when users submit agents for approval.
          </p>
          <Button onClick={loadData} variant="ghost">
            Check for New Submissions
          </Button>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmAction}
        title={`${confirmDialog.action === 'approve' ? 'Approve' : 'Reject'} Agent`}
        message={`Are you sure you want to ${confirmDialog.action} "${confirmDialog.agentName}"?`}
        confirmText={confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
        variant={confirmDialog.action === 'approve' ? 'info' : 'danger'}
        loading={!!confirmDialog.agentId && !!actionLoading[confirmDialog.agentId]}
      />
    </div>
  );
};

export default ReviewAgents;