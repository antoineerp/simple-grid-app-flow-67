import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useToast } from '@/hooks/use-toast';
import { useBibliothequeMutations } from '@/features/bibliotheque/hooks/useBibliothequeMutations';
import { useBibliothequeGroups } from '@/features/bibliotheque/hooks/useBibliothequeGroups';
import { useBibliothequeSync } from '@/features/bibliotheque/hooks/useBibliothequeSync';
import { getCurrentUser } from '@/services/auth/authService';
import { useGlobalData } from '@/contexts/GlobalDataContext';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

export const useBibliotheque = () => {
  // Utiliser les données du contexte global
  const { 
    bibliothequeDocuments: globalDocuments, 
    setBibliothequeDocuments: setGlobalDocuments,
    bibliothequeGroups: globalGroups,
    setBibliothequeGroups: setGlobalGroups
  } = useGlobalData();
  
  // Utiliser le contexte de synchronisation global
  const { 
    syncStates, 
    syncTable, 
    isOnline 
  } = useGlobalSync();
  
  // Obtenir l'état de synchronisation pour la bibliothèque
  const bibliothequeSync = syncStates['bibliotheque'] || {
    isSyncing: false,
    lastSynced: null,
    syncFailed: false
  };
  
  const { toast } = useToast();
  
  // États locaux pour l'interface utilisateur
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ id: string, groupId?: string } | null>(null);
  
  const { loadFromServer } = useBibliothequeSync();

  // Initialiser les données s'il n'y en a pas
  useEffect(() => {
    if (globalDocuments.length === 0 && globalGroups.length === 0) {
      const defaultDocuments: Document[] = [
        { id: "1", name: 'Organigramme', link: 'Voir le document' },
        { id: "2", name: 'Administration', link: 'Voir le document' }
      ];
      
      const defaultGroups: DocumentGroup[] = [
        { id: "1", name: 'Documents organisationnels', expanded: false, items: [] },
        { id: "2", name: 'Documents administratifs', expanded: false, items: [] }
      ];
      
      setGlobalDocuments(defaultDocuments);
      setGlobalGroups(defaultGroups);
    }
  }, [globalDocuments, globalGroups, setGlobalDocuments, setGlobalGroups]);

  // Fonctions de mutations
  const { handleEditDocument: editDocument, handleDeleteDocument, handleAddDocument: addDocument } = useBibliothequeMutations(
    globalDocuments, 
    setGlobalDocuments
  );
  
  // Fonctions de gestion des groupes
  const { handleSaveGroup, handleDeleteGroup, handleToggleGroup } = useBibliothequeGroups(
    globalGroups, 
    setGlobalGroups
  );

  // Gestion des modifications de document
  const handleDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!currentDocument) return;
    
    setCurrentDocument({
      ...currentDocument,
      [e.target.name]: e.target.value
    });
  };

  // Gestion des modifications de groupe
  const handleGroupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentGroup) return;
    
    setCurrentGroup({
      ...currentGroup,
      [e.target.name]: e.target.value
    });
  };

  // Enregistrer un document
  const handleSaveDocument = () => {
    if (!currentDocument) return;
    
    if (isEditing) {
      editDocument(currentDocument);
    } else {
      addDocument(currentDocument);
    }
    
    setIsDialogOpen(false);
    syncWithServer();
  };

  // Modifier un document
  const handleEditDocument = (document: Document) => {
    setCurrentDocument({ ...document });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Ajouter un groupe
  const handleAddGroup = () => {
    const newId = Date.now().toString();
    
    setCurrentGroup({
      id: newId,
      name: '',
      expanded: true,
      items: []
    });
    
    setIsEditing(false);
    setIsGroupDialogOpen(true);
  };

  // Modifier un groupe
  const handleEditGroup = (group: DocumentGroup) => {
    setCurrentGroup({ ...group });
    setIsEditing(true);
    setIsGroupDialogOpen(true);
  };

  // Synchroniser avec le serveur
  const syncWithServer = async () => {
    if (!isOnline) return false;
    
    try {
      // Utiliser le contexte de synchronisation global
      return await syncTable('bibliotheque', globalDocuments);
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      return false;
    }
  };

  // Déplacer un document (Drag and Drop)
  const handleDrop = (targetId: string, targetGroupId?: string) => {
    if (!draggedItem) return;
    
    const { id: draggedId, groupId: draggedGroupId } = draggedItem;
    
    if (draggedId === targetId) return;
    
    // Construire les nouvelles listes
    let newDocuments = [...globalDocuments];
    let newGroups = [...globalGroups];
    
    // Si le document déplacé est dans un groupe
    if (draggedGroupId) {
      // Trouver le groupe d'origine
      const sourceGroupIndex = newGroups.findIndex(g => g.id === draggedGroupId);
      if (sourceGroupIndex === -1) return;
      
      // Trouver le document dans ce groupe
      const draggedItemIndex = newGroups[sourceGroupIndex].items.findIndex(item => item.id === draggedId);
      if (draggedItemIndex === -1) return;
      
      // Retirer le document de son groupe d'origine
      const [removedItem] = newGroups[sourceGroupIndex].items.splice(draggedItemIndex, 1);
      
      // Si la cible est un groupe, ajouter le document à ce groupe
      if (targetGroupId) {
        const targetGroupIndex = newGroups.findIndex(g => g.id === targetGroupId);
        if (targetGroupIndex !== -1) {
          // Trouver l'index de la cible dans le groupe
          const targetItemIndex = newGroups[targetGroupIndex].items.findIndex(item => item.id === targetId);
          
          if (targetItemIndex !== -1) {
            // Insérer après la cible
            newGroups[targetGroupIndex].items.splice(targetItemIndex + 1, 0, { ...removedItem, groupId: targetGroupId });
          } else {
            // Ajouter à la fin si la cible n'est pas trouvée
            newGroups[targetGroupIndex].items.push({ ...removedItem, groupId: targetGroupId });
          }
        }
      } else {
        // Si la cible n'est pas dans un groupe, ajouter le document à la liste principale
        const targetIndex = newDocuments.findIndex(doc => doc.id === targetId);
        
        if (targetIndex !== -1) {
          // Insérer après la cible
          newDocuments.splice(targetIndex + 1, 0, { ...removedItem, groupId: undefined });
        } else {
          // Ajouter à la fin si la cible n'est pas trouvée
          newDocuments.push({ ...removedItem, groupId: undefined });
        }
      }
    } else {
      // Si le document déplacé n'est pas dans un groupe
      const draggedItemIndex = newDocuments.findIndex(doc => doc.id === draggedId);
      if (draggedItemIndex === -1) return;
      
      // Retirer le document de la liste principale
      const [removedItem] = newDocuments.splice(draggedItemIndex, 1);
      
      // Si la cible est un groupe, ajouter le document à ce groupe
      if (targetGroupId) {
        const targetGroupIndex = newGroups.findIndex(g => g.id === targetGroupId);
        if (targetGroupIndex !== -1) {
          // Ajouter le document au groupe cible
          newGroups[targetGroupIndex].items.push({ ...removedItem, groupId: targetGroupId });
        }
      } else {
        // Si la cible n'est pas dans un groupe
        const targetIndex = newDocuments.findIndex(doc => doc.id === targetId);
        
        if (targetIndex !== -1) {
          // Insérer après la cible
          newDocuments.splice(targetIndex + 1, 0, removedItem);
        } else {
          // Ajouter à la fin si la cible n'est pas trouvée
          newDocuments.push(removedItem);
        }
      }
    }
    
    // Mettre à jour les états
    setGlobalDocuments(newDocuments);
    setGlobalGroups(newGroups);
    
    // Synchroniser les changements
    syncWithServer();
  };

  // Déplacer un document dans un groupe
  const handleGroupDrop = (targetGroupId: string) => {
    if (!draggedItem) return;
    
    const { id: draggedId, groupId: draggedGroupId } = draggedItem;
    
    // Si le document est déjà dans ce groupe, ne rien faire
    if (draggedGroupId === targetGroupId) return;
    
    let newDocuments = [...globalDocuments];
    let newGroups = [...globalGroups];
    
    // Si le document déplacé est dans un groupe
    if (draggedGroupId) {
      // Trouver le groupe d'origine
      const sourceGroupIndex = newGroups.findIndex(g => g.id === draggedGroupId);
      if (sourceGroupIndex === -1) return;
      
      // Trouver le document dans ce groupe
      const draggedItemIndex = newGroups[sourceGroupIndex].items.findIndex(item => item.id === draggedId);
      if (draggedItemIndex === -1) return;
      
      // Retirer le document de son groupe d'origine
      const [removedItem] = newGroups[sourceGroupIndex].items.splice(draggedItemIndex, 1);
      
      // Trouver le groupe cible
      const targetGroupIndex = newGroups.findIndex(g => g.id === targetGroupId);
      if (targetGroupIndex !== -1) {
        // Ajouter le document au groupe cible
        newGroups[targetGroupIndex].items.push({ ...removedItem, groupId: targetGroupId });
      }
    } else {
      // Si le document déplacé n'est pas dans un groupe
      const draggedItemIndex = newDocuments.findIndex(doc => doc.id === draggedId);
      if (draggedItemIndex === -1) return;
      
      // Retirer le document de la liste principale
      const [removedItem] = newDocuments.splice(draggedItemIndex, 1);
      
      // Trouver le groupe cible
      const targetGroupIndex = newGroups.findIndex(g => g.id === targetGroupId);
      if (targetGroupIndex !== -1) {
        // Ajouter le document au groupe cible
        newGroups[targetGroupIndex].items.push({ ...removedItem, groupId: targetGroupId });
      }
    }
    
    // Mettre à jour les états
    setGlobalDocuments(newDocuments);
    setGlobalGroups(newGroups);
    
    // Synchroniser les changements
    syncWithServer();
  };

  return {
    documents: globalDocuments,
    groups: globalGroups,
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
    handleAddDocument: addDocument,
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
    isSyncing: bibliothequeSync.isSyncing,
    isOnline,
    lastSynced: bibliothequeSync.lastSynced,
    syncFailed: bibliothequeSync.syncFailed
  };
};
