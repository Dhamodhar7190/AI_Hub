import React, { useState, useEffect } from 'react';
import { Plus, Bot, Eye, Calendar, Filter, MoreVertical, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import AgentCard from '../agents/AgentCard';
import AgentModal from '../agents/AgentModal';
import { Agent } from '../../types';
import { apiService } from '../../services/api';
import { AGENT_STATUS_COLORS } from '../../utils/constants';

const MyAgents: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadMyAgents();
  }, []);

  const loadMyAgents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const myAgents = await apiService.getUserAgents();
      setAgents(myAgents);
    } catch (err: any) {
      setError(err.message || 'Failed to load your agents');
    } finally {
      setLoading(false);
    }
  };

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleModalClose = () => {
    setSelectedAgent(null);
  };

  const filteredAgents = agents.filter(agent => {
    if (statusFilter === 'all') return true;
    return agent.status === statusFilter;
  });

  const getStatsForStatus = (status: string) => {
    return agents.filter(agent => agent.status === status).length;
  };

  const totalViews = agents.reduce((sum, agent) => sum + agent.view_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-400">{error}</p>
          <Button onClick={loadMyAgents} variant="primary" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button onClick={() => navigate('/submit')} variant="primary">
          <Plus className="w-5 h-5 mr-2" />
          Submit New Agent
        </Button>
      </div>


      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-400">Filter by status:</span>
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                statusFilter === status
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 px-2 py-0.5 bg-current/20 rounded-full text-xs">
                  {getStatsForStatus(status)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      {filteredAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div key={agent.id} className="relative">
              <AgentCard
                agent={agent}
                onClick={() => handleAgentClick(agent)}
                viewMode="grid"
              />
              
              {/* Status Indicator */}
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                  AGENT_STATUS_COLORS[agent.status as keyof typeof AGENT_STATUS_COLORS]
                }`}>
                  {agent.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          {statusFilter === 'all' ? (
            <div>
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No agents submitted yet</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Start by submitting your first AI agent to share it with the community and get valuable feedback.
              </p>
              <Button onClick={() => navigate('/submit')} variant="primary">
                <Plus className="w-5 h-5 mr-2" />
                Submit Your First Agent
              </Button>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                No {statusFilter} agents found
              </h3>
              <p className="text-gray-400 mb-4">
                You don't have any agents with "{statusFilter}" status.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setStatusFilter('all')} variant="ghost">
                  View All Agents
                </Button>
                <Button onClick={() => navigate('/submit')} variant="primary">
                  Submit New Agent
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Agent Modal */}
      {selectedAgent && (
        <AgentModal
          agent={selectedAgent}
          isOpen={!!selectedAgent}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default MyAgents;