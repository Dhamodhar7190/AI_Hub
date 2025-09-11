import { useState, useEffect } from 'react';
import { Agent, AgentFilters, AgentCreateRequest, UseAgentsReturn, ApiError } from '../types';
import { apiService } from '../services/api';

export const useAgents = (initialFilters: AgentFilters = {}): UseAgentsReturn => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async (filters: AgentFilters = initialFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAgents(filters);
      setAgents(response.agents);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch agents';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (data: AgentCreateRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const newAgent = await apiService.createAgent(data);
      // Add the new agent to the list if it matches current filters
      setAgents(prev => [newAgent, ...(prev || [])]);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to create agent';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAgent = async (id: number): Promise<Agent> => {
    setLoading(true);
    setError(null);
    
    try {
      const agent = await apiService.getAgent(id);
      return agent;
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to fetch agent';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshAgents = async () => {
    await fetchAgents();
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchAgents(initialFilters);
  }, []);

  return {
    agents,
    loading,
    error,
    fetchAgents,
    createAgent,
    getAgent,
    refreshAgents,
  };
};