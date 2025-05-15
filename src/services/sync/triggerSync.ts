
/**
 * Déclencheurs de synchronisation
 */

export const triggerSync = async (tableName: string): Promise<boolean> => {
  try {
    // Déclencher un événement de synchronisation
    window.dispatchEvent(new CustomEvent('force-sync-required', { 
      detail: { table: tableName }
    }));
    
    console.log(`Synchronisation demandée pour ${tableName}`);
    return true;
  } catch (error) {
    console.error("Erreur lors du déclenchement de la synchronisation:", error);
    return false;
  }
};

export const triggerSyncAll = async (): Promise<boolean> => {
  try {
    // Déclencher un événement de synchronisation globale
    window.dispatchEvent(new CustomEvent('force-sync-required'));
    
    console.log("Synchronisation globale demandée");
    return true;
  } catch (error) {
    console.error("Erreur lors du déclenchement de la synchronisation globale:", error);
    return false;
  }
};
