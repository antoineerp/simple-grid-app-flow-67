
/**
 * Configuration globale du système de synchronisation
 */
export const SYNC_CONFIG = {
  // Configuration WebSocket
  wsUrl: process.env.NODE_ENV === 'production' 
    ? 'wss://api.yourdomain.com/ws' 
    : 'ws://localhost:8080/ws',
  
  // Intervalles de synchronisation (en millisecondes)
  reconnectInterval: 3000,        // Tentative de reconnexion WebSocket
  backgroundSyncInterval: 60000,  // Synchronisation en arrière-plan
  
  // Configuration IndexedDB
  dbName: 'appSyncDB',
  dbVersion: 1,
  
  // Stores IndexedDB
  stores: {
    documents: 'documents',
    exigences: 'exigences',
    membres: 'membres',
    bibliotheque: 'bibliotheque',
    collaboration: 'collaboration'
  },
  
  // Configuration de l'API REST (fallback)
  apiEndpoints: {
    documents: {
      sync: 'documents-sync.php',
      load: 'documents-load.php'
    },
    exigences: {
      sync: 'exigences-sync.php',
      load: 'exigences-load.php'
    },
    membres: {
      sync: 'membres-sync.php',
      load: 'membres-load.php'
    },
    bibliotheque: {
      sync: 'bibliotheque-sync.php',
      load: 'bibliotheque-load.php'
    },
    collaboration: {
      sync: 'collaboration-sync.php',
      load: 'collaboration-load.php'
    }
  }
};
