// Add checkAuth and other necessary functions

export const getIsLoggedIn = (): boolean => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

export const checkAuth = (): boolean => {
  return getIsLoggedIn();
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export const getCurrentUser = (): string | null => {
  return localStorage.getItem('currentDatabaseUser');
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('userRole');
  localStorage.removeItem('currentDatabaseUser');
};

// Export as a complete service object
export const authService = {
  getIsLoggedIn,
  checkAuth,
  getAuthHeaders,
  getCurrentUser,
  logout,
};

// Export for backward compatibility
export default authService;
