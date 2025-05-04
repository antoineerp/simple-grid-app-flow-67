
/**
 * Hook de synchronisation complètement désactivé
 * 
 * Cette version du hook ne fait absolument rien et retourne uniquement des valeurs factices
 * pour assurer la compatibilité avec le code existant qui l'utilise.
 */

// Version entièrement neutralisée qui ne fait absolument rien
export function useSync() {
  // Retourner une interface compatible mais qui ne fait rien
  return {
    syncAndProcess: async () => ({ success: true, timestamp: new Date() }),
    loadData: async () => [],
    isSyncing: false,
    isOnline: true,
    lastSynced: new Date(),
    syncFailed: false,
    syncError: null
  };
}
