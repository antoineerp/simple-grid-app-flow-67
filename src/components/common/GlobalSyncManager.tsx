
import React, { useEffect, useState } from 'react';
import { useInterval } from '@/hooks/useInterval';
import { useToast } from '@/hooks/use-toast';
import { dataSyncManager } from '@/services/sync/DataSyncManager';
import { getCurrentUser } from '@/services/auth/authService';
import { databaseHelper } from '@/services/sync/DatabaseHelper';

/**
 * Composant global qui gère la synchronisation des données
 * et l'initialisation des tables en arrière-plan
 */
const GlobalSyncManager: React.FC = () => {
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);
  
  // Vérifier et mettre à jour la structure de la base de données au démarrage
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const currentUser = getCurrentUser();
        
        if (currentUser?.identifiant_technique) {
          console.log("GlobalSyncManager: Vérification de la structure de la base de données");
          
          const result = await databaseHelper.updateDatabaseStructure(
            currentUser.identifiant_technique,
            false
          );
          
          if (result.success) {
            setInitialized(true);
            console.log("GlobalSyncManager: Structure de base de données initialisée avec succès");
          } else {
            console.warn("GlobalSyncManager: Problème lors de l'initialisation de la structure:", result.message);
          }
        }
      } catch (error) {
        console.error("GlobalSyncManager: Erreur lors de l'initialisation de la base de données:", error);
      }
    };
    
    initializeDatabase();
  }, []);
  
  // Synchroniser les données pendantes toutes les 5 minutes
  useInterval(() => {
    const syncPending = async () => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) return;
        
        const status = dataSyncManager.getGlobalSyncStatus();
        
        // Ne synchroniser que s'il y a des changements en attente et qu'aucune synchronisation n'est en cours
        if (status.pendingChangesCount > 0 && status.activeSyncCount === 0) {
          console.log("GlobalSyncManager: Synchronisation des données pendantes...");
          
          const result = await dataSyncManager.syncAllPending();
          
          if (result.success) {
            console.log("GlobalSyncManager: Toutes les données ont été synchronisées avec succès");
          } else {
            console.warn("GlobalSyncManager: Certaines données n'ont pas pu être synchronisées");
          }
        }
      } catch (error) {
        console.error("GlobalSyncManager: Erreur lors de la synchronisation:", error);
      }
    };
    
    syncPending();
  }, 300000); // 5 minutes
  
  return null; // Ce composant ne rend rien visuellement
};

export default GlobalSyncManager;
