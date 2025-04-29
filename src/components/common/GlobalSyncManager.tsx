
import React, { useState, useEffect, useRef } from 'react';
import { dataSyncManager } from '@/services/sync/DataSyncManager';
import { toast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/services/auth/authService';
import { syncService } from '@/services/sync/SyncService';

const GlobalSyncManager: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState({
    activeSyncCount: 0,
    pendingChangesCount: 0,
    failedSyncCount: 0
  });
  
  // Référence pour suivre les synchronisations déjà traitées
  const processedSyncs = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    console.log("GlobalSyncManager: Initialisation du gestionnaire de synchronisation globale");
    
    // Vérifier périodiquement l'état global de synchronisation
    const intervalId = setInterval(() => {
      try {
        const status = dataSyncManager.getGlobalSyncStatus();
        setSyncStatus({
          activeSyncCount: status.activeSyncCount,
          pendingChangesCount: status.pendingChangesCount,
          failedSyncCount: status.failedSyncCount
        });
        
        // Si des synchronisations ont échoué, afficher un toast mais pas trop souvent
        if (status.failedSyncCount > 0 && Math.random() < 0.1) {
          toast({
            title: "Synchronisation en attente",
            description: `${status.failedSyncCount} table(s) n'ont pas pu être synchronisée(s).`,
            variant: "destructive"
          });
        }
        
        // Vérifier s'il y a des données en attente à synchroniser
        checkPendingSyncData();
      } catch (error) {
        console.error("Erreur lors de la vérification du statut de synchronisation:", error);
      }
    }, 5000);
    
    // Écouter les événements de modification de données
    const handleDataUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.table) {
        const { table, data } = event.detail;
        console.log(`GlobalSyncManager: Événement de mise à jour détecté pour ${table}`);
        
        // Programmer une synchronisation pour cette table
        scheduleSyncForTable(table, data);
      }
    };
    
    // Ajouter un écouteur d'événement personnalisé
    window.addEventListener('dataUpdate', handleDataUpdate as EventListener);
    
    // Vérifier les données en attente au démarrage
    checkPendingSyncData();
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('dataUpdate', handleDataUpdate as EventListener);
    };
  }, []);
  
  // Vérifier et traiter les données en attente de synchronisation
  const checkPendingSyncData = () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;
      
      // Vérifier le localStorage pour les données non synchronisées
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('pending_sync_') && !processedSyncs.current.has(key)) {
          try {
            const pendingData = JSON.parse(localStorage.getItem(key) || '{}');
            if (pendingData.tableName && pendingData.data) {
              console.log(`GlobalSyncManager: Tentative de synchronisation des données en attente pour ${pendingData.tableName}`);
              
              // Marquer comme traité pour éviter les doublons
              processedSyncs.current.add(key);
              
              // Effectuer la synchronisation
              syncService.syncTable({
                tableName: pendingData.tableName,
                data: pendingData.data,
                groups: pendingData.groups || []
              }, currentUser, "auto")
              .then(result => {
                if (result.success) {
                  console.log(`GlobalSyncManager: Synchronisation réussie pour les données en attente de ${pendingData.tableName}`);
                  localStorage.removeItem(key);
                } else {
                  console.warn(`GlobalSyncManager: Échec de la synchronisation pour ${pendingData.tableName}:`, result.message);
                }
              })
              .catch(err => {
                console.error(`GlobalSyncManager: Erreur lors de la synchronisation pour ${pendingData.tableName}:`, err);
              })
              .finally(() => {
                // Dans tous les cas, supprimer l'entrée du set pour permettre de réessayer plus tard si nécessaire
                processedSyncs.current.delete(key);
              });
            }
          } catch (e) {
            console.error(`GlobalSyncManager: Erreur lors du traitement des données en attente pour la clé ${key}:`, e);
          }
        }
      });
    } catch (e) {
      console.error("GlobalSyncManager: Erreur lors de la vérification des données en attente:", e);
    }
  };
  
  // Programmer une synchronisation pour une table spécifique
  const scheduleSyncForTable = (tableName: string, data: any[]) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.warn("GlobalSyncManager: Aucun utilisateur connecté, impossible de synchroniser");
        return;
      }
      
      const pendingKey = `pending_sync_${tableName}_${Date.now()}`;
      
      // Sauvegarder les données en attente
      localStorage.setItem(pendingKey, JSON.stringify({
        tableName,
        data,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`GlobalSyncManager: Données enregistrées pour synchronisation ultérieure: ${tableName}`);
      
      // Tentative immédiate de synchronisation
      syncService.syncTable({
        tableName,
        data
      }, currentUser, "auto")
      .then(result => {
        if (result.success) {
          console.log(`GlobalSyncManager: Synchronisation immédiate réussie pour ${tableName}`);
          localStorage.removeItem(pendingKey);
          
          toast({
            title: "Données enregistrées",
            description: "Vos modifications ont été synchronisées avec succès",
          });
        } else {
          console.warn(`GlobalSyncManager: Échec de la synchronisation immédiate pour ${tableName}, sera réessayée ultérieurement`);
        }
      })
      .catch(err => {
        console.error(`GlobalSyncManager: Erreur lors de la synchronisation immédiate pour ${tableName}:`, err);
      });
    } catch (e) {
      console.error(`GlobalSyncManager: Erreur lors de la programmation de la synchronisation pour ${tableName}:`, e);
    }
  };
  
  return null; // Ce composant n'affiche rien, il gère uniquement la logique en arrière-plan
};

export default GlobalSyncManager;
