
// Re-export services for easier imports
export * from './core/databaseConnectionService';
export * from './core/databaseAutoDetectService';
export * from './core/syncService';
export * from './core/userInitializationService';
export * from './core/userManager';
export * from './core/userService';

// Documents services
export * from './documents';
export * from './documents/documentService';
export * from './documents/documentStatsService';
export * from './documents/documentSyncService';
export * from './documents/documentsService';

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

// Sync services
export * from './sync';
export * from './sync/DatabaseHelper';
export * from './sync/SyncService';
export * from './sync/DataSyncManager';
export * from './sync/syncServiceImpl';
export * from './sync/triggerSync';

// User services
export * from './users/userService';
export * from './users/userManager';
export * from './users/createUserService';
export * from './users/membresService';
