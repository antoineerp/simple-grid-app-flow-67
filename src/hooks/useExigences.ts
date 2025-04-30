
import { useState, useEffect, useCallback } from 'react';
import { getExigences } from '@/services/exigences/exigencesService';
import { Exigence } from '@/types/exigences';
import { useToast } from '@/hooks/use-toast';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

export const useExigences = () => {
  const [exigences, setExigences] = useState<Exigence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { syncWithServer } = useGlobalSync();
  
  const fetchExigences = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getExigences();
      setExigences(data);
      
      // Sync with server if available
      if (syncWithServer) {
        await syncWithServer(data, { tableName: 'exigences' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des exigences';
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [syncWithServer, toast]);
  
  useEffect(() => {
    fetchExigences();
  }, [fetchExigences]);
  
  return { exigences, loading, error, refreshExigences: fetchExigences };
};
