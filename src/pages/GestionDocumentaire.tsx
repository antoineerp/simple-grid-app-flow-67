
import React, { useEffect, useState } from 'react';
import DocumentTable from '@/components/documents/DocumentTable';
import { useDocuments } from '@/hooks/useDocuments';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

const GestionDocumentaire = () => {
  const { 
    documents, 
    groups, 
    handleEdit, 
    handleDelete, 
    handleReorder, 
    handleToggleGroup, 
    handleEditGroup, 
    handleDeleteGroup, 
    handleResponsabiliteChange, 
    handleAtteinteChange, 
    handleExclusionChange, 
    handleAddDocument, 
    handleAddGroup,
    handleGroupReorder 
  } = useDocuments();
  
  const [currentUser, setCurrentUser] = useState<string>(getDatabaseConnectionCurrentUser() || 'default');
  
  // Écouter les changements d'utilisateur
  useEffect(() => {
    const handleUserChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.user) {
        setCurrentUser(customEvent.detail.user);
        console.log(`GestionDocumentaire: Changement d'utilisateur - ${customEvent.detail.user}`);
      }
    };
    
    window.addEventListener('database-user-changed', handleUserChange);
    
    return () => {
      window.removeEventListener('database-user-changed', handleUserChange);
    };
  }, []);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion Documentaire</h1>
      </div>
      
      <DocumentTable 
        documents={documents}
        groups={groups}
        onResponsabiliteChange={handleResponsabiliteChange}
        onAtteinteChange={handleAtteinteChange}
        onExclusionChange={handleExclusionChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
        onGroupReorder={handleGroupReorder}
        onToggleGroup={handleToggleGroup}
        onEditGroup={handleEditGroup}
        onDeleteGroup={handleDeleteGroup}
      />
      
      <div className="mt-4 flex justify-end space-x-2">
        <Button
          onClick={handleAddDocument}
          className="flex items-center bg-app-blue hover:bg-app-blue/90"
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter un document
        </Button>
        <Button
          onClick={handleAddGroup}
          className="flex items-center bg-green-600 hover:bg-green-700"
        >
          <FileText className="h-4 w-4 mr-1" />
          Ajouter un groupe
        </Button>
      </div>
    </div>
  );
};

export default GestionDocumentaire;
