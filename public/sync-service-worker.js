
// Service Worker pour la synchronisation en arrière-plan
const CACHE_NAME = 'app-sync-cache-v2';
const DB_NAME = 'appSyncDB';
const DB_VERSION = 1;
const SYNC_DELAY = 10000; // 10 secondes entre chaque tentative de synchronisation

// Liste des ressources à mettre en cache
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.ico'
];

// Stockage des tentatives de synchronisation
const syncAttempts = new Map();

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Mise en cache des ressources');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation');
  
  // Supprimer les anciens caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Intercepter les requêtes fetch
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes POST
  if (event.request.method === 'POST') {
    return;
  }
  
  // Stratégie pour les API
  if (event.request.url.includes('/api/') || event.request.url.includes('.php')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Mettre en cache la réponse
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Si offline, essayer de récupérer depuis le cache
          return caches.match(event.request);
        })
    );
  } else {
    // Stratégie pour les ressources statiques
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          return cachedResponse || fetch(event.request)
            .then(response => {
              // Mettre en cache la nouvelle ressource
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
              return response;
            })
            .catch(() => {
              // Si c'est une page HTML, retourner la page offline
              if (event.request.headers.get('Accept')?.includes('text/html')) {
                return caches.match('/offline.html');
              }
              
              // Sinon, propager l'erreur
              throw new Error('Ressource non disponible en mode hors ligne');
            });
        })
    );
  }
});

// Gérer les événements de synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Sync:', event.tag);
  
  // Traiter les différents types de synchronisation
  if (event.tag.startsWith('sync:')) {
    const syncType = event.tag.replace('sync:', '');
    const lastAttempt = syncAttempts.get(syncType) || 0;
    const now = Date.now();
    
    // Limiter la fréquence des tentatives de synchronisation
    if (now - lastAttempt < SYNC_DELAY) {
      console.log(`[Service Worker] Tentative de synchronisation trop fréquente pour ${syncType}, ignorée`);
      return;
    }
    
    syncAttempts.set(syncType, now);
    event.waitUntil(performSync(syncType));
  }
});

// Gérer les messages du client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message reçu:', event.data);
  
  if (event.data.type === 'manual_sync') {
    const syncType = event.data.syncType;
    const lastAttempt = syncAttempts.get(syncType) || 0;
    const now = Date.now();
    
    // Limiter la fréquence des tentatives de synchronisation
    if (now - lastAttempt < SYNC_DELAY) {
      console.log(`[Service Worker] Tentative de synchronisation manuelle trop fréquente pour ${syncType}, ignorée`);
      notifyClients({
        type: 'sync_throttled',
        entityType: syncType,
        message: 'Synchronisation ignorée (trop fréquente)',
        nextAttemptIn: SYNC_DELAY - (now - lastAttempt)
      });
      return;
    }
    
    syncAttempts.set(syncType, now);
    event.waitUntil(performSync(syncType));
  }
});

// Fonction pour effectuer une synchronisation
async function performSync(syncType) {
  console.log(`[Service Worker] Exécution de la synchronisation: ${syncType}`);
  
  try {
    // Récupérer les données depuis IndexedDB
    const db = await openDatabase();
    const data = await loadDataFromIndexedDB(db, syncType);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log(`[Service Worker] Aucune donnée à synchroniser pour: ${syncType}`);
      notifyClients({ 
        type: 'sync_complete',
        entityType: syncType,
        message: 'Aucune donnée à synchroniser',
        count: 0
      });
      return;
    }
    
    // Récupérer les informations d'authentification
    const authInfo = await getAuthInfo();
    
    // Envoyer les données au serveur
    const apiUrl = self.location.origin + '/api';
    const endpoint = `${apiUrl}/${syncType}-sync.php`;
    
    console.log(`[Service Worker] Envoi de la synchronisation à ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authInfo.authToken ? `Bearer ${authInfo.authToken}` : ''
      },
      body: JSON.stringify({
        userId: authInfo.userId || 'system',
        [syncType]: data
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`[Service Worker] Synchronisation réussie pour: ${syncType}`);
      notifyClients({
        type: 'sync_complete',
        entityType: syncType,
        success: true,
        count: data.length,
        message: 'Synchronisation réussie'
      });
    } else {
      throw new Error(result.message || 'Échec de la synchronisation');
    }
  } catch (error) {
    console.error(`[Service Worker] Erreur de synchronisation pour ${syncType}:`, error);
    notifyClients({
      type: 'sync_error',
      entityType: syncType,
      success: false,
      error: error.message,
      message: `Erreur: ${error.message}`
    });
  }
}

// Récupérer les informations d'authentification
async function getAuthInfo() {
  // Essayer de récupérer depuis le localStorage (via les clients)
  const clients = await self.clients.matchAll();
  
  if (clients.length > 0) {
    try {
      const response = await clients[0].postMessage({
        type: 'get_auth_info',
        requestId: Date.now()
      });
      
      if (response && response.authToken) {
        return response;
      }
    } catch (error) {
      console.error('[Service Worker] Erreur lors de la récupération des infos d\'authentification:', error);
    }
  }
  
  // Par défaut, retourner un objet vide
  return {
    userId: 'system',
    authToken: ''
  };
}

// Ouvrir la base de données IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject(new Error('Erreur d\'ouverture de la base de données'));
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Créer les object stores si nécessaire
      ['documents', 'exigences', 'membres', 'bibliotheque', 'collaboration'].forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
          console.log(`[Service Worker] Store "${storeName}" créé dans IndexedDB`);
        }
      });
    };
  });
}

// Charger les données depuis IndexedDB
function loadDataFromIndexedDB(db, storeName) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`[Service Worker] Le store "${storeName}" n'existe pas dans IndexedDB`);
      resolve([]);
      return;
    }
    
    try {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        console.error(`[Service Worker] Erreur lors de la lecture depuis "${storeName}":`, event);
        reject(new Error(`Erreur de lecture des données depuis "${storeName}"`));
      };
    } catch (error) {
      console.error(`[Service Worker] Exception lors de l'accès à "${storeName}":`, error);
      reject(error);
    }
  });
}

// Notifier tous les clients
function notifyClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}
