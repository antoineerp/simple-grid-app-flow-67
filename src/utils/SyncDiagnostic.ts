
/**
 * Utilitaire de diagnostic pour la synchronisation
 * Fournit des outils pour vérifier l'état de la synchronisation dans l'application
 */

import { toast } from '@/components/ui/use-toast';

export const SyncDiagnostic = {
  /**
   * Vérifier si la synchronisation est active et fonctionnelle
   */
  checkSyncStatus: () => {
    console.log("=== DIAGNOSTIC DE SYNCHRONISATION ===");
    
    // Vérifier les indicateurs de synchronisation en attente
    const pendingKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sync_pending_') || key.startsWith('pending_sync_')
    );
    
    console.log("Synchronisations en attente:", pendingKeys);
    
    // Vérifier les tables en cours de synchronisation
    const tablesInProgress = Object.keys(localStorage).filter(key => 
      key.startsWith('sync_in_progress_')
    ).map(key => key.replace('sync_in_progress_', ''));
    
    console.log("Tables en cours de synchronisation:", tablesInProgress);
    
    // Récupérer les états de synchronisation stockés
    const syncStates = Object.keys(localStorage).filter(key => 
      key.startsWith('sync_states_')
    ).map(key => {
      try {
        return {
          key: key,
          value: JSON.parse(localStorage.getItem(key) || '{}')
        };
      } catch (e) {
        return {
          key: key,
          value: "Erreur de parsing JSON"
        };
      }
    });
    
    console.log("États de synchronisation:", syncStates);
    
    // Récupérer les données stockées par table
    const tableData = {};
    const tables = ['documents', 'exigences', 'membres', 'bibliotheque', 'collaboration', 'test_table'];
    
    tables.forEach(table => {
      const tableKeys = Object.keys(localStorage).filter(key => 
        key.startsWith(`${table}_`) || key === table
      );
      
      tableKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '[]');
          if (!tableData[table]) tableData[table] = {};
          tableData[table][key] = {
            count: Array.isArray(data) ? data.length : 'Non-tableau',
            sample: Array.isArray(data) && data.length > 0 ? data[0] : null
          };
        } catch (e) {
          if (!tableData[table]) tableData[table] = {};
          tableData[table][key] = {
            error: "Erreur de parsing JSON",
            raw: localStorage.getItem(key)?.substring(0, 100) + '...'
          };
        }
      });
    });
    
    console.log("Données par table:", tableData);
    
    // Afficher un rapport
    toast({
      title: "Diagnostic de synchronisation terminé",
      description: `${pendingKeys.length} synchronisations en attente, ${tablesInProgress.length} tables en cours de synchronisation. Voir les détails dans la console.`,
      duration: 5000,
    });
    
    return {
      pendingSync: pendingKeys,
      inProgressSync: tablesInProgress,
      syncStates: syncStates,
      tableData: tableData
    };
  },
  
  /**
   * Réparer les synchronisations bloquées
   */
  repairBlockedSyncs: () => {
    // Supprimer les indicateurs de synchronisation en cours
    const tablesInProgress = Object.keys(localStorage).filter(key => 
      key.startsWith('sync_in_progress_')
    );
    
    tablesInProgress.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Réparation terminée: ${tablesInProgress.length} synchronisations bloquées ont été réinitialisées.`);
    
    toast({
      title: "Réparation terminée",
      description: `${tablesInProgress.length} synchronisations bloquées ont été réinitialisées.`,
    });
    
    return tablesInProgress.length;
  },
  
  /**
   * Forcer la synchronisation de toutes les tables
   */
  forceFullSync: async () => {
    try {
      const event = new CustomEvent('forceSync', {
        detail: {
          timestamp: new Date().toISOString()
        }
      });
      
      window.dispatchEvent(event);
      
      console.log("Signal de synchronisation forcée envoyé");
      
      toast({
        title: "Synchronisation forcée",
        description: "Un signal de synchronisation forcée a été envoyé à l'application.",
      });
      
      return true;
    } catch (e) {
      console.error("Erreur lors de la synchronisation forcée:", e);
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "La synchronisation forcée a échoué.",
      });
      
      return false;
    }
  },
  
  /**
   * Vérifier l'état d'une table spécifique
   */
  checkTableStatus: (tableName: string) => {
    console.log(`=== DIAGNOSTIC DE LA TABLE ${tableName} ===`);
    
    // Récupérer les données stockées pour cette table
    const tableKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(`${tableName}_`) || key === tableName || 
      key.startsWith(`sync_pending_${tableName}`) || key.startsWith(`pending_sync_${tableName}`)
    );
    
    const tableData = {};
    
    tableKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        tableData[key] = {
          type: typeof data,
          isArray: Array.isArray(data),
          count: Array.isArray(data) ? data.length : 'Non-tableau',
          sample: Array.isArray(data) && data.length > 0 ? data[0] : data
        };
      } catch (e) {
        tableData[key] = {
          error: "Erreur de parsing JSON",
          raw: localStorage.getItem(key)?.substring(0, 100) + '...'
        };
      }
    });
    
    console.log(`Données pour la table ${tableName}:`, tableData);
    
    // Vérifier si la table est en cours de synchronisation
    const isInSync = localStorage.getItem(`sync_in_progress_${tableName}`) === 'true';
    console.log(`La table ${tableName} est-elle en cours de synchronisation? ${isInSync}`);
    
    return {
      tableData: tableData,
      isInSync: isInSync,
      keyCount: tableKeys.length
    };
  }
};

export default SyncDiagnostic;
