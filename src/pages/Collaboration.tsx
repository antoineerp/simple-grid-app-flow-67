
import React from 'react';
import { BibliothequeHeader } from '@/features/bibliotheque/components/BibliothequeHeader';
import { BibliothequeTable } from '@/features/bibliotheque/components/BibliothequeTable';
import { BibliothequeActions } from '@/features/bibliotheque/components/BibliothequeActions';
import { useBibliotheque } from '@/hooks/useBibliotheque';

const Collaboration = () => {
  const { 
    isLoading, 
    documents, 
    handleGroupChange, 
    handleGroupDelete,
    handleDocumentCreate,
    handleDocumentUpdate,
    handleDocumentDelete,
    handleSync,
    syncStatus
  } = useBibliotheque();

  return (
    <div className="container mx-auto py-8">
      <BibliothequeHeader 
        onSync={handleSync}
        syncFailed={syncStatus.syncFailed}
      />
      
      <BibliothequeActions
        onGroupCreate={handleGroupChange} 
        onDocumentCreate={handleDocumentCreate}
      />
      
      <div className="mt-6">
        <BibliothequeTable
          isLoading={isLoading}
          documents={documents}
          onGroupEdit={handleGroupChange}
          onGroupDelete={handleGroupDelete}
          onDocumentEdit={handleDocumentUpdate}
          onDocumentDelete={handleDocumentDelete}
        />
      </div>
    </div>
  );
};

export default Collaboration;
