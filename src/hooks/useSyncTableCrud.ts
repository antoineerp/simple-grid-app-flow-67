
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSyncTable } from './useSyncTable';

interface TableItem {
  id: string;
  date_creation?: Date;
  date_modification?: Date;
  [key: string]: any;
}

interface CrudOptions<T> {
  tableName: string;
  autoSync?: boolean;
  syncInterval?: number;
  itemFactory?: (data?: Partial<T>) => T;
}

/**
 * Hook pour manipuler une table avec des opérations CRUD et synchronisation
 */
export function useSyncTableCrud<T extends TableItem>(options: CrudOptions<T>) {
  const { tableName, autoSync = true, syncInterval = 60000 } = options;
  
  // Utiliser le hook de synchronisation de table
  const { 
    data, 
    setData, 
    isSyncing, 
    lastSynced, 
    syncFailed, 
    syncWithServer, 
    isOnline 
  } = useSyncTable<T>({
    tableName,
    autoSync,
    syncInterval
  });

  // Fonction pour créer un nouvel élément
  const createItem = useCallback((itemData: Partial<T> = {}) => {
    // Créer un objet de base avec les champs requis
    const baseItem = {
      id: uuidv4(),
      date_creation: new Date(),
      date_modification: new Date(),
      ...itemData
    };
    
    // Utiliser le factory si disponible
    let newItem: T;
    if (options.itemFactory) {
      newItem = options.itemFactory(itemData);
      // S'assurer que l'ID et les dates sont préservés
      newItem.id = baseItem.id;
      (newItem as any).date_creation = baseItem.date_creation;
      (newItem as any).date_modification = baseItem.date_modification;
    } else {
      // Utiliser une conversion explicite pour satisfaire TypeScript
      newItem = baseItem as unknown as T;
    }
    
    setData([...data, newItem]);
    return newItem;
  }, [data, options, setData]);

  // Fonction pour mettre à jour un élément
  const updateItem = useCallback((id: string, updateData: Partial<T>) => {
    const updatedData = data.map(item => 
      item.id === id 
        ? { 
            ...item, 
            ...updateData, 
            date_modification: new Date() 
          } 
        : item
    );
    
    setData(updatedData);
    return updatedData.find(item => item.id === id);
  }, [data, setData]);

  // Fonction pour supprimer un élément
  const deleteItem = useCallback((id: string) => {
    const updatedData = data.filter(item => item.id !== id);
    setData(updatedData);
  }, [data, setData]);

  // Fonction pour mettre à jour plusieurs éléments
  const updateItems = useCallback((items: T[]) => {
    // Créer un index des items existants
    const itemIndex = data.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, T>);
    
    // Mettre à jour les items existants et ajouter les nouveaux
    const updatedItems = items.map(item => {
      if (itemIndex[item.id]) {
        return {
          ...itemIndex[item.id],
          ...item,
          date_modification: new Date()
        };
      }
      
      // Pour les nouveaux éléments, assurer qu'ils ont une date de création
      return {
        ...item,
        date_creation: (item as any).date_creation || new Date(),
        date_modification: new Date()
      };
    });
    
    // Fusionner avec les items non modifiés
    const remainingItems = data.filter(item => !items.some(updatedItem => updatedItem.id === item.id));
    
    setData([...remainingItems, ...updatedItems]);
  }, [data, setData]);

  // Fonction pour importer des données (remplacer toutes les données)
  const importData = useCallback((newData: T[]) => {
    const processedData = newData.map(item => ({
      ...item,
      date_creation: (item as any).date_creation || new Date(),
      date_modification: new Date()
    }));
    
    setData(processedData);
  }, [setData]);

  return {
    data,
    isSyncing,
    lastSynced,
    syncFailed,
    isOnline,
    createItem,
    updateItem,
    deleteItem,
    updateItems,
    importData,
    syncWithServer
  };
}
