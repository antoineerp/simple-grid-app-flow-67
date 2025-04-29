
/**
 * Utilitaire pour déclencher une synchronisation de données depuis n'importe quel composant
 */
export const triggerSync = (tableName: string, data: any[], groups?: any[]) => {
  console.log(`triggerSync: Déclenchement de la synchronisation pour ${tableName} avec ${data.length} éléments`);
  
  // Créer et dispatcher un événement personnalisé
  const syncEvent = new CustomEvent('dataUpdate', {
    detail: {
      table: tableName,
      data,
      groups
    }
  });
  
  window.dispatchEvent(syncEvent);
};
