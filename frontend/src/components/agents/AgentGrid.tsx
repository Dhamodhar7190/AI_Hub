import React from 'react';
import { Grid, List } from 'lucide-react';
import AgentCard from './AgentCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { Agent } from '../../types';

interface AgentGridProps {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onAgentClick: (agent: Agent) => void;
  emptyMessage?: string;
  emptyDescription?: string;
}

const AgentGrid: React.FC<AgentGridProps> = ({
  agents,
  loading,
  error,
  viewMode,
  onViewModeChange,
  onAgentClick,
  emptyMessage = "No agents found",
  emptyDescription = "Try adjusting your search or filters"
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading agents..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage message={error} variant="error" />
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {agents.length} agent{agents.length !== 1 ? 's' : ''} found
        </div>
        
        <div className="flex border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
            title="Grid View"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
            title="List View"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Agents Display */}
      {agents.length > 0 ? (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => onAgentClick(agent)}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Grid className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">{emptyMessage}</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {emptyDescription}
          </p>
        </div>
      )}

      {/* Load More Button (if needed for pagination) */}
      {agents.length > 0 && agents.length % 20 === 0 && (
        <div className="text-center pt-8">
          <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg text-white transition-colors">
            Load More Agents
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentGrid;