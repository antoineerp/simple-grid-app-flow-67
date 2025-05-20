
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SyncIndicatorProps {
  isSyncing?: boolean;
  isOnline?: boolean;
  syncFailed?: boolean;
  lastSynced?: Date | null;
  onSync?: () => Promise<void>;
  showOnlyErrors?: boolean;
}

// Composant indicateur de synchronisation qui n'affiche rien par défaut
const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  isSyncing = false,
  isOnline = true,
  syncFailed = false,
  lastSynced = null,
  onSync,
  showOnlyErrors = false
}) => {
  // Si on est en mode "afficher uniquement les erreurs" et qu'il n'y a pas d'erreur,
  // ou si on est en ligne et pas en train de synchroniser, ne rien afficher
  if ((showOnlyErrors && !syncFailed) || (isOnline && !syncFailed && !isSyncing)) {
    return null;
  }
  
  // En mode production, ne rien afficher du tout
  return null;

  // Le code ci-dessous est conservé mais rendu inactif pour suivre votre demande
  /*
  return (
    <div className="hidden">
      {syncFailed && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur de synchronisation</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Les données n'ont pas pu être synchronisées avec le serveur.</p>
              </div>
              {onSync && (
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onSync()}
                      className="ml-auto"
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Synchronisation...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Réessayer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
  */
};

export default SyncIndicator;
