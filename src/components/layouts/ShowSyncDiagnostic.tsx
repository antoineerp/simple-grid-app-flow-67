
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import SyncDiagnosticDialog from '../common/SyncDiagnosticDialog';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

const ShowSyncDiagnostic = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { syncStates } = useGlobalSync();
  
  // Vérifier s'il y a des problèmes de synchronisation
  const hasSyncIssues = Object.values(syncStates).some(state => state.syncFailed);
  
  // Ne pas afficher le bouton de diagnostic - masqué comme demandé
  return (
    <>
      {/* Bouton masqué - rendu conditionnel */}
      {false && (
        <Button 
          onClick={() => setDialogOpen(true)}
          variant={hasSyncIssues ? "destructive" : "outline"} 
          size="sm"
          className="absolute bottom-4 right-4 z-50 shadow-md"
        >
          <Activity className="h-4 w-4 mr-2" />
          Diagnostic de synchronisation
        </Button>
      )}
      
      <SyncDiagnosticDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};

export default ShowSyncDiagnostic;
