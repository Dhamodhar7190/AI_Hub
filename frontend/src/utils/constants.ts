// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
export const API_VERSION = '/api/v1';

// Authentication
export const TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// Agent Categories
export const AGENT_CATEGORIES = [
  { value: 'business', label: 'Business', color: 'bg-blue-500' },
  { value: 'healthcare', label: 'Healthcare', color: 'bg-green-500' },
  { value: 'finance', label: 'Finance', color: 'bg-yellow-500' },
  { value: 'supply_chain', label: 'Supply Chain', color: 'bg-purple-500' },
  { value: 'insurance', label: 'Insurance', color: 'bg-indigo-500' },
  { value: 'hr', label: 'HR', color: 'bg-pink-500' },
  { value: 'operations', label: 'Operations', color: 'bg-cyan-500' },
  { value: 'engineering', label: 'Engineering', color: 'bg-orange-500' },
] as const;

// Agent Status
export const AGENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const AGENT_STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_ADMIN_PAGE_SIZE = 50;

// Theme Colors
export const THEME_COLORS = {
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Primary orange
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#0a0a0a',
  }
};

// Navigation Menu Items
export const NAV_ITEMS = {
  USER: [
    { id: 'dashboard', label: 'Dashboard', icon: 'Grid' },
    { id: 'my-agents', label: 'My Agents', icon: 'Bot' },
    { id: 'submit', label: 'Submit Agent', icon: 'Plus' },
    { id: 'profile', label: 'Profile', icon: 'User' },
  ],
  ADMIN: [
    { id: 'dashboard', label: 'Dashboard', icon: 'Grid' },
    { id: 'my-agents', label: 'My Agents', icon: 'Bot' },
    { id: 'submit', label: 'Submit Agent', icon: 'Plus' },
    { id: 'admin', label: 'Admin Panel', icon: 'Settings' },
    { id: 'profile', label: 'Profile', icon: 'User' },
  ],
};

// Form Validation
export const VALIDATION_RULES = {
  username: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: 'Username must be 3-50 characters long and contain only letters, numbers, and underscores'
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    minLength: 8,
    message: 'Password must be at least 8 characters long'
  },
  agentName: {
    minLength: 3,
    maxLength: 100,
    message: 'Agent name must be 3-100 characters long'
  },
  agentDescription: {
    minLength: 10,
    maxLength: 1000,
    message: 'Description must be 10-1000 characters long'
  },
  agentUrl: {
    pattern: /^https?:\/\/.+/,
    message: 'Please enter a valid URL starting with http:// or https://'
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful! Please wait for admin approval.',
  AGENT_CREATED: 'Agent submitted successfully! Waiting for admin approval.',
  AGENT_APPROVED: 'Agent approved successfully!',
  AGENT_REJECTED: 'Agent rejected successfully!',
  USER_APPROVED: 'User approved successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME_PREFERENCE: 'theme_preference',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
} as const;

// Animation Durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Breakpoints (for responsive design)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;