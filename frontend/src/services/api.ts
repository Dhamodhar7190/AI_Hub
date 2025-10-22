import {
  User,
  Agent,
  Category,
  LoginRequest,
  RegisterRequest,
  OTPRequest,
  AuthResponse,
  OTPResponse,
  AgentCreateRequest,
  AgentFilters,
  AgentResponse,
  AdminStats,
  ApiError,
  Review,
  ReviewCreateRequest,
  RatingCreateRequest,
  AgentRatingStats
} from '../types';

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = 'http://13.200.13.37:8000'; // Production server
    // this.baseUrl = 'http://localhost:8000'; // Local development
    this.token = localStorage.getItem('auth_token');
  }

  // Token management
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // HTTP request helper
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError({
          message: error.detail || error.message || `HTTP ${response.status}`,
          status: response.status
        });
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError({
        message: error instanceof Error ? error.message : 'Network error'
      });
    }
  }

  // Authentication endpoints
  async register(data: RegisterRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<OTPResponse> {
    return this.request<OTPResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyOTP(data: OTPRequest): Promise<AuthResponse> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyRegistrationOTP(data: OTPRequest): Promise<{ message: string }> {
    return this.request('/auth/verify-registration-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/auth/me');
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  // Agent endpoints
  async getAgents(filters: AgentFilters = {}): Promise<AgentResponse> {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    params.append('skip', (filters.skip || filters.offset || 0).toString());
    params.append('limit', (filters.limit || 20).toString());

    const queryString = params.toString();
    return this.request(`/agents${queryString ? `?${queryString}` : ''}`);
  }

  async getAgent(id: number): Promise<Agent> {
    return this.request(`/agents/${id}`);
  }

  async createAgent(data: AgentCreateRequest): Promise<Agent> {
    return this.request('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyAgents(): Promise<Agent[]> {
    return this.request('/agents/my/submissions');
  }

  async updateAgent(id: number, data: Partial<AgentCreateRequest>): Promise<Agent> {
    return this.request(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAgent(id: number): Promise<void> {
    return this.request(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  async approveAgent(id: number): Promise<Agent> {
    return this.request(`/admin/agents/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ approve: true }),
    });
  }

  async rejectAgent(id: number, reason: string): Promise<Agent> {
    return this.request(`/admin/agents/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ approve: false, rejection_reason: reason }),
    });
  }

  async getCategories(): Promise<Category[]> {
    return this.request('/agents/categories/list');
  }

  // User endpoints
  async getUserProfile(): Promise<User> {
    return this.request('/users/me');
  }

  async getUserAgents(): Promise<Agent[]> {
    return this.request('/users/me/agents');
  }

  async getUserStats(): Promise<any> {
    return this.request('/users/me/stats');
  }

  // Admin endpoints
  async getPendingAgents(): Promise<Agent[]> {
    return this.request('/admin/pending-agents');
  }

  async approveAgentAdmin(id: number, approve: boolean, rejection_reason?: string): Promise<{ message: string }> {
    return this.request(`/admin/agents/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ approve, rejection_reason }),
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.request('/admin/users');
  }

  async getPendingUsers(): Promise<User[]> {
    return this.request('/admin/users/pending');
  }

  async approveUser(id: number): Promise<{ message: string }> {
    return this.request(`/admin/users/${id}/approve`, {
      method: 'PATCH',
    });
  }

  async deactivateUser(id: number): Promise<{ message: string }> {
    return this.request(`/admin/users/${id}/deactivate`, {
      method: 'PATCH',
    });
  }

  async makeUserAdmin(id: number): Promise<{ message: string }> {
    return this.request(`/admin/users/${id}/make-admin`, {
      method: 'PATCH',
    });
  }

  async rejectUser(id: number): Promise<{ message: string }> {
    return this.request(`/admin/users/${id}/reject`, {
      method: 'DELETE',
    });
  }

  async getAdminStats(): Promise<AdminStats> {
    return this.request('/admin/stats');
  }

  // Agent tracking endpoints
  async trackAgentClick(
    agentId: number,
    clickType: 'modal_open' | 'new_tab' | 'external_link',
    referrer?: string
  ): Promise<{ message: string }> {
    const params = new URLSearchParams();
    params.append('click_type', clickType);
    if (referrer) params.append('referrer', referrer);

    return this.request(`/agents/${agentId}/track-click?${params.toString()}`, {
      method: 'POST',
    });
  }

  async trackAgentSession(agentId: number, durationSeconds: number): Promise<{ message: string }> {
    const params = new URLSearchParams();
    params.append('duration_seconds', durationSeconds.toString());

    return this.request(`/agents/${agentId}/track-session?${params.toString()}`, {
      method: 'POST',
    });
  }

  // Rating & Review endpoints
  async rateAgent(agentId: number, rating: number): Promise<{ message: string; rating: number; average_rating: number; total_ratings: number }> {
    return this.request(`/agents/${agentId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  }

  async getAgentRatingStats(agentId: number): Promise<AgentRatingStats> {
    return this.request(`/agents/${agentId}/rating-stats`);
  }

  async createReview(agentId: number, data: ReviewCreateRequest): Promise<Review> {
    return this.request(`/agents/${agentId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAgentReviews(agentId: number, skip: number = 0, limit: number = 20): Promise<Review[]> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());

    return this.request(`/agents/${agentId}/reviews?${params.toString()}`);
  }

  async deleteReview(agentId: number): Promise<{ message: string }> {
    return this.request(`/agents/${agentId}/review`, {
      method: 'DELETE',
    });
  }

  async markReviewHelpful(agentId: number, reviewId: number): Promise<{ message: string; helpful_count: number }> {
    return this.request(`/agents/${agentId}/reviews/${reviewId}/helpful`, {
      method: 'POST',
    });
  }
}

// Create singleton instance
export const apiService = new ApiService();