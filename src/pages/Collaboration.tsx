
import React from 'react';
import { BibliothequeHeader } from '@/features/bibliotheque/components/BibliothequeHeader';
import { BibliothequeTable } from '@/features/bibliotheque/components/BibliothequeTable';
import { BibliothequeActions } from '@/features/bibliotheque/components/BibliothequeActions';
import { useBibliotheque } from '@/hooks/useBibliotheque';

const Collaboration = () => {
  const { 
    documents,
    groups,
    openDocumentDialog,
    openGroupDialog,
    handleDocumentDelete,
    handleDocumentEdit,
    handleGroupEdit,
    handleGroupDelete,
    syncWithServer,
    isSyncing,
    syncFailed
  } = useBibliotheque();

  // Wrapper function to handle void return type
  const handleSync = async (): Promise<void> => {
    await syncWithServer();
    // Ne rien retourner pour garantir le type void
  };

  return (
    <div className="container mx-auto py-8">
      <BibliothequeHeader 
        onSync={handleSync}
        syncFailed={syncFailed}
      />
      
      <BibliothequeActions
        onAddGroup={() => openGroupDialog(null)} 
        onAddDocument={() => openDocumentDialog(null)}
      />
      
      <div className="mt-6">
        <BibliothequeTable
          isLoading={isSyncing}
          documents={documents}
          groups={groups}
          onGroupEdit={handleGroupEdit}
          onGroupDelete={handleGroupDelete}
          onDocumentEdit={handleDocumentEdit}
          onDocumentDelete={handleDocumentDelete}
        />
      </div>
    </div>
  );
};

export default Collaboration;
