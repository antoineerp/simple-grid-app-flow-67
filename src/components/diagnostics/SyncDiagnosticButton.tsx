
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SyncDiagnosticPanel } from './SyncDiagnosticPanel';
import { TooltipProvider } from '@/components/ui/tooltip';

export const SyncDiagnosticButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenDiagnostic = () => {
    setIsOpen(true);
    toast({
      title: "Diagnostic de synchronisation",
      description: "Ouverture du diagnostic de synchronisation avec Infomaniak..."
    });
  };

  return (
    <TooltipProvider>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleOpenDiagnostic}
        className="gap-2 ml-2"
      >
        <Activity className="h-4 w-4" />
        <span>Diagnostic de Sync Infomaniak</span>
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Diagnostic de Synchronisation Infomaniak</DialogTitle>
            <DialogDescription>
              Vérifiez l'état de la synchronisation de toutes les données avec la base de données Infomaniak.
            </DialogDescription>
          </DialogHeader>
          
          <SyncDiagnosticPanel onClose={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
