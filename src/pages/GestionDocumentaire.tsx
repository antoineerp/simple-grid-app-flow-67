
import React, { useEffect, useState } from 'react';
import DocumentTable from '@/components/documents/DocumentTable';
import { useDocuments } from '@/hooks/useDocuments';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { Button } from '@/components/ui/button';
import { Plus, FileText, RefreshCw, FolderPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentGroupDialog } from '@/components/gestion-documentaire/DocumentGroupDialog';
import { DocumentGroup } from '@/types/documents';

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
    handleGroupReorder,
    forceReload,
    isSyncing
  } = useDocuments();
  
  const [currentUser, setCurrentUser] = useState<string>(getDatabaseConnectionCurrentUser() || 'default');
  const { toast } = useToast();
  
  // État pour la gestion de la boîte de dialogue des groupes
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
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

  const handleRefresh = () => {
    forceReload();
  };
  
  // Gérer l'ouverture du dialogue d'ajout de groupe
  const openAddGroupDialog = () => {
    setCurrentGroup({
      id: crypto.randomUUID(),
      name: '',
      expanded: false,
      items: [],
      userId: currentUser
    });
    setIsEditing(false);
    setIsGroupDialogOpen(true);
  };
  
  // Gérer l'édition d'un groupe
  const openEditGroupDialog = (group: DocumentGroup) => {
    setCurrentGroup(group);
    setIsEditing(true);
    setIsGroupDialogOpen(true);
  };
  
  // Gérer la sauvegarde d'un groupe
  const handleSaveGroup = (group: DocumentGroup, isEditing: boolean) => {
    if (isEditing) {
      handleEditGroup(group);
    } else {
      handleAddGroup(group);
    }
    setIsGroupDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion Documentaire</h1>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="ml-2 hidden"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
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
        onEditGroup={openEditGroupDialog}
        onDeleteGroup={handleDeleteGroup}
      />
      
      <div className="mt-4 flex justify-end space-x-2">
        <Button
          onClick={openAddGroupDialog}
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
      
      {/* Dialog pour ajouter/éditer un groupe */}
      <DocumentGroupDialog
        group={currentGroup}
        open={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
        onSave={handleSaveGroup}
        isEditing={isEditing}
      />
    </div>
  );
};

export default GestionDocumentaire;
