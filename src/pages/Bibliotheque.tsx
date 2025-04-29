
import React, { useState } from 'react';
import { useBibliotheque } from '@/hooks/useBibliotheque';
import { BibliothequeHeader } from '@/features/bibliotheque/components/BibliothequeHeader';
import { BibliothequeTable } from '@/features/bibliotheque/components/BibliothequeTable';
import { BibliothequeActions } from '@/features/bibliotheque/components/BibliothequeActions';
import { DocumentDialog } from '@/features/bibliotheque/components/DocumentDialog';
import { DocumentGroupDialog } from '@/components/gestion-documentaire/DocumentGroupDialog';
import { Document, DocumentGroup } from '@/types/bibliotheque';

const Bibliotheque = () => {
  const {
    documents,
    groups,
    isDialogOpen,
    isGroupDialogOpen,
    isEditing,
    currentDocument,
    currentGroup,
    setIsDialogOpen,
    setIsGroupDialogOpen,
    handleDrop,
    handleGroupDrop,
    handleEditDocument,
    handleDeleteDocument,
    handleAddDocument,
    handleDocumentInputChange,
    handleSaveDocument,
    handleEditGroup,
    handleDeleteGroup,
    handleAddGroup,
    handleGroupInputChange,
    handleSaveGroup,
    handleToggleGroup,
    syncWithServer,
    setDraggedItem,
    setCurrentDocument,
    setIsEditing
  } = useBibliotheque();
  
  const [syncFailed, setSyncFailed] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => {
    setDraggedItem({ id, groupId });
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, groupId }));
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-dashed', 'border-2', 'border-primary');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
  };

  const handleDocDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string, targetGroupId?: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
    handleDrop(targetId, targetGroupId);
    setDraggedItem(null);
  };

  const handleDocGroupDrop = (e: React.DragEvent<HTMLTableRowElement>, targetGroupId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
    handleGroupDrop(targetGroupId);
    setDraggedItem(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItem(null);
  };

  const handleSync = async () => {
    try {
      await syncWithServer();
      setSyncFailed(false);
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncFailed(true);
    }
  };

  // Corriger la fonction pour ouvrir le dialogue d'ajout de document
  const handleAddDocumentClick = () => {
    // Créer un document vide
    const emptyDocument: Document = {
      id: '',
      name: '',
      link: null
    };
    
    // Définir ce document comme document courant
    setCurrentDocument(emptyDocument);
    // Indiquer qu'il s'agit d'un nouvel ajout (pas d'édition)
    setIsEditing(false);
    // Ouvrir le dialogue
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8">
      <BibliothequeHeader
        onSync={handleSync}
        syncFailed={syncFailed}
      />
      
      <BibliothequeTable
        documents={documents}
        groups={groups}
        onEditDocument={handleEditDocument}
        onDeleteDocument={handleDeleteDocument}
        onEditGroup={handleEditGroup}
        onDeleteGroup={handleDeleteGroup}
        onToggleGroup={handleToggleGroup}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDocDrop}
        onDragEnd={handleDragEnd}
        onGroupDrop={handleDocGroupDrop}
      />

      <BibliothequeActions
        onAddGroup={handleAddGroup}
        onAddDocument={handleAddDocumentClick}
      />

      <DocumentDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentDocument={currentDocument}
        isEditing={isEditing}
        onInputChange={handleDocumentInputChange}
        onSave={handleSaveDocument}
      />

      <DocumentGroupDialog
        group={currentGroup as any}
        open={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
        onSave={handleSaveGroup as any}
        isEditing={isEditing}
      />
    </div>
  );
};

export default Bibliotheque;
