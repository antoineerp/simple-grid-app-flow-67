
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Version simplifiée qui ne fait plus de synchronisation réelle
export function useSync(tableName: string) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
  
  // Fonction factice qui retourne toujours un succès
  const syncAndProcess = async <T extends {}>(
    data: T[],
    trigger: "auto" | "manual" | "initial" = "manual"
  ) => {
    console.log(`Synchronisation désactivée pour ${tableName}`);
    return { success: true, timestamp: new Date() };
  };

  // Fonction factice qui retourne les données sans modification
  const loadData = async <T extends {}>(): Promise<T[]> => {
    console.log(`Chargement désactivé pour ${tableName}`);
    return [] as T[];
  };

  return {
    syncAndProcess,
    loadData,
    isSyncing: false,
    isOnline: true,
    lastSynced,
    syncFailed: false,
    syncError: null
  };
}
