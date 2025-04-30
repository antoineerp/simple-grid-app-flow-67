
import { useState, useEffect, useCallback } from 'react';
import { getBibliothequeItems } from '@/services/bibliotheque/bibliothequeService';
import { BibliothequeItem } from '@/types/bibliotheque';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

export const useBibliotheque = () => {
  const [items, setItems] = useState<BibliothequeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { syncWithServer } = useGlobalSync();
  
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getBibliothequeItems();
      setItems(data);
      
      // Sync with server if available
      if (syncWithServer) {
        await syncWithServer(data, { tableName: 'bibliotheque' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [syncWithServer]);
  
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  
  return { items, loading, error, refreshItems: fetchItems };
};
