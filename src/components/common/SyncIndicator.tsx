
import React from 'react';
import { CloudOff, RotateCw, AlertTriangle, CheckCircle2, CloudSun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface SyncIndicatorProps {
  // État de synchronisation
  isSyncing: boolean;
  isOnline: boolean;
  syncFailed: boolean;
  lastSynced: Date | null;
  
  // Fonction de resynchronisation qui doit retourner une Promise
  onSync: () => Promise<void | boolean>;
  
  // Options de personnalisation (optionnelles)
  compact?: boolean;
  className?: string;
  // New prop to control visibility
  showOnlyErrors?: boolean;
}

/**
 * Composant standard pour afficher l'état de synchronisation des données
 */
const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  isSyncing,
  isOnline,
  syncFailed,
  lastSynced,
  onSync,
  compact = false,
  className = '',
  showOnlyErrors = true
}) => {
  // If showOnlyErrors is true and there's no error, don't show anything
  if (showOnlyErrors && !syncFailed && isOnline) {
    return null;
  }
  
  // Formatage de la date de dernière synchronisation
  const formattedDate = lastSynced 
    ? format(lastSynced, compact ? "HH:mm" : "dd MMM HH:mm", { locale: fr })
    : null;
  
  // Mode hors ligne
  if (!isOnline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-2 ${compact ? 'text-xs p-1' : 'text-sm p-2'} bg-gray-100 rounded-md ${className}`}>
              <CloudOff className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-gray-500`} />
              {!compact && <span className="text-gray-500">Hors ligne</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mode hors ligne</p>
            <p className="text-xs text-gray-500">Les modifications sont enregistrées localement</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Synchronisation en cours
  if (isSyncing) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-2 ${compact ? 'text-xs p-1' : 'text-sm p-2'} bg-blue-50 rounded-md ${className}`}>
              <div className={`animate-spin ${compact ? 'h-3 w-3' : 'h-4 w-4'} border-2 border-blue-500 rounded-full border-t-transparent`} />
              {!compact && <span className="text-blue-500">Synchronisation en cours...</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Synchronisation des données en cours</p>
            <p className="text-xs">Veuillez patienter...</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Échec de synchronisation
  if (syncFailed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-2 ${compact ? 'text-xs p-1' : 'text-sm p-2'} bg-red-50 rounded-md ${className}`}>
              <AlertTriangle className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-red-500`} />
              {!compact && <span className="text-red-500">Échec de synchronisation</span>}
              <Button 
                variant="ghost" 
                size={compact ? "icon" : "sm"} 
                onClick={() => onSync()} 
                className={`${compact ? 'h-5 w-5 p-0' : 'h-7 p-1'} ml-1`}
                title="Réessayer"
              >
                <RotateCw className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
                {!compact && <span className="ml-1 text-xs">Réessayer</span>}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Échec de la dernière synchronisation</p>
            <p className="text-xs text-red-500">Cliquez sur "Réessayer" pour tenter à nouveau</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // If we're only showing errors, don't show these states
  if (showOnlyErrors) {
    return null;
  }
  
  // Dernière synchronisation
  if (lastSynced) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-2 ${compact ? 'text-xs p-1' : 'text-sm p-2'} bg-green-50 rounded-md ${className}`}>
              <CheckCircle2 className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-green-500`} />
              {!compact ? (
                <span className="text-green-500">Synchronisé à {formattedDate}</span>
              ) : (
                <span className="text-green-500">{formattedDate}</span>
              )}
              <Button 
                variant="ghost" 
                size={compact ? "icon" : "sm"} 
                onClick={() => onSync()} 
                className={`${compact ? 'h-5 w-5 p-0' : 'h-7 p-1'} ml-1`}
                title="Synchroniser"
              >
                <CloudSun className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dernière synchronisation: {lastSynced.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-green-500">Les données sont à jour</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // État par défaut - aucune synchronisation effectuée
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 ${compact ? 'text-xs p-1' : 'text-sm p-2'} bg-gray-50 rounded-md ${className}`}>
            <CloudSun className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-gray-500`} />
            {!compact && <span className="text-gray-500">Jamais synchronisé</span>}
            <Button 
              variant="ghost" 
              size={compact ? "icon" : "sm"} 
              onClick={() => onSync()} 
              className={`${compact ? 'h-5 w-5 p-0' : 'h-7 p-1'} ml-1`}
              title="Synchroniser maintenant"
            >
              <RotateCw className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
              {!compact && <span className="ml-1 text-xs">Synchroniser</span>}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Aucune synchronisation effectuée</p>
          <p className="text-xs">Cliquez pour synchroniser maintenant</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncIndicator;
