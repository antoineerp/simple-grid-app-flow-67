
/**
 * Utilitaire de journalisation des erreurs de synchronisation
 */

let isInitialized = false;

export const initializeErrorLogging = () => {
  if (isInitialized) return;
  
  console.log("Initialisation du système de journalisation des erreurs de synchronisation");
  
  // Écouter les événements non gérés pour les journaliser
  window.addEventListener('unhandledrejection', (event) => {
    console.error("Erreur non gérée dans une promesse de synchronisation:", event.reason);
  });
  
  isInitialized = true;
};

export const logSyncError = (component: string, error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[SYNC ERROR] ${component}: ${errorMessage}`);
  
  // Dans un environnement de production, vous pourriez envoyer ces erreurs à un service de surveillance
  if (import.meta.env.PROD) {
    // Exemple: sendToMonitoringService('sync-error', { component, error: errorMessage });
  }
};
