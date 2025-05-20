
import React from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSyncContext } from '@/contexts/SyncContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import SyncIndicator from '@/components/common/SyncIndicator';
import { exportCollaborationDocsToPdf } from '@/services/collaborationExport';
import { BibliothequeTable } from '@/features/bibliotheque/components/BibliothequeTable';
import { BibliothequeHeader } from '@/features/bibliotheque/components/BibliothequeHeader';
import { BibliothequeActions } from '@/features/bibliotheque/components/BibliothequeActions';
import { DocumentDialog } from '@/features/bibliotheque/components/DocumentDialog';
import { GroupDialog } from '@/features/bibliotheque/components/GroupDialog';
import { saveCollaborationToStorage } from '@/services/collaboration/collaborationService';
import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '@/services/auth/authService';

const Collaboration = () => {
  // State management
  const [documents, setDocuments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use global synchronization
  const { syncStates, registerSync, updateSyncState, syncAll } = useSyncContext();
  const { isOnline } = useNetworkStatus();
  
  // Get sync state for collaboration
  const syncState = syncStates.collaboration || {
    isSyncing: false,
    lastSynced: null,
    syncFailed: false
  };
  
  const isSyncing = syncState.isSyncing;
  const lastSynced = syncState.lastSynced;
  const syncFailed = syncState.syncFailed;

  // Register for synchronization on mount
  useEffect(() => {
    registerSync('collaboration');
    
    // Load data on mount
    const loadData = async () => {
      setIsLoading(true);
      try {
        // First try to load from localStorage
        const currentUser = getCurrentUser() || 'p71x6d_system';
        const storageKey = `collaboration_${currentUser}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            setDocuments(Array.isArray(parsed) ? parsed : []);
          } catch (error) {
            console.error("Error parsing collaboration data:", error);
          }
        }
        
        // Load groups if available
        const groupsKey = `collaboration_groups_${currentUser}`;
        const storedGroups = localStorage.getItem(groupsKey);
        
        if (storedGroups) {
          try {
            const parsed = JSON.parse(storedGroups);
            setGroups(Array.isArray(parsed) ? parsed : []);
          } catch (error) {
            console.error("Error parsing groups data:", error);
          }
        }
      } catch (error) {
        console.error("Error loading collaboration data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [registerSync]);

  // Synchronization handler
  const handleSyncDocuments = useCallback(async () => {
    if (!isOnline) {
      return false;
    }
    
    updateSyncState('collaboration', { isSyncing: true });
    
    try {
      // Save documents to localStorage
      const currentUser = getCurrentUser() || 'p71x6d_system';
      localStorage.setItem(`collaboration_${currentUser}`, JSON.stringify(documents));
      localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(groups));
      
      // Sync with server through global sync context
      await syncAll();
      
      updateSyncState('collaboration', { 
        isSyncing: false,
        lastSynced: new Date(),
        syncFailed: false
      });
      
      return true;
    } catch (error) {
      console.error("Error syncing documents:", error);
      updateSyncState('collaboration', { 
        isSyncing: false,
        syncFailed: true
      });
      return false;
    }
  }, [documents, groups, isOnline, updateSyncState, syncAll]);

  // Create a wrapper function that returns Promise<void> for SyncIndicator
  const handleSync = async () => {
    await handleSyncDocuments();
  };

  // Document operations
  const handleAddDocument = useCallback((document) => {
    const newDocument = {
      ...document,
      id: document.id || `doc-${Date.now()}`,
      date_creation: new Date(),
      date_modification: new Date()
    };
    
    setDocuments(prev => [...prev, newDocument]);
    setIsDialogOpen(false);
    
    // Save and sync
    saveCollaborationToStorage(
      [...documents, newDocument], 
      groups
    );
    handleSyncDocuments();
  }, [documents, groups, handleSyncDocuments]);

  const handleUpdateDocument = useCallback((document) => {
    const updatedDoc = {
      ...document,
      date_modification: new Date()
    };
    
    setDocuments(prev => prev.map(d => d.id === document.id ? updatedDoc : d));
    setIsDialogOpen(false);
    
    // Save and sync
    const updatedDocs = documents.map(d => d.id === document.id ? updatedDoc : d);
    saveCollaborationToStorage(updatedDocs, groups);
    handleSyncDocuments();
  }, [documents, groups, handleSyncDocuments]);

  const handleDeleteDocument = useCallback((id) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    
    // Save and sync
    const updatedDocs = documents.filter(d => d.id !== id);
    saveCollaborationToStorage(updatedDocs, groups);
    handleSyncDocuments();
  }, [documents, groups, handleSyncDocuments]);

  // Group operations
  const handleAddGroup = useCallback((group) => {
    const newGroup = {
      ...group,
      id: group.id || `group-${Date.now()}`
    };
    
    setGroups(prev => [...prev, newGroup]);
    setIsGroupDialogOpen(false);
    
    // Save and sync
    saveCollaborationToStorage(documents, [...groups, newGroup]);
    handleSyncDocuments();
  }, [documents, groups, handleSyncDocuments]);

  const handleUpdateGroup = useCallback((group) => {
    setGroups(prev => prev.map(g => g.id === group.id ? group : g));
    setIsGroupDialogOpen(false);
    
    // Save and sync
    const updatedGroups = groups.map(g => g.id === group.id ? group : g);
    saveCollaborationToStorage(documents, updatedGroups);
    handleSyncDocuments();
  }, [documents, groups, handleSyncDocuments]);

  const handleDeleteGroup = useCallback((id) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    
    // Save and sync
    const updatedGroups = groups.filter(g => g.id !== id);
    saveCollaborationToStorage(documents, updatedGroups);
    handleSyncDocuments();
  }, [documents, groups, handleSyncDocuments]);

  const handleToggleGroup = useCallback((groupId) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, expanded: !group.expanded } : group
    ));
    
    // Save local preference but don't sync (UI state only)
    const updatedGroups = groups.map(group => 
      group.id === groupId ? { ...group, expanded: !group.expanded } : group
    );
    saveCollaborationToStorage(documents, updatedGroups);
  }, [documents, groups]);

  // Handlers for dialogs
  const handleOpenDocumentDialog = (document = null) => {
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
  
  const handleOpenGroupDialog = (group = null) => {
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

  // Handlers for input changes
  const handleDocumentInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDocument(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGroupInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentGroup(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save handlers
  const handleSaveDocument = () => {
    if (!currentDocument?.name) {
      return;
    }
    
    if (isEditing) {
      handleUpdateDocument(currentDocument);
    } else {
      handleAddDocument(currentDocument);
    }
  };

  const handleSaveGroup = () => {
    if (!currentGroup?.name) {
      return;
    }
    
    if (isEditing) {
      handleUpdateGroup(currentGroup);
    } else {
      handleAddGroup(currentGroup);
    }
  };

  // Reorder handlers
  const handleReorder = (startIndex, endIndex, targetGroupId) => {
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
      
      for (const group of updatedGroups) {
        if (adjustedIndex < group.items.length) {
          sourceDoc = { ...group.items[adjustedIndex] };
          sourceGroupId = group.id;
          group.items.splice(adjustedIndex, 1);
          break;
        }
        adjustedIndex -= group.items.length;
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
    
    // Save updated data
    setDocuments(updatedDocuments);
    setGroups(updatedGroups);
    
    // Sauvegarder et synchroniser avec le serveur
    saveCollaborationToStorage(updatedDocuments, updatedGroups);
    handleSyncDocuments();
  };

  const handleGroupReorder = (startIndex, endIndex) => {
    const updatedGroups = [...groups];
    const [removed] = updatedGroups.splice(startIndex, 1);
    updatedGroups.splice(endIndex, 0, removed);
    
    setGroups(updatedGroups);
    
    // Sauvegarder et synchroniser avec le serveur
    saveCollaborationToStorage(documents, updatedGroups);
    handleSyncDocuments();
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

      {isSyncing || isLoading ? (
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
