import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Bot, Eye, TrendingUp, Star } from 'lucide-react';
import AgentCard from '../agents/AgentCard';
import AgentModal from '../agents/AgentModal';
import Button from '../common/Button';
import { useAgents } from '../../hooks/useAgents';
import { useAuth } from '../../hooks';
import { Agent, Category, AgentFilters, AdminStats } from '../../types';
import { apiService } from '../../services/api';
import { AGENT_CATEGORIES } from '../../utils/constants';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  
  const { agents, loading, error, loadAgents } = useAgents();

  // Load categories and stats on mount
  useEffect(() => {
    loadCategories();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const adminStats = await apiService.getAdminStats();
      setStats(adminStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Load agents when filters change
  useEffect(() => {
    const filters: AgentFilters = {
      category: selectedCategory || undefined,
      search: searchTerm || undefined,
      status: 'approved', // Always show approved agents for all users
    };
    loadAgents(filters);
  }, [selectedCategory, searchTerm, loadAgents]);

  const loadCategories = async () => {
    try {
      const categoryData = await apiService.getCategories();
      setCategories(categoryData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleModalClose = () => {
    setSelectedAgent(null);
  };

  const filteredAgents = agents?.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Filters and View Toggle */}
        <div className="flex gap-3 items-center">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label} ({category.count})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          <p>{error}</p>
        </div>
      )}

      {/* Agents Grid/List */}
      {!loading && !error && (
        <>
          {filteredAgents.length > 0 ? (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => handleAgentClick(agent)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No agents found</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || selectedCategory
                  ? 'Try adjusting your search or filters'
                  : 'No agents available yet'}
              </p>
              {!searchTerm && !selectedCategory && (
                <Button
                  onClick={() => setSearchTerm('')}
                  variant="primary"
                >
                  Browse All Agents
                </Button>
              )}
            </div>
          )}
        </>
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

export default Dashboard;