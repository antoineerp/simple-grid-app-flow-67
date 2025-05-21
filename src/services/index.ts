
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
  getCurrentUser as getAuthCurrentUser
} from './auth/authService';

// userService
export {
  getUser,
  updateUser,
  deleteUser,
  getAllUsers,
  createUser
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

// syncService
export {
  syncData,
  loadData,
  saveData
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
  getCurrentUser,
  setCurrentUser,
  connectAsUser,
  isSystemUser,
  forceSafeUser,
  getLastConnectionError,
  disconnectUser,
  testDatabaseConnection,
  getDatabaseInfo,
  getDatabaseConnectionCurrentUser,
  Utilisateur
} from './core/databaseConnectionService';

// userInitializationService
export {
  adminImportFromManager
} from './core/userInitializationService';
