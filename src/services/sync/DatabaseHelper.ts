
/**
 * Classe d'aide pour la gestion de la base de données locale (IndexedDB)
 */
class DatabaseHelper {
  private dbName: string;
  private db: IDBDatabase | null = null;
  
  constructor(dbName = 'localAppData') {
    this.dbName = dbName;
  }
  
  /**
   * Initialise la base de données locale
   */
  async initDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }
      
      const request = window.indexedDB.open(this.dbName, 1);
      
      request.onerror = (event) => {
        console.error("Erreur d'ouverture de la base de données:", event);
        reject(new Error("Échec de l'initialisation de la base de données locale"));
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log("Base de données locale initialisée avec succès");
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Créer les object stores nécessaires
        if (!db.objectStoreNames.contains('syncState')) {
          db.createObjectStore('syncState', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('pendingChanges')) {
          db.createObjectStore('pendingChanges', { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('exigences')) {
          db.createObjectStore('exigences', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('bibliotheque')) {
          db.createObjectStore('bibliotheque', { keyPath: 'id' });
        }
        
        console.log("Structure de la base de données locale mise à jour");
      };
    });
  }
  
  /**
   * Récupère tous les objets d'un store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Base de données non initialisée"));
        return;
      }
      
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (error) => {
        console.error(`Erreur lors de la récupération des données du store ${storeName}:`, error);
        reject(new Error(`Erreur lors de la récupération des données: ${error}`));
      };
    });
  }
  
  /**
   * Récupère un objet par son ID
   */
  async getById<T>(storeName: string, id: string | number): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Base de données non initialisée"));
        return;
      }
      
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = (error) => {
        console.error(`Erreur lors de la récupération de l'objet ${id} du store ${storeName}:`, error);
        reject(new Error(`Erreur lors de la récupération de l'objet: ${error}`));
      };
    });
  }
  
  /**
   * Enregistre un objet dans un store
   */
  async save<T>(storeName: string, data: T): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Base de données non initialisée"));
        return;
      }
      
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => {
        resolve(data);
      };
      
      request.onerror = (error) => {
        console.error(`Erreur lors de l'enregistrement dans ${storeName}:`, error);
        reject(new Error(`Erreur lors de l'enregistrement: ${error}`));
      };
    });
  }
  
  /**
   * Supprime un objet par son ID
   */
  async delete(storeName: string, id: string | number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Base de données non initialisée"));
        return;
      }
      
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (error) => {
        console.error(`Erreur lors de la suppression de l'objet ${id} du store ${storeName}:`, error);
        reject(new Error(`Erreur lors de la suppression: ${error}`));
      };
    });
  }
  
  /**
   * Efface tous les objets d'un store
   */
  async clear(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Base de données non initialisée"));
        return;
      }
      
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (error) => {
        console.error(`Erreur lors de la suppression de tous les objets du store ${storeName}:`, error);
        reject(new Error(`Erreur lors du nettoyage du store: ${error}`));
      };
    });
  }
}

export const databaseHelper = new DatabaseHelper();
