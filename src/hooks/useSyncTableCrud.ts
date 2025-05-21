
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSyncTable } from './useSyncTable';

interface TableItem {
  id: string;
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
    const newItem = {
      id: uuidv4(),
      date_creation: new Date(),
      date_modification: new Date(),
      ...itemData
    } as T;
    
    if (options.itemFactory) {
      const factoryItem = options.itemFactory(itemData);
      Object.assign(newItem, factoryItem);
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
      return {
        ...item,
        date_creation: item.date_creation || new Date(),
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
      date_creation: item.date_creation || new Date(),
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
