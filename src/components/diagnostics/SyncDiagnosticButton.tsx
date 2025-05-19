
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileSearch } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SyncDiagnosticPanel } from './SyncDiagnosticPanel';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

export const SyncDiagnosticButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { syncAll } = useGlobalSync();

  useEffect(() => {
    // Log lors du montage pour vérifier l'état initial
    console.log("SyncDiagnosticButton - État initial:", { isOpen });
    
    // Ajouter un gestionnaire d'événement pour le bouton de diagnostic
    const handleDiagnosticEvent = () => {
      console.log("Événement de diagnostic détecté, ouverture du panneau");
      setIsOpen(true);
    };
    
    window.addEventListener('openSyncDiagnostic', handleDiagnosticEvent);
    
    return () => {
      window.removeEventListener('openSyncDiagnostic', handleDiagnosticEvent);
    };
  }, []);

  const handleOpenDiagnostic = () => {
    // Définir explicitement à true pour s'assurer que le dialogue s'ouvre
    console.log("Clic sur le bouton de diagnostic, ouverture du panneau");
    setIsOpen(true);
    
    // Tenter de synchroniser les données avant d'ouvrir le diagnostic
    syncAll().catch(error => {
      console.error("Erreur lors de la synchronisation avant diagnostic:", error);
    });
    
    console.log("Après setIsOpen(true):", { isOpen });
  };

  // Retourner null pour ne pas afficher le bouton - masqué comme demandé
  return null;

  /* Code du composant d'origine - masqué pour éliminer l'affichage des fenêtres contextuelles
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleOpenDiagnostic}
            className="gap-2 ml-2"
          >
            <FileSearch className="h-4 w-4" />
            <span>Diagnostic de Sync Infomaniak</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Ouvrir l'outil de diagnostic de synchronisation</p>
        </TooltipContent>
      </Tooltip>
      
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          console.log("Dialog onOpenChange:", { open });
          setIsOpen(open);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Diagnostic de Synchronisation Infomaniak</DialogTitle>
            <DialogDescription>
              Vérifiez l'état de la synchronisation de toutes les données avec la base de données Infomaniak.
            </DialogDescription>
          </DialogHeader>
          
          <SyncDiagnosticPanel onClose={() => {
            console.log("Fermeture du panneau de diagnostic");
            setIsOpen(false);
          }} />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
  */
};
