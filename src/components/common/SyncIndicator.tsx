
import React from 'react';
import { RefreshCw, Cloud, CloudOff, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface SyncIndicatorProps {
  isSyncing: boolean;
  isOnline: boolean;
  syncFailed: boolean;
  lastSynced: Date | null;
  onSync?: () => void;  // Fonction optionnelle pour déclencher une sync manuelle
  showOnlyErrors?: boolean; // Si true, n'affiche que les erreurs
  tableName?: string; // Nom de la table pour les stats
}

/**
 * Composant qui affiche l'état de synchronisation avec animations
 */
const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  isSyncing,
  isOnline,
  syncFailed,
  lastSynced,
  onSync,
  showOnlyErrors = false,
  tableName = 'données'
}) => {
  // Affiche les détails de la dernière synchronisation
  const formatSyncTime = (date: Date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'il y a quelques secondes';
    } else if (diffMins === 1) {
      return 'il y a 1 minute';
    } else if (diffMins < 60) {
      return `il y a ${diffMins} minutes`;
    } else {
      const hours = Math.floor(diffMins / 60);
      if (hours === 1) {
        return 'il y a 1 heure';
      } else if (hours < 24) {
        return `il y a ${hours} heures`;
      } else {
        return date.toLocaleString();
      }
    }
  };
  
  // Calculer le texte d'état
  const getSyncStatusText = () => {
    if (!isOnline) return 'Mode hors ligne';
    if (isSyncing) return 'Synchronisation en cours...';
    if (syncFailed) return 'Échec de la synchronisation';
    if (!lastSynced) return 'Jamais synchronisé';
    
    return `Dernière synchronisation: ${formatSyncTime(lastSynced)}`;
  };
  
  // Le statut détermine l'apparence
  const getStatusColor = () => {
    if (!isOnline) return 'text-yellow-500';
    if (syncFailed) return 'text-red-500';
    if (isSyncing) return 'text-blue-500';
    if (lastSynced) {
      const now = new Date();
      const diffMs = now.getTime() - lastSynced.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 10) return 'text-green-500'; // Moins de 10 minutes
      if (diffMins < 60) return 'text-yellow-500'; // Moins d'une heure
      return 'text-orange-500'; // Plus d'une heure
    }
    return 'text-gray-500';
  };
  
  // S'il n'y a pas d'erreur et qu'on ne montre que les erreurs, on ne montre rien
  if (showOnlyErrors && !syncFailed && isOnline) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-2 ${getStatusColor()}`}>
              {!isOnline ? (
                <CloudOff className="h-4 w-4" />
              ) : syncFailed ? (
                <AlertTriangle className="h-4 w-4 animate-pulse" />
              ) : isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Cloud className="h-4 w-4" />
              )}
              <span className={showOnlyErrors && !syncFailed ? 'hidden' : ''}>
                {getSyncStatusText()}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">État de synchronisation de {tableName}</p>
              <p>Connecté: {isOnline ? 'Oui' : 'Non'}</p>
              {lastSynced && (
                <p>Dernière sync: {lastSynced.toLocaleString()}</p>
              )}
              {syncFailed && (
                <p className="text-red-500">
                  Problème de synchronisation. Cliquez pour réessayer.
                </p>
              )}
              {onSync && (
                <p className="text-xs text-gray-500 italic">
                  Cliquez sur l'indicateur pour synchroniser manuellement
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Bouton de synchronisation manuelle si fourni */}
      {onSync && (
        <Button 
          variant="ghost" 
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onSync}
          disabled={isSyncing || !isOnline}
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="sr-only">Forcer la synchronisation</span>
        </Button>
      )}
    </div>
  );
};

export default SyncIndicator;
