
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { forceFullSync as forceDocumentsSync } from '@/services/documents/documentSyncService';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

interface ForceSyncButtonProps {
  tableName?: string;  // Si null, synchronise toutes les tables
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
}

export const ForceSyncButton: React.FC<ForceSyncButtonProps> = ({
  tableName,
  variant = "ghost",
  size = "default",
  showLabel = false
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { syncAll } = useGlobalSync();

  const handleForceSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncStatus('idle');
    
    try {
      let success: boolean;
      
      if (tableName === 'documents') {
        // Utiliser le service spécifique pour les documents
        success = await forceDocumentsSync();
      } else {
        // Utiliser la synchronisation globale pour toutes les tables
        const results = await syncAll();
        success = Object.values(results).every(result => result === true);
      }
      
      if (success) {
        setSyncStatus('success');
        toast({
          title: "Synchronisation réussie",
          description: tableName 
            ? `La table ${tableName} a été synchronisée avec la base de données.` 
            : "Toutes les tables ont été synchronisées avec la base de données."
        });
      } else {
        setSyncStatus('error');
        toast({
          variant: "destructive",
          title: "Synchronisation partielle",
          description: "Certaines données n'ont pas pu être synchronisées."
        });
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation forcée:", error);
      setSyncStatus('error');
      toast({
        variant: "destructive",
        title: "Échec de la synchronisation",
        description: error instanceof Error ? error.message : "Une erreur est survenue."
      });
    } finally {
      setIsSyncing(false);
      
      // Réinitialiser le statut après 3 secondes
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    }
  };

  const renderIcon = () => {
    if (isSyncing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    switch (syncStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          onClick={handleForceSync}
          disabled={isSyncing}
          className="gap-2"
        >
          {renderIcon()}
          {showLabel && (
            <span>{isSyncing ? "Synchronisation..." : "Forcer la synchronisation"}</span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Forcer une synchronisation complète avec la base de données Infomaniak</p>
      </TooltipContent>
    </Tooltip>
  );
};
