
import React from 'react';
import DocumentTable from '@/components/documents/DocumentTable';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus } from 'lucide-react';

const GestionDocumentaire = () => {
  const { 
    documents = [], 
    groups = [], 
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
          onClick={handleAddGroup}
          variant="outline"
          className="flex items-center hover:bg-gray-100 transition-colors"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Nouveau groupe
        </Button>
        <Button
          onClick={handleAddDocument}
          className="flex items-center bg-app-blue hover:bg-app-blue/90"
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter un document
        </Button>
      </div>
    </div>
  );
};

export default GestionDocumentaire;
