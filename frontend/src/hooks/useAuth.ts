import { useState, useEffect, useContext, createContext } from 'react';
import { User, RegisterRequest, OTPResponse, UseAuthReturn, ApiError } from '../types';
import { apiService } from '../services/api';

interface AuthContextType extends UseAuthReturn {}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthState = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = apiService.getToken();
      
      if (token) {
        try {
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          apiService.clearToken();
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string): Promise<OTPResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.login({ email });
      return response;
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (email: string, otp: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.verifyOTP({
        email,
        otp_code: otp
      });

      apiService.setToken(response.access_token);
      setUser(response.user);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'OTP verification failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest): Promise<{ message: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.register(data);
      return response;
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Registration failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiService.clearToken();
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    user,
    login,
    verifyOTP,
    register,
    logout,
    clearError,
    isLoading,
    error,
  };
};