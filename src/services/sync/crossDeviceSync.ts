
/**
 * Service de synchronisation entre appareils
 * Ce service permet d'assurer la cohérence des données entre différents appareils
 */

import { getCurrentUser } from '@/services/core/databaseConnectionService';

// Générer un identifiant unique pour cet appareil
const generateDeviceId = (): string => {
  const storedDeviceId = localStorage.getItem('device_id');
  
  if (storedDeviceId) {
    return storedDeviceId;
  }
  
  // Créer un nouvel identifiant
  const newDeviceId = `device_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  localStorage.setItem('device_id', newDeviceId);
  
  return newDeviceId;
};

// ID unique pour cet appareil
const DEVICE_ID = generateDeviceId();

// Enregistrer un événement de synchronisation
export const registerSyncEvent = (
  tableName: string,
  action: 'create' | 'update' | 'delete' | 'load' | 'test',
  metadata?: any
) => {
  try {
    const userId = getCurrentUser();
    const timestamp = new Date().toISOString();
    const eventKey = `sync_event_${tableName}_${timestamp}`;
    
    // Stocker l'événement dans localStorage
    const syncEvent = {
      tableName,
      action,
      userId,
      deviceId: DEVICE_ID,
      timestamp,
      metadata
    };
    
    localStorage.setItem(eventKey, JSON.stringify(syncEvent));
    console.log(`CrossDeviceSync: Événement enregistré - ${action} sur ${tableName}`);
    
    // Diffuser un événement pour informer les autres onglets/fenêtres
    window.dispatchEvent(new StorageEvent('storage', {
      key: eventKey,
      newValue: JSON.stringify(syncEvent)
    }));
    
    // Déclencher un événement personnalisé
    window.dispatchEvent(new CustomEvent('cross-device-sync', { detail: syncEvent }));
    
    // Nettoyer les anciens événements
    cleanupOldEvents();
    
    return true;
  } catch (error) {
    console.error('CrossDeviceSync: Erreur lors de l\'enregistrement de l\'événement', error);
    return false;
  }
};

// Nettoyer les anciens événements (plus vieux que 24h)
const cleanupOldEvents = () => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sync_event_')) {
        try {
          const event = JSON.parse(localStorage.getItem(key) || '{}');
          const eventDate = new Date(event.timestamp);
          
          if (eventDate < oneDayAgo) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Ignorer les erreurs de parsing
        }
      }
    });
  } catch (error) {
    console.error('CrossDeviceSync: Erreur lors du nettoyage des anciens événements', error);
  }
};

// Initialiser le service
export const initCrossDeviceSync = () => {
  // Enregistrer l'appareil actif
  localStorage.setItem('active_device', DEVICE_ID);
  localStorage.setItem('last_active', new Date().toISOString());
  
  // Mettre à jour la dernière activité périodiquement
  setInterval(() => {
    localStorage.setItem('last_active', new Date().toISOString());
  }, 60000); // Toutes les minutes
  
  // Diffuser un événement d'initialisation
  window.dispatchEvent(new CustomEvent('cross-device-init', {
    detail: {
      deviceId: DEVICE_ID,
      timestamp: new Date().toISOString(),
      userId: getCurrentUser()
    }
  }));
  
  console.log(`CrossDeviceSync: Service initialisé pour l'appareil ${DEVICE_ID}`);
  
  return {
    deviceId: DEVICE_ID
  };
};

// Vérifier si un autre appareil a modifié des données
export const checkRemoteChanges = async (tableName: string): Promise<boolean> => {
  try {
    // Vérifier les événements récents pour cette table
    const events = Object.keys(localStorage)
      .filter(key => key.startsWith(`sync_event_${tableName}_`))
      .map(key => {
        try {
          return JSON.parse(localStorage.getItem(key) || '{}');
        } catch (e) {
          return null;
        }
      })
      .filter(event => event && event.deviceId !== DEVICE_ID) // Filtrer les événements d'autres appareils
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Plus récent d'abord
    
    return events.length > 0;
  } catch (error) {
    console.error('CrossDeviceSync: Erreur lors de la vérification des changements distants', error);
    return false;
  }
};

// Surveiller les événements de synchronisation
export const listenToSyncEvents = (
  callback: (event: any) => void
) => {
  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key && event.key.startsWith('sync_event_')) {
      try {
        const syncEvent = JSON.parse(event.newValue || '{}');
        if (syncEvent.deviceId !== DEVICE_ID) {
          callback(syncEvent);
        }
      } catch (e) {
        console.error('CrossDeviceSync: Erreur lors du traitement de l\'événement', e);
      }
    }
  };
  
  const handleCustomEvent = (event: CustomEvent) => {
    if (event.detail && event.detail.deviceId !== DEVICE_ID) {
      callback(event.detail);
    }
  };
  
  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener('cross-device-sync' as any, handleCustomEvent as EventListener);
  
  return () => {
    window.removeEventListener('storage', handleStorageEvent);
    window.removeEventListener('cross-device-sync' as any, handleCustomEvent as EventListener);
  };
};

// Initialiser le service
initCrossDeviceSync();

export default {
  registerSyncEvent,
  checkRemoteChanges,
  listenToSyncEvents,
  deviceId: DEVICE_ID
};
