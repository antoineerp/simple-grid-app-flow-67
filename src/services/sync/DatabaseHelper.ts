
import { SyncContext } from '@/features/sync/types/syncTypes';

export class DatabaseHelper {
  private syncContext: SyncContext;

  constructor(syncContext: SyncContext) {
    this.syncContext = syncContext;
  }

  // Méthode pour récupérer tous les éléments d'une table
  async getAll<T>(tableName: string): Promise<T[]> {
    try {
      console.log(`Récupération des données de la table: ${tableName}`);
      
      // Utiliser le contexte de synchronisation pour accéder au stockage
      const data = await this.syncContext.storage.getItems<T>(tableName);
      return data || [];
    } catch (error) {
      console.error(`Erreur lors de la récupération des données de ${tableName}:`, error);
      return [];
    }
  }

  // Méthode pour récupérer un élément par ID
  async getById<T extends { id: string }>(tableName: string, id: string): Promise<T | null> {
    try {
      const items = await this.getAll<T>(tableName);
      return items.find(item => item.id === id) || null;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'élément ${id} de ${tableName}:`, error);
      return null;
    }
  }

  // Méthode pour ajouter un élément
  async add<T extends { id: string }>(tableName: string, item: T): Promise<T> {
    try {
      const items = await this.getAll<T>(tableName);
      const newItems = [...items, item];
      await this.syncContext.storage.setItems(tableName, newItems);
      return item;
    } catch (error) {
      console.error(`Erreur lors de l'ajout d'un élément à ${tableName}:`, error);
      throw error;
    }
  }

  // Méthode pour mettre à jour un élément
  async update<T extends { id: string }>(tableName: string, item: T): Promise<T> {
    try {
      const items = await this.getAll<T>(tableName);
      const index = items.findIndex(i => i.id === item.id);
      if (index === -1) {
        throw new Error(`Élément avec l'ID ${item.id} non trouvé dans ${tableName}`);
      }
      const newItems = [...items];
      newItems[index] = item;
      await this.syncContext.storage.setItems(tableName, newItems);
      return item;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'élément dans ${tableName}:`, error);
      throw error;
    }
  }

  // Méthode pour supprimer un élément
  async remove<T extends { id: string }>(tableName: string, id: string): Promise<void> {
    try {
      const items = await this.getAll<T>(tableName);
      const newItems = items.filter(item => item.id !== id);
      await this.syncContext.storage.setItems(tableName, newItems);
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'élément de ${tableName}:`, error);
      throw error;
    }
  }
}
