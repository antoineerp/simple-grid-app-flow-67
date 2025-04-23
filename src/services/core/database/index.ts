
// Re-export all database services
export * from './connectionService';
export * from './infoService';
export * from './utils';
export * from './types';

// For backward compatibility - important exports
export { 
  getCurrentUser, 
  getLastConnectionError 
} from './connectionService';

// Export the connection functions for backward compatibility
export { 
  connectAsUser,
  disconnectUser,
  testDatabaseConnection,
  getDatabaseConnectionCurrentUser
} from './utils';
