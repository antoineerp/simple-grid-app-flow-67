
import React, { useState } from 'react';
import { useBibliotheque } from '@/hooks/useBibliotheque';
import { BibliothequeHeader } from '@/features/bibliotheque/components/BibliothequeHeader';
import { BibliothequeTable } from '@/features/bibliotheque/components/BibliothequeTable';
import { BibliothequeActions } from '@/features/bibliotheque/components/BibliothequeActions';
import { DocumentDialog } from '@/features/bibliotheque/components/DocumentDialog';
import { DocumentGroupDialog } from '@/components/gestion-documentaire/DocumentGroupDialog';

const Bibliotheque = () => {
  const {
    documents,
    groups,
    isSyncing,
    syncFailed,
    syncWithServer,
    handleDocumentEdit,
    handleDocumentDelete,
    openDocumentDialog,
    openGroupDialog
  } = useBibliotheque();
  
  const [syncError, setSyncError] = useState(false);

  const handleSync = async () => {
    try {
      await syncWithServer();
      setSyncError(false);
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncError(true);
    }
  };

  return (
    <div className="p-8">
      <BibliothequeHeader
        onSync={handleSync}
        syncFailed={syncFailed || syncError}
      />
      
      <BibliothequeTable
        documents={documents}
        groups={groups}
        onEditDocument={handleDocumentEdit}
        onDeleteDocument={handleDocumentDelete}
        isLoading={isSyncing}
      />

      <BibliothequeActions
        onAddGroup={() => openGroupDialog(null)}
        onAddDocument={() => openDocumentDialog(null)}
      />
    </div>
  );
};

export default Bibliotheque;
