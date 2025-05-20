
import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCollaboration } from '@/hooks/useCollaboration';
import SyncIndicator from '@/components/common/SyncIndicator';
import { exportCollaborationDocsToPdf } from '@/services/collaborationExport';
import { BibliothequeTable } from '@/features/bibliotheque/components/BibliothequeTable';
import { BibliothequeHeader } from '@/features/bibliotheque/components/BibliothequeHeader';
import { BibliothequeActions } from '@/features/bibliotheque/components/BibliothequeActions';
import { DocumentDialog } from '@/features/bibliotheque/components/DocumentDialog';
import { GroupDialog } from '@/features/bibliotheque/components/GroupDialog';

const Collaboration = () => {
  const { 
    documents, 
    groups, 
    isDialogOpen,
    isGroupDialogOpen,
    isEditing,
    currentDocument,
    currentGroup,
    isSyncing, 
    isOnline, 
    syncFailed,
    lastSynced,
    setIsDialogOpen,
    setIsGroupDialogOpen,
    setIsEditing,
    setCurrentDocument,
    setCurrentGroup,
    handleSyncDocuments,
    handleAddDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleToggleGroup
  } = useCollaboration();

  // Fonction de gestion pour l'exportation PDF
  const handleExportPdf = () => {
    if (documents.length > 0 || groups.length > 0) {
      exportCollaborationDocsToPdf(documents, groups, "Documents de collaboration");
    } else {
      console.log("Aucun document à exporter");
    }
  };

  // Create a wrapper function that returns Promise<void> for SyncIndicator
  const handleSync = async () => {
    await handleSyncDocuments();
  };

  // Gestionnaires pour l'ouverture des dialogues
  const handleOpenDocumentDialog = (document: any = null, group: any = null) => {
    setIsEditing(!!document);
    
    if (document) {
      setCurrentDocument(document);
    } else {
      setCurrentDocument({
        id: '',
        name: '',
        link: null
      });
    }
    
    setIsDialogOpen(true);
  };
  
  const handleOpenGroupDialog = (group: any = null) => {
    setIsEditing(!!group);
    
    if (group) {
      setCurrentGroup(group);
    } else {
      setCurrentGroup({
        id: '',
        name: '',
        expanded: false,
        items: []
      });
    }
    
    setIsGroupDialogOpen(true);
  };

  // Sauvegarde du document
  const handleSaveDocument = () => {
    if (!currentDocument.name) {
      return;
    }
    
    if (isEditing) {
      handleUpdateDocument(currentDocument);
    } else {
      handleAddDocument(currentDocument);
    }
    
    setIsDialogOpen(false);
  };

  // Sauvegarde du groupe
  const handleSaveGroup = () => {
    if (!currentGroup.name) {
      return;
    }
    
    if (isEditing) {
      handleUpdateGroup(currentGroup);
    } else {
      handleAddGroup(currentGroup);
    }
    
    setIsGroupDialogOpen(false);
  };

  // Gestionnaire de réorganisation
  const handleReorder = (startIndex: number, endIndex: number, targetGroupId?: string) => {
    console.log(`Réorganisation de l'élément ${startIndex} à ${endIndex}${targetGroupId ? ` dans le groupe ${targetGroupId}` : ''}`);
    // Implémentation à faire si nécessaire
  };

  // Gestionnaire de réorganisation de groupe
  const handleGroupReorder = (startIndex: number, endIndex: number) => {
    console.log(`Réorganisation du groupe ${startIndex} à ${endIndex}`);
    // Implémentation à faire si nécessaire
  };

  // Gestion des changements de champs du document
  const handleDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentDocument(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gestion des changements de champs du groupe
  const handleGroupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentGroup(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container py-8">
      <BibliothequeHeader 
        onSync={handleSync}
        isSyncing={isSyncing}
        isOnline={isOnline}
        syncFailed={syncFailed}
        lastSynced={lastSynced}
      />

      {syncFailed && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erreur de synchronisation</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Une erreur est survenue lors de la synchronisation des documents</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSync}
            >
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isSyncing ? (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Chargement des données de collaboration...</p>
        </div>
      ) : (
        <>
          <BibliothequeTable
            documents={documents}
            groups={groups}
            onEdit={handleOpenDocumentDialog}
            onDelete={(id, isGroup) => isGroup ? handleDeleteGroup(id) : handleDeleteDocument(id)}
            onReorder={handleReorder}
            onGroupReorder={handleGroupReorder}
            onToggleGroup={handleToggleGroup}
          />
          
          <BibliothequeActions
            onAddGroup={() => handleOpenGroupDialog()}
            onAddDocument={() => handleOpenDocumentDialog()}
          />
        </>
      )}

      <DocumentDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        document={currentDocument}
        isEditing={isEditing}
        onChange={handleDocumentInputChange}
        onSave={handleSaveDocument}
      />

      <GroupDialog
        isOpen={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
        onClose={() => setIsGroupDialogOpen(false)}
        group={currentGroup}
        isEditing={isEditing}
        onChange={handleGroupInputChange}
        onSave={handleSaveGroup}
      />
    </div>
  );
};

export default Collaboration;
