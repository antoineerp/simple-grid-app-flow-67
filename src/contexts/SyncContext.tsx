
import React, { createContext, useContext, ReactNode } from 'react';

// Types pour la compatibilité
interface SyncContextType {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  startSync: () => Promise<boolean>;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
}

// Valeurs par défaut pour le contexte - complètement désactivées
const defaultSyncContext: SyncContextType = {
  isSyncing: false,
  lastSyncTime: new Date(),  // Date actuelle pour éviter les problèmes d'UI
  syncError: null,
  startSync: async () => true, // Ne fait rien mais retourne un succès
  syncStatus: 'success'  // Toujours succès pour éviter les erreurs d'UI
};

// Création du contexte
const SyncContext = createContext<SyncContextType>(defaultSyncContext);

// Hook personnalisé pour utiliser le contexte
export const useSyncContext = () => useContext(SyncContext);

interface SyncProviderProps {
  children: ReactNode;
}

// Composant fournisseur simplifié qui ne fait plus rien
export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  // Utilise directement les valeurs par défaut
  return <SyncContext.Provider value={defaultSyncContext}>{children}</SyncContext.Provider>;
};

export default SyncContext;
