// Core Types
export interface User {
  id: number;
  email: string;
  username: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
  approved_at?: string;
}

export interface Agent {
  id: number;
  name: string;
  description: string;
  app_url: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  author: User;
  view_count: number;
  approved_at?: string;
}

export interface Category {
  value: string;
  label: string;
  count: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface OTPRequest {
  email: string;
  otp_code: string;
}

export interface OTPResponse {
  message: string;
  otp_code: string;
  expires_in_minutes: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Agent Types
export interface AgentCreateRequest {
  name: string;
  description: string;
  app_url: string;
  category: string;
}

export interface AgentFilters {
  category?: string;
  search?: string;
  status?: string;
  skip?: number;
  limit?: number;
  offset?: number;
}

export interface AgentResponse {
  agents: Agent[];
  total: number;
  limit: number;
  offset: number;
}

// Admin Types
export interface AdminStats {
  agents: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    recent: number;
  };
  users: {
    total: number;
    active: number;
    pending: number;
    admins: number;
    recent: number;
  };
  engagement: {
    total_views: number;
    recent_views: number;
  };
}

// UI Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  className?: string;
}

// Hook Types
export interface UseAuthReturn {
  user: User | null;
  login: (email: string) => Promise<OTPResponse>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<{ message: string }>;
  logout: () => void;
  clearError: () => void;
  isLoading: boolean;
  error: string | null;
}

export interface UseAgentsReturn {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  fetchAgents: (filters?: AgentFilters) => Promise<void>;
  createAgent: (data: AgentCreateRequest) => Promise<void>;
  getAgent: (id: number) => Promise<Agent>;
  refreshAgents: () => Promise<void>;
}

// Error Types  
export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor({ message, status, code }: { message: string; status?: number; code?: string }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}