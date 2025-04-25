
import { AuthService } from './utils/AuthService';
import type { AuthHeaders, LoginResponse } from './types/auth.types';

const authService = AuthService.getInstance();

export const login = (username: string, password: string): Promise<LoginResponse> => {
  return authService.login(username, password);
};

export const logout = (): void => {
  authService.logout();
};

export const isLoggedIn = (): boolean => {
  return authService.isLoggedIn();
};

export const getCurrentUser = (): string | null => {
  return authService.getCurrentUser();
};

export const getAuthHeaders = (): AuthHeaders => {
  return authService.getAuthHeaders();
};

export const getToken = authService.getToken.bind(authService);

export const loginUser = login;
export const logoutUser = logout;
