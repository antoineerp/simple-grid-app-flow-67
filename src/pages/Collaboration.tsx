
import React from 'react';
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
import { saveCollaborationToStorage } from '@/services/collaboration/collaborationService';

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
  };

  // Gestionnaire de réorganisation amélioré pour sauvegarder et synchroniser
  const handleReorder = (startIndex: number, endIndex: number, targetGroupId?: string) => {
    console.log(`Réorganisation de l'élément ${startIndex} à ${endIndex}${targetGroupId ? ` dans le groupe ${targetGroupId}` : ''}`);
    
    // Copie des listes actuelles
    const updatedDocuments = [...documents];
    const updatedGroups = [...groups];
    
    // Déterminer la source du document (groupe ou liste principale)
    let sourceDoc;
    let sourceGroupId;
    
    // Trouver le document source et sa provenance
    if (startIndex < updatedDocuments.length) {
      // Le document vient de la liste principale
      sourceDoc = { ...updatedDocuments[startIndex] };
      updatedDocuments.splice(startIndex, 1);
    } else {
      // Parcourir les groupes pour trouver le document
      let adjustedIndex = startIndex - updatedDocuments.length;
      let currentIndex = 0;
      
      for (const group of updatedGroups) {
        if (adjustedIndex < group.items.length) {
          sourceDoc = { ...group.items[adjustedIndex] };
          sourceGroupId = group.id;
          group.items.splice(adjustedIndex, 1);
          break;
        }
        adjustedIndex -= group.items.length;
        currentIndex += group.items.length;
      }
    }
    
    if (sourceDoc) {
      // Si un groupe cible est spécifié, ajouter le document à ce groupe
      if (targetGroupId) {
        if (targetGroupId === 'null') {
          // Ajouter à la liste principale
          sourceDoc.groupId = undefined;
          updatedDocuments.splice(endIndex, 0, sourceDoc);
        } else {
          // Ajouter au groupe spécifié
          sourceDoc.groupId = targetGroupId;
          
          const targetGroup = updatedGroups.find(g => g.id === targetGroupId);
          if (targetGroup) {
            // Calculer la position dans le groupe
            if (endIndex <= updatedDocuments.length) {
              targetGroup.items.unshift(sourceDoc);
            } else {
              // Ajuster l'index pour les groupes
              let adjustedEndIndex = endIndex - updatedDocuments.length;
              let currentIndex = 0;
              
              for (const group of updatedGroups) {
                if (group.id === targetGroupId) {
                  const insertPosition = Math.min(adjustedEndIndex - currentIndex, group.items.length);
                  group.items.splice(insertPosition, 0, sourceDoc);
                  break;
                }
                currentIndex += group.items.length;
              }
            }
          }
        }
      } else {
        // Pas de groupe cible spécifié, ajouter à la liste principale
        sourceDoc.groupId = undefined;
        updatedDocuments.splice(endIndex, 0, sourceDoc);
      }
    }
    
    // Sauvegarder et synchroniser avec le serveur
    saveCollaborationToStorage(updatedDocuments, updatedGroups);
    handleSyncDocuments();
  };

  // Gestionnaire de réorganisation de groupe
  const handleGroupReorder = (startIndex: number, endIndex: number) => {
    console.log(`Réorganisation du groupe ${startIndex} à ${endIndex}`);
    
    const updatedGroups = [...groups];
    const [removed] = updatedGroups.splice(startIndex, 1);
    updatedGroups.splice(endIndex, 0, removed);
    
    // Sauvegarder et synchroniser avec le serveur
    saveCollaborationToStorage(documents, updatedGroups);
    handleSyncDocuments();
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
