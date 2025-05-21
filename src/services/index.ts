
// authService
export {
  getAuthHeaders,
  getToken,
  login,
  logout,
  register,
  verifyToken,
  getIsLoggedIn,
  ensureUserIdFromToken,
  getCurrentUser
} from './auth/authService';

// userService
export {
  getUser,
  updateUser,
  deleteUser,
  getAllUsers,
  createUser,
  clearUsersCache
} from './users/userService';

// documentService
export {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument
} from './documents/documentsService';

// exigenceService
export {
  getExigences,
  createExigence,
  updateExigence,
  deleteExigence
} from './exigences/exigenceService';

// membreService
export {
  getMembres,
  createMembre,
  updateMembre,
  deleteMembre
} from './membres/membreService';

// tacheService
export {
  getTaches,
  createTache,
  updateTache,
  deleteTache
} from './taches/tacheService';

// syncService - Utiliser la casse correcte
export {
  syncData,
  loadData,
  saveData,
  syncService
} from './sync/syncService';

// dataStorageService
export {
  loadDataFromStorage,
  saveDataToStorage
} from './core/dataStorageService';

// userIdValidator
export {
  validateUserId,
  withValidUserId,
  getUserStorageKey,
  getUserApiEndpoint
} from './core/userIdValidator';

// databaseConnectionService
export {
  getCurrentUser as getDatabaseCurrentUser,
  setCurrentUser,
  connectAsUser,
  disconnectUser,
  getConnectionError,
  getLastConnectionError,
  testDatabaseConnection,
  getDatabaseInfo,
  getCurrentUser as getDatabaseConnectionCurrentUser,
  isSystemUser,
  forceSafeUser
} from './core/databaseConnectionService';

// userInitializationService
export {
  adminImportFromManager
} from './core/userInitializationService';

// Types
export type { Utilisateur } from '@/types/auth';
