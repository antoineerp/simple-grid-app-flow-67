
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentTable from '@/components/documents/DocumentTable';
import { useDocuments } from '@/hooks/useDocuments';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

const GestionDocumentaire = () => {
  const navigate = useNavigate();
  const { documents, groups, handleEdit, handleDelete, handleReorder, handleToggleGroup, handleEditGroup, handleDeleteGroup, handleResponsabiliteChange, handleAtteinteChange, handleExclusionChange, handleAddDocument, handleAddGroup, handleGroupReorder } = useDocuments();
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
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddDocument}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Ajouter un document
          </button>
          <button
            onClick={handleAddGroup}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Ajouter un groupe
          </button>
        </div>
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
    </div>
  );
};

export default GestionDocumentaire;
