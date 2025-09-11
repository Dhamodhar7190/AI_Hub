import React from 'react';
import { Search, Filter, X, TrendingUp, Calendar, Eye, Star } from 'lucide-react';
import { Category, AgentFilters as AgentFiltersType } from '../../types';
import { AGENT_CATEGORIES } from '../../utils/constants';

interface AgentFiltersProps {
  filters: AgentFiltersType;
  onFiltersChange: (filters: AgentFiltersType) => void;
  categories: Category[];
  showStatusFilter?: boolean;
  showSortOptions?: boolean;
  className?: string;
}

const AgentFilters: React.FC<AgentFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  showStatusFilter = false,
  showSortOptions = true,
  className = ''
}) => {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined });
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category: category || undefined });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: status || undefined });
  };

  const handleSortChange = (sort: string) => {
    // This would be used if you implement sorting
    // onFiltersChange({ ...filters, sort: sort || undefined });
  };

  const clearFilters = () => {
    onFiltersChange({
      skip: 0,
      limit: filters.limit || 20
    });
  };

  const hasActiveFilters = filters.search || filters.category || filters.status;

  const sortOptions = [
    { value: '', label: 'Relevance', icon: Star },
    { value: 'views_desc', label: 'Most Popular', icon: Eye },
    { value: 'created_desc', label: 'Newest', icon: Calendar },
    { value: 'views_asc', label: 'Trending Up', icon: TrendingUp },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search agents by name or description..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-colors"
        />
        {filters.search && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filters.category || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none min-w-[150px]"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label} ({category.count})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter (for admin/user's own agents) */}
        {showStatusFilter && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Status:</span>
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}

        {/* Sort Options */}
        {showSortOptions && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Quick Category Pills */}
      <div className="flex flex-wrap gap-2">
        {AGENT_CATEGORIES.slice(0, 6).map((category) => {
          const isActive = filters.category === category.value;
          const categoryData = categories.find(c => c.value === category.value);
          
          return (
            <button
              key={category.value}
              onClick={() => handleCategoryChange(isActive ? '' : category.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive
                  ? `${category.color} text-white shadow-lg scale-105`
                  : `${category.color}/20 text-gray-300 hover:${category.color}/30 hover:text-white`
              }`}
            >
              {category.label}
              {categoryData && categoryData.count > 0 && (
                <span className="ml-1 opacity-70">({categoryData.count})</span>
              )}
            </button>
          );
        })}
        
        {AGENT_CATEGORIES.length > 6 && (
          <button
            onClick={() => {/* Could open a modal with all categories */}}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
          >
            +{AGENT_CATEGORIES.length - 6} more
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Active filters:</span>
          {filters.search && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
              Search: "{filters.search}"
            </span>
          )}
          {filters.category && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
              Category: {AGENT_CATEGORIES.find(c => c.value === filters.category)?.label}
            </span>
          )}
          {filters.status && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
              Status: {filters.status}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentFilters;