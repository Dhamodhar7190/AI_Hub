import { useState, useEffect, useCallback } from 'react';
import { Agent, AgentCreateRequest, AgentFilters, AgentResponse } from '../types';
import { apiService } from '../services/api';

interface UseAgentsReturn {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  loadAgents: (filters?: AgentFilters) => Promise<void>;
  createAgent: (data: AgentCreateRequest) => Promise<Agent>;
  updateAgent: (id: number, data: Partial<AgentCreateRequest>) => Promise<Agent>;
  deleteAgent: (id: number) => Promise<void>;
  approveAgent: (id: number) => Promise<Agent>;
  rejectAgent: (id: number, reason: string) => Promise<Agent>;
  refreshAgents: () => Promise<void>;
}

export const useAgents = (initialFilters?: AgentFilters): UseAgentsReturn => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<AgentFilters>(initialFilters || {});

  const loadAgents = useCallback(async (filters?: AgentFilters) => {
    setLoading(true);
    setError(null);
    
    const filtersToUse = filters || { status: 'approved' };
    if (filters) {
      setCurrentFilters(filtersToUse);
    }

    try {
      const response: any = await apiService.getAgents(filtersToUse);
      
      // Handle both array and object response formats
      if (Array.isArray(response)) {
        // Backend is returning array directly
        setAgents(response);
        setTotalCount(response.length);
      } else {
        // Backend is returning object with agents property
        setAgents(response.agents || []);
        setTotalCount(response.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load agents');
      setAgents([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAgent = useCallback(async (data: AgentCreateRequest): Promise<Agent> => {
    setError(null);
    try {
      const newAgent = await apiService.createAgent(data);
      setAgents(prev => [newAgent, ...(prev || [])]);
      setTotalCount(prev => (prev || 0) + 1);
      return newAgent;
    } catch (err: any) {
      setError(err.message || 'Failed to create agent');
      throw err;
    }
  }, []);

  const updateAgent = useCallback(async (id: number, data: Partial<AgentCreateRequest>): Promise<Agent> => {
    setError(null);
    try {
      const updatedAgent = await apiService.updateAgent(id, data);
      setAgents(prev => (prev || []).map(agent => 
        agent.id === id ? updatedAgent : agent
      ));
      return updatedAgent;
    } catch (err: any) {
      setError(err.message || 'Failed to update agent');
      throw err;
    }
  }, []);

  const deleteAgent = useCallback(async (id: number): Promise<void> => {
    setError(null);
    try {
      await apiService.deleteAgent(id);
      setAgents(prev => (prev || []).filter(agent => agent.id !== id));
      setTotalCount(prev => (prev || 0) - 1);
    } catch (err: any) {
      setError(err.message || 'Failed to delete agent');
      throw err;
    }
  }, []);

  const approveAgent = useCallback(async (id: number): Promise<Agent> => {
    setError(null);
    try {
      const approvedAgent = await apiService.approveAgent(id);
      setAgents(prev => (prev || []).map(agent => 
        agent.id === id ? approvedAgent : agent
      ));
      return approvedAgent;
    } catch (err: any) {
      setError(err.message || 'Failed to approve agent');
      throw err;
    }
  }, []);

  const rejectAgent = useCallback(async (id: number, reason: string): Promise<Agent> => {
    setError(null);
    try {
      const rejectedAgent = await apiService.rejectAgent(id, reason);
      setAgents(prev => (prev || []).map(agent => 
        agent.id === id ? rejectedAgent : agent
      ));
      return rejectedAgent;
    } catch (err: any) {
      setError(err.message || 'Failed to reject agent');
      throw err;
    }
  }, []);

  const refreshAgents = useCallback(() => loadAgents(currentFilters), [loadAgents, currentFilters]);

  // Load agents on mount
  useEffect(() => {
    loadAgents(initialFilters);
  }, []);

  return {
    agents,
    loading,
    error,
    totalCount,
    loadAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    approveAgent,
    rejectAgent,
    refreshAgents,
  };
};