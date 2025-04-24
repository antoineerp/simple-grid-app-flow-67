
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { useToast } from '@/hooks/use-toast';

/**
 * Service générique de synchronisation des données
 * Permet de sauvegarder et charger des données par utilisateur
 */
export class SyncService {
  private entityName: string;
  private apiEndpoint: string;
  
  /**
   * @param entityName - Nom de l'entité (ex: "documents", "exigences", "membres")
   * @param apiEndpoint - Point d'API pour la synchronisation (ex: "DocumentsController.php")
   */
  constructor(entityName: string, apiEndpoint: string) {
    this.entityName = entityName;
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Récupère la clé de stockage pour l'utilisateur et l'entité
   */
  private getStorageKey(userId: string): string {
    return `${this.entityName}_${userId}`;
  }

  /**
   * Charge les données depuis le localStorage et tente de les récupérer du serveur
   */
  loadFromStorage<T>(userId: string, defaultItems: T[]): T[] {
    console.log(`Chargement des ${this.entityName} pour l'utilisateur: ${userId}`);
    const storageKey = this.getStorageKey(userId);
    const storedItems = localStorage.getItem(storageKey);
    
    if (storedItems) {
      console.log(`${this.entityName} trouvés pour ${userId}`);
      try {
        return JSON.parse(storedItems);
      } catch (error) {
        console.error(`Erreur lors du parsing des ${this.entityName}:`, error);
        return defaultItems;
      }
    } else {
      console.log(`Aucun ${this.entityName} existant pour ${userId}, chargement du template`);
      const defaultTemplate = localStorage.getItem(`${this.entityName}_template`) || localStorage.getItem(this.entityName);
      
      if (defaultTemplate) {
        console.log(`Utilisation du template de ${this.entityName}`);
        try {
          return JSON.parse(defaultTemplate);
        } catch (error) {
          console.error(`Erreur lors du parsing du template de ${this.entityName}:`, error);
          return defaultItems;
        }
      }
      
      console.log(`Création de ${this.entityName} par défaut`);
      return defaultItems;
    }
  }

  /**
   * Sauvegarde les données dans le localStorage et les synchronise avec le serveur
   */
  saveToStorage<T>(items: T[], userId: string): void {
    console.log(`Sauvegarde des ${this.entityName} pour l'utilisateur: ${userId}`);
    const storageKey = this.getStorageKey(userId);
    
    // Sauvegarde locale
    localStorage.setItem(storageKey, JSON.stringify(items));
    
    // Pour les admins et gestionnaires, sauvegarder aussi comme template
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin' || userRole === 'administrateur' || userRole === 'gestionnaire') {
      console.log(`Sauvegarde du template de ${this.entityName}`);
      localStorage.setItem(`${this.entityName}_template`, JSON.stringify(items));
    }
    
    // Synchroniser avec le serveur
    this.syncWithServer(items, userId)
      .then(success => {
        if (success) {
          console.log(`${this.entityName} synchronisés avec le serveur avec succès`);
        } else {
          console.warn(`Échec de la synchronisation des ${this.entityName} avec le serveur`);
        }
      })
      .catch(error => {
        console.error(`Erreur lors de la synchronisation des ${this.entityName}:`, error);
      });
    
    // Déclencher un événement pour notifier les autres composants
    window.dispatchEvent(new Event(`${this.entityName}Update`));
  }

  /**
   * Synchronise les données avec le serveur
   */
  async syncWithServer<T>(items: T[], userId: string): Promise<boolean> {
    try {
      const API_URL = getApiUrl();
      console.log(`Tentative de synchronisation des ${this.entityName} avec le serveur`, API_URL);
      
      // Préparer les données à envoyer
      const data = {
        user_id: userId,
        [this.entityName]: items
      };
      
      // Envoyer au serveur
      const response = await fetch(`${API_URL}/controllers/${this.apiEndpoint}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error(`Erreur lors de la synchronisation des ${this.entityName} avec le serveur:`, error);
      return false;
    }
  }

  /**
   * Charge les données depuis le serveur
   */
  async loadFromServer<T>(userId: string): Promise<T[] | null> {
    try {
      const API_URL = getApiUrl();
      console.log(`Tentative de chargement des ${this.entityName} depuis le serveur`);
      
      const response = await fetch(`${API_URL}/controllers/${this.apiEndpoint}?user_id=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success && result[this.entityName]) {
        return result[this.entityName];
      }
      
      return null;
    } catch (error) {
      console.error(`Erreur lors du chargement des ${this.entityName} depuis le serveur:`, error);
      return null;
    }
  }
}

/**
 * Obtient l'identifiant de l'utilisateur actuel à partir du localStorage
 */
export const getCurrentUserId = (): string => {
  const userId = localStorage.getItem('currentUser');
  const userEmail = localStorage.getItem('userEmail');
  return userId || userEmail || 'default_user';
};
