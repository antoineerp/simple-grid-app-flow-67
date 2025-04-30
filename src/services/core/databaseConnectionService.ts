
/**
 * Service de gestion de la connexion à la base de données
 */

// Store the current user information
let currentUser: string | null = null;
let lastConnectionError: string | null = null;

/**
 * Get the currently connected user
 */
export const getCurrentUser = (): string | null => {
  if (!currentUser) {
    // Try to get from localStorage
    currentUser = localStorage.getItem('currentUser');
  }
  return currentUser;
};

/**
 * Get the current user for database connections
 */
export const getDatabaseConnectionCurrentUser = (): string | null => {
  return getCurrentUser();
};

/**
 * Set the current user
 */
export const setCurrentUser = (userId: string): void => {
  currentUser = userId;
  localStorage.setItem('currentUser', userId);
  
  // Dispatch an event so other components can react to the user change
  window.dispatchEvent(
    new CustomEvent('database-user-changed', { 
      detail: { user: userId }
    })
  );
};

/**
 * Get API base URL
 */
export const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

/**
 * Get user-specific API URL
 */
export const getUserApiUrl = (endpoint: string = ''): string => {
  const baseUrl = getApiBaseUrl();
  const user = getCurrentUser();
  return `${baseUrl}${user ? `/users/${user}` : ''}${endpoint}`;
};

/**
 * Get authentication headers for API requests
 */
export const getApiAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Initialize the database connection
 */
export const initializeDatabaseConnection = async (): Promise<boolean> => {
  try {
    // This could be expanded to actually initialize a connection
    const user = getCurrentUser();
    if (!user) {
      console.warn('No user defined for database connection');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    setLastConnectionError(error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

/**
 * Connect as a specific user
 */
export const connectAsUser = async (userId: string, password?: string): Promise<boolean> => {
  try {
    // In a real app, this would validate credentials with a server
    setCurrentUser(userId);
    return true;
  } catch (error) {
    console.error(`Failed to connect as user ${userId}:`, error);
    setLastConnectionError(error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

/**
 * Store the last connection error
 */
export const setLastConnectionError = (error: string | null): void => {
  lastConnectionError = error;
};

/**
 * Get the last connection error
 */
export const getLastConnectionError = (): string | null => {
  return lastConnectionError;
};

/**
 * Disconnect the current user
 */
export const disconnectUser = (): void => {
  currentUser = null;
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
  
  // Dispatch an event for user disconnection
  window.dispatchEvent(new Event('user-disconnected'));
};

/**
 * Test database connection
 */
export const testDatabaseConnection = async (): Promise<{success: boolean; message: string}> => {
  try {
    // This would test a real connection in a production app
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
    setLastConnectionError(errorMessage);
    return { success: false, message: errorMessage };
  }
};

/**
 * Get database information
 */
export const getDatabaseInfo = async (): Promise<Record<string, any>> => {
  try {
    // This would fetch real DB info in a production app
    return {
      server: 'MySQL',
      version: '8.0.26',
      connected: true,
      prefix: 'p71x6d_',
      tables: ['users', 'documents', 'exigences']
    };
  } catch (error) {
    console.error('Failed to get database info:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      connected: false
    };
  }
};

/**
 * Import data from a file
 */
export const importDatabaseData = async (data: any, options?: {tableName?: string}): Promise<boolean> => {
  try {
    const tableName = options?.tableName || 'unknown';
    console.log(`Importing data to ${tableName}`, data);
    
    // Store in localStorage for demo purposes
    localStorage.setItem(`imported_${tableName}`, JSON.stringify(data));
    
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
};

// Initialize user from localStorage on module load
(() => {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = savedUser;
  }
})();
