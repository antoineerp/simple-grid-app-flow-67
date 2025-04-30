
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff, CheckCircle, AlertCircle } from "lucide-react";

interface SyncIndicatorProps {
  isSyncing: boolean;
  isOnline: boolean;
  syncFailed: boolean;
  lastSynced: Date | null;
  onSync: () => void;
  showOnlyErrors?: boolean; // Ajout de cette prop optionnelle
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  isSyncing,
  isOnline,
  syncFailed,
  lastSynced,
  onSync,
  showOnlyErrors = false // Valeur par défaut
}) => {
  const formatLastSynced = () => {
    if (!lastSynced) return "Jamais";
    
    // Format date in a French-friendly way
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(lastSynced);
  };

  // Si showOnlyErrors est true et qu'il n'y a pas d'erreur, ne rien afficher
  if (showOnlyErrors && !syncFailed) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-2 bg-slate-50 border rounded-md">
      <div className="flex items-center gap-2 text-sm">
        {isOnline ? (
          syncFailed ? (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )
        ) : (
          <WifiOff className="h-4 w-4 text-slate-500" />
        )}
        
        <span>
          {isOnline 
            ? (syncFailed ? "Synchronisation échouée" : "En ligne") 
            : "Mode hors-ligne"}
        </span>
        
        {lastSynced && (
          <span className="text-slate-500">
            Dernière synchro: {formatLastSynced()}
          </span>
        )}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onSync}
        disabled={isSyncing || !isOnline}
        className="flex items-center gap-1"
      >
        <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
        <span>{isSyncing ? "Synchronisation..." : "Synchroniser"}</span>
      </Button>
    </div>
  );
};

export default SyncIndicator;
