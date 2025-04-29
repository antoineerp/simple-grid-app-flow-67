import React, { useState, useEffect } from 'react';
import { useBibliotheque } from '@/hooks/useBibliotheque';
import { BibliothequeTable } from '@/features/bibliotheque/components/BibliothequeTable';
import { BibliothequeActions } from '@/features/bibliotheque/components/BibliothequeActions';
import { DocumentDialog } from '@/features/bibliotheque/components/DocumentDialog';
import { DocumentGroupDialog } from '@/components/gestion-documentaire/DocumentGroupDialog';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import SyncIndicator from '@/components/common/SyncIndicator';
import { useToast } from "@/hooks/use-toast";

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
    setIsEditing,
    isSyncing,
    isOnline,
    lastSynced
  } = useBibliotheque();
  
  const [syncFailed, setSyncFailed] = useState(false);
  const { toast } = useToast();

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

  const handleSync = async (): Promise<void> => {
    try {
      await syncWithServer();
      setSyncFailed(false);
      toast({
        title: "Synchronisation réussie",
        description: "Les documents ont été synchronisés avec succès."
      });
      return Promise.resolve();
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncFailed(true);
      toast({
        variant: "destructive",
        title: "Synchronisation échouée",
        description: "Une erreur s'est produite lors de la synchronisation.",
      });
      return Promise.reject(error);
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
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-app-blue">Bibliothèque de documents</h1>
        </div>
        
        <div className="mb-4">
          <SyncIndicator
            isSyncing={isSyncing}
            isOnline={isOnline}
            syncFailed={syncFailed}
            lastSynced={lastSynced}
            onSync={handleSync}
          />
        </div>
      </div>
      
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
        document={currentDocument}
        isEditing={isEditing}
        onChange={handleDocumentInputChange}
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
