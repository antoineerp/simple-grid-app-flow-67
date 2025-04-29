
// Service Worker pour la synchronisation en arrière-plan
const CACHE_NAME = 'app-sync-cache-v1';
const DB_NAME = 'appSyncDB';
const DB_VERSION = 1;

// Liste des ressources à mettre en cache
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.ico',
  '/manifest.json'
];

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
  // Stratégie network-first pour les API
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
    // Stratégie cache-first pour les ressources statiques
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
              if (event.request.headers.get('Accept').includes('text/html')) {
                return caches.match('/offline.html');
              }
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
    event.waitUntil(performSync(syncType));
  }
});

// Gérer les messages du client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message reçu:', event.data);
  
  if (event.data.type === 'manual_sync') {
    event.waitUntil(performSync(event.data.syncType));
  }
});

// Fonction pour effectuer une synchronisation
async function performSync(syncType) {
  console.log(`[Service Worker] Exécution de la synchronisation: ${syncType}`);
  
  try {
    // Récupérer les données depuis IndexedDB
    const db = await openDatabase();
    const data = await loadDataFromIndexedDB(db, syncType);
    
    if (!data.length) {
      console.log(`[Service Worker] Aucune donnée à synchroniser pour: ${syncType}`);
      notifyClients({ 
        type: 'sync_complete',
        entityType: syncType,
        message: 'Aucune donnée à synchroniser',
        count: 0
      });
      return;
    }
    
    // Récupérer les informations d'authentification depuis les cookies
    const allCookies = document.cookie.split(';').reduce((cookies, cookie) => {
      const [name, value] = cookie.split('=').map(c => c.trim());
      cookies[name] = value;
      return cookies;
    }, {});
    
    const authToken = allCookies['authToken'] || '';
    
    // Envoyer les données au serveur
    const response = await fetch(`/api/${syncType}-sync.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : ''
      },
      body: JSON.stringify({
        userId: allCookies['userId'] || 'p71x6d_system',
        [syncType]: data
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
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
    
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(new Error(`Erreur de lecture des données depuis "${storeName}"`));
    };
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
