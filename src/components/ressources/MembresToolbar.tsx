
import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trash, List, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cleanCorruptedIdData, standardizeIds } from '@/utils/idStandardizer';
import { getCurrentUserId } from '@/services/core/userService';
import { cleanupSyncHistory } from '@/features/sync/utils/syncOperations';
import { toast } from '@/components/ui/use-toast';

interface MembresToolbarProps {
  onSync: () => void;
  lastSynced: Date | null;
  isLoading: boolean;
  error: string | null;
}

const MembresToolbar: React.FC<MembresToolbarProps> = ({ 
  onSync, 
  lastSynced, 
  isLoading, 
  error 
}) => {
  // Afficher la date de dernière synchronisation sous forme relative
  const lastSyncText = lastSynced ? 
    `Dernière synchronisation ${formatDistanceToNow(lastSynced, { addSuffix: true, locale: fr })}` : 
    'Jamais synchronisé';

  // État d'erreur
  const hasError = error !== null;
  
  // Déclencher un nettoyage complet des données et standardisation des IDs
  const handleCleanup = async () => {
    // Nettoyer d'abord les données locales corrompues
    const cleaned = cleanCorruptedIdData();
    
    // Nettoyer les doublons de l'historique de synchronisation
    try {
      const cleanupResult = await cleanupSyncHistory();
      
      if (cleanupResult.success) {
        toast({
          title: "Nettoyage de l'historique",
          description: cleanupResult.message
        });
      }
    } catch (error) {
      console.error("Erreur lors du nettoyage de l'historique:", error);
    }
    
    // Standardiser les IDs
    try {
      const userId = getCurrentUserId();
      if (userId) {
        await standardizeIds(userId);
      } else {
        toast({
          title: "Erreur",
          description: "ID utilisateur non disponible",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur lors de la standardisation des IDs:", error);
    }
    
    // Si nécessaire, forcer un rechargement après le nettoyage
    if (cleaned || hasError) {
      onSync();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-background rounded-md border">
      <div className="flex items-center space-x-2 mb-2 sm:mb-0">
        <List className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-medium">
          {lastSyncText}
        </span>
        {hasError && (
          <div className="flex items-center text-destructive">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium truncate max-w-[200px]">
              {typeof error === 'string' ? error : 'Erreur de synchronisation'}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-destructive"
          onClick={handleCleanup}
        >
          <Trash className="h-4 w-4 mr-1" />
          <span>Nettoyer</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSync} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              <span>Synchronisation...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-1" />
              <span>Synchroniser</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MembresToolbar;
