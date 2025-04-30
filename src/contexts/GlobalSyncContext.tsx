
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Définition du type pour le contexte
interface SyncContextType {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncErrors: string[];
  triggerSync: () => Promise<void>;
  clearSyncErrors: () => void;
}

// Création du contexte avec des valeurs par défaut
const SyncContext = createContext<SyncContextType>({
  isSyncing: false,
  lastSyncTime: null,
  syncErrors: [],
  triggerSync: async () => {},
  clearSyncErrors: () => {},
});

// Hook personnalisé pour utiliser le contexte
export const useSyncContext = () => useContext(SyncContext);

// Props pour le provider
interface SyncProviderProps {
  children: ReactNode;
}

// Composant Provider qui fournira le contexte aux composants enfants
export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);

  // Fonction pour déclencher la synchronisation
  const triggerSync = async () => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      // TODO: Implémenter la logique de synchronisation réelle
      console.log('Synchronisation démarrée avec le serveur Infomaniak');
      
      // Simuler une opération de synchronisation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mettre à jour l'heure de la dernière synchronisation
      setLastSyncTime(new Date());
      
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      setSyncErrors(prev => [...prev, `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`]);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Fonction pour effacer les erreurs de synchronisation
  const clearSyncErrors = () => {
    setSyncErrors([]);
  };

  // Déclencher une synchronisation initiale au chargement
  useEffect(() => {
    // Effectuer une synchronisation automatique au démarrage
    triggerSync();
    
    // Configurer la synchronisation périodique (toutes les 15 minutes)
    const syncInterval = setInterval(() => {
      triggerSync();
    }, 15 * 60 * 1000);
    
    // Nettoyer l'intervalle au démontage du composant
    return () => clearInterval(syncInterval);
  }, []);

  return (
    <SyncContext.Provider value={{
      isSyncing,
      lastSyncTime,
      syncErrors,
      triggerSync,
      clearSyncErrors
    }}>
      {children}
    </SyncContext.Provider>
  );
};

export default SyncContext;
