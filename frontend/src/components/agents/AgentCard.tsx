import React from 'react';
import { Eye, Calendar, User, ExternalLink } from 'lucide-react';
import { Agent } from '../../types';
import { AGENT_CATEGORIES, AGENT_STATUS_COLORS } from '../../utils/constants';

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
  viewMode?: 'grid' | 'list';
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick, viewMode = 'grid' }) => {
  const categoryInfo = AGENT_CATEGORIES.find(cat => cat.value === agent.category);
  const statusColor = AGENT_STATUS_COLORS[agent.status as keyof typeof AGENT_STATUS_COLORS];

  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-all duration-200 cursor-pointer hover:transform hover:scale-[1.02] group"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Agent Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {agent.name.charAt(0)}
            </div>

            {/* Agent Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-gray-300 transition-colors truncate">
                  {agent.name}
                </h3>
              </div>
              
              <p className="text-gray-300 mb-3 line-clamp-2 leading-relaxed">
                {agent.description}
              </p>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{agent.author.username}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{agent.view_count} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(agent.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Badge */}
          <div className="ml-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryInfo?.color || 'bg-gray-500'}/20 text-white border border-current`}>
              {categoryInfo?.label || agent.category}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div
      onClick={onClick}
      className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-all duration-200 cursor-pointer hover:transform hover:scale-105 group animate-fade-in"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
          {agent.name.charAt(0)}
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-gray-300 transition-colors line-clamp-1">
          {agent.name}
        </h3>
        
        <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
          {agent.description}
        </p>
        
        {/* Category */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo?.color || 'bg-gray-500'}/20 text-white`}>
            {categoryInfo?.label || agent.category}
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Eye className="w-3 h-3" />
            <span>{agent.view_count}</span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium">
            {agent.author.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-400">{agent.author.username}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar className="w-3 h-3" />
          <span>{new Date(agent.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default AgentCard;