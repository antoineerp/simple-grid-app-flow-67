
// Re-export services for easier imports

// Export user types
export type { Utilisateur } from '../types/user';

// Core services exports
export * from './core/databaseConnectionService';
export * from './core/databaseAutoDetectService';
export * from './core/syncService';
export * from './core/userInitializationService';

// User services - careful with naming to avoid duplicates
export { 
  clearUsersCache,
  synchronizeUsers,
} from './users/userManager';

export {
  getDeviceId,
  getCurrentUserId as getUserServiceCurrentId
} from './core/userService';

// Documents services - avoid duplicate exports
export {
  calculateDocumentStats,
  loadDocumentsFromServer, 
  syncDocumentsWithServer
} from './documents';

// Auth services
export {
  getAuthToken,
  isAuthenticated,
  getCurrentUser,
  logout,
  getAuthHeaders,
  hasRole,
  authenticateUser,
  getCurrentUserId,
  getCurrentUserName,
  isAdmin,
  getIsLoggedIn,
  login
} from './auth/authService';

// Config services
export * from './config/appConfigService';

// Export other services as needed
export * from './membres/membresService';
export * from './bibliothequeExport';
export * from './collaborateurExport';
export * from './documentsExport';
export * from './exigencesExport';
export * from './pilotageExport';
export * from './pdfExport';
export * from './pdfManager';

// Sync services - prevent duplicate exports
export { triggerSync, triggerSyncAll } from './sync';
export * from './sync/DatabaseHelper';
export * from './sync/SyncService';
export * from './sync/DataSyncManager';
export * from './sync/syncServiceImpl';

// UserManager specific exports to avoid duplicates
export { getUtilisateurs } from './core/userManager';
