
import { useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { AuthState } from '@/types';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => 
    authService.getAuthState()
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setAuthState(authService.getAuthState());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleStorageChange);
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      await authService.login({ username, password });
      const newState = authService.getAuthState();
      setAuthState(newState);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('auth-changed'));
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setAuthState({ isAuthenticated: false, user: null, token: null });
    window.dispatchEvent(new CustomEvent('auth-changed'));
  };

  return {
    ...authState,
    login,
    logout,
    isAdmin: authService.isAdmin()
  };
}
