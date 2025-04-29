
/**
 * Service Worker pour gérer la synchronisation offline
 * Version: 1.0.1
 * Date: 2025-04-29
 */

const CACHE_NAME = 'qualiopi-sync-cache-v1';
const SYNC_QUEUE_NAME = 'sync-queue';

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation');
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation');
  return self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  // On laisse passer toutes les requêtes normalement
  if (event.request.method === 'GET') {
    return;
  }

  // Pour les requêtes POST (synchronisation), on les met en queue si offline
  if (event.request.method === 'POST' && !navigator.onLine) {
    // Si la requête contient 'sync' dans l'URL, on la met en queue
    if (event.request.url.includes('sync')) {
      console.log('[Service Worker] Mise en queue de synchronisation', event.request.url);
      event.respondWith(
        new Response(JSON.stringify({
          success: false,
          queued: true,
          message: 'Requête mise en queue - hors ligne'
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      // Enregistrement pour synchronisation ultérieure
      event.waitUntil(
        saveForLater(event.request.clone())
      );
      
      return;
    }
  }
});

// Enregistrement d'une requête pour synchronisation ultérieure
async function saveForLater(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const reqData = {
      url: request.url,
      method: request.method,
      headers: Array.from(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    };
    
    const key = `${SYNC_QUEUE_NAME}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await cache.put(key, new Response(JSON.stringify(reqData)));
    
    console.log('[Service Worker] Requête enregistrée pour synchronisation ultérieure:', key);
    
    return true;
  } catch (error) {
    console.error('[Service Worker] Erreur lors de l\'enregistrement pour synchronisation:', error);
    return false;
  }
}

// Événement de synchronisation (si le navigateur le supporte)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[Service Worker] Tentative de synchronisation en arrière-plan');
    event.waitUntil(syncQueuedRequests());
  }
});

// Traitement des requêtes en attente de synchronisation
async function syncQueuedRequests() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const syncKeys = keys.filter(key => key.url.includes(SYNC_QUEUE_NAME));
    
    console.log(`[Service Worker] ${syncKeys.length} requêtes à synchroniser`);
    
    for (const key of syncKeys) {
      const response = await cache.match(key);
      const reqData = await response.json();
      
      console.log('[Service Worker] Tentative de synchronisation:', reqData.url);
      
      try {
        const syncResponse = await fetch(reqData.url, {
          method: reqData.method,
          headers: new Headers(reqData.headers),
          body: reqData.body
        });
        
        if (syncResponse.ok) {
          console.log('[Service Worker] Synchronisation réussie:', reqData.url);
          await cache.delete(key);
        } else {
          console.error('[Service Worker] Échec de synchronisation:', await syncResponse.text());
        }
      } catch (fetchError) {
        console.error('[Service Worker] Erreur lors de la synchronisation:', fetchError);
      }
    }
    
    // Notification aux clients
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        timestamp: Date.now()
      });
    }
    
    return true;
  } catch (error) {
    console.error('[Service Worker] Erreur lors de la synchronisation des requêtes:', error);
    return false;
  }
}

// Écouter les messages des clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_SYNC_QUEUE') {
    event.waitUntil(
      checkSyncQueue().then(count => {
        event.source.postMessage({
          type: 'SYNC_QUEUE_STATUS',
          count,
          timestamp: Date.now()
        });
      })
    );
  } else if (event.data && event.data.type === 'TRIGGER_SYNC') {
    event.waitUntil(syncQueuedRequests());
  }
});

// Vérifier le nombre de requêtes en attente
async function checkSyncQueue() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    return keys.filter(key => key.url.includes(SYNC_QUEUE_NAME)).length;
  } catch (error) {
    console.error('[Service Worker] Erreur lors de la vérification de la file d\'attente:', error);
    return 0;
  }
}

// Rapport périodique sur l'état
setInterval(async () => {
  try {
    const count = await checkSyncQueue();
    if (count > 0) {
      console.log(`[Service Worker] ${count} requêtes en attente de synchronisation`);
    }
  } catch (error) {
    console.error('[Service Worker] Erreur lors du rapport périodique:', error);
  }
}, 60000); // Vérification toutes les minutes
