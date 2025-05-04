
import { useState } from 'react';
import SyncDiagnosticDialog from '../common/SyncDiagnosticDialog';

const ShowSyncDiagnostic = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Ne pas afficher le bouton de diagnostic - masqué comme demandé
  return (
    <SyncDiagnosticDialog open={dialogOpen} onOpenChange={setDialogOpen} />
  );
};

export default ShowSyncDiagnostic;
