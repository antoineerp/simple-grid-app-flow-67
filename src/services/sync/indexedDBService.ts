
import { SYNC_CONFIG } from './syncConfig';

/**
 * Service pour interagir avec IndexedDB
 */
class IndexedDBService {
  private db: IDBDatabase | null = null;
  
  /**
   * Initialise la base de données IndexedDB
   */
  async initDatabase(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(SYNC_CONFIG.dbName, SYNC_CONFIG.dbVersion);
        
        request.onerror = (event) => {
          console.error('Erreur d\'ouverture d\'IndexedDB:', event);
          reject(false);
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Créer les stores pour chaque type de données
          Object.values(SYNC_CONFIG.stores).forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'id' });
              console.log(`Store "${storeName}" créé dans IndexedDB`);
            }
          });
        };
        
        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          console.log('IndexedDB initialisé avec succès');
          resolve(true);
        };
      } catch (error) {
        console.error('Erreur lors de l\'initialisation d\'IndexedDB:', error);
        reject(false);
      }
    });
  }
  
  /**
   * Sauvegarde des données dans un store spécifique
   */
  async saveData<T extends { id: string }>(storeName: string, data: T[]): Promise<boolean> {
    if (!this.db) {
      console.error('Base de données non initialisée');
      return false;
    }
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Supprimer les anciennes données
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = () => {
          // Ajouter les nouvelles données
          data.forEach(item => {
            store.add(item);
          });
        };
        
        transaction.oncomplete = () => {
          console.log(`${data.length} éléments sauvegardés dans "${storeName}"`);
          resolve(true);
        };
        
        transaction.onerror = (event) => {
          console.error(`Erreur lors de la sauvegarde dans "${storeName}":`, event);
          resolve(false);
        };
      } catch (error) {
        console.error(`Erreur lors de la sauvegarde dans "${storeName}":`, error);
        resolve(false);
      }
    });
  }
  
  /**
   * Charge les données depuis un store spécifique
   */
  async loadData<T>(storeName: string): Promise<T[]> {
    if (!this.db) {
      console.error('Base de données non initialisée');
      return [];
    }
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => {
          const data = request.result as T[];
          console.log(`${data.length} éléments chargés depuis "${storeName}"`);
          resolve(data);
        };
        
        request.onerror = (event) => {
          console.error(`Erreur lors du chargement depuis "${storeName}":`, event);
          resolve([]);
        };
      } catch (error) {
        console.error(`Erreur lors du chargement depuis "${storeName}":`, error);
        resolve([]);
      }
    });
  }
  
  /**
   * Vérifie si des données existent dans le store
   */
  async hasData(storeName: string): Promise<boolean> {
    if (!this.db) {
      return false;
    }
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const countRequest = store.count();
        
        countRequest.onsuccess = () => {
          resolve(countRequest.result > 0);
        };
        
        countRequest.onerror = () => {
          resolve(false);
        };
      } catch (error) {
        console.error(`Erreur lors de la vérification des données dans "${storeName}":`, error);
        resolve(false);
      }
    });
  }
  
  /**
   * Ferme la connexion à la base de données
   */
  closeDatabase(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Connexion IndexedDB fermée');
    }
  }
}

// Exporter une instance singleton
export const indexedDBService = new IndexedDBService();
