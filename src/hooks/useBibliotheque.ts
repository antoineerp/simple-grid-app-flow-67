import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useToast } from "@/hooks/use-toast";
import {
  loadBibliothequeFromStorage,
  saveBibliothequeToStorage
} from '@/services/bibliotheque/bibliothequeService';
import { useGlobalSync } from '@/hooks/useGlobalSync';

export const useBibliotheque = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document>({ id: '', name: '', link: '' });
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup>({ id: '', name: '', expanded: false, items: [] });
  const [draggedItem, setDraggedItem] = useState<{ id: string | null, groupId: string | null }>({ id: null, groupId: null });
  
  const currentUser = localStorage.getItem('currentUser') || 'default';
  const { 
    appData,
    saveData,
    syncWithServer,
    isSyncing,
    isOnline,
    lastSynced,
    hasUnsyncedData
  } = useGlobalSync();

  useEffect(() => {
    const { documents: loadedDocuments, groups: loadedGroups } = loadBibliothequeFromStorage(currentUser);
    setDocuments(loadedDocuments);
    setGroups(loadedGroups);
    
    const handleBibliothequeUpdate = () => {
      const { documents: updatedDocuments, groups: updatedGroups } = loadBibliothequeFromStorage(currentUser);
      setDocuments(updatedDocuments);
      setGroups(updatedGroups);
    };
    
    window.addEventListener('bibliothequeUpdate', handleBibliothequeUpdate);
    
    return () => {
      window.removeEventListener('bibliothequeUpdate', handleBibliothequeUpdate);
    };
  }, [currentUser]);

  const saveToStorage = useCallback((newDocuments: Document[], newGroups: DocumentGroup[]) => {
    saveBibliothequeToStorage(newDocuments, newGroups, currentUser);
    
    // Mettre à jour les données globales
    saveData({
      ...appData,
      bibliotheque: {
        documents: newDocuments,
        groups: newGroups
      }
    });
  }, [currentUser, appData, saveData]);

  const handleEditDocument = (document: Document) => {
    setCurrentDocument(document);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteDocument = (id: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocuments);
    saveToStorage(updatedDocuments, groups);
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès",
    });
  };

  const handleAddDocument = () => {
    setCurrentDocument({ id: '', name: '', link: '' });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentDocument(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDocument = () => {
    if (!currentDocument.name) {
      toast({
        title: "Erreur",
        description: "Le nom du document est obligatoire",
        variant: "destructive",
      });
      return;
    }

    const docToSave = { ...currentDocument };

    if (isEditing) {
      const updatedDocuments = documents.map(doc =>
        doc.id === docToSave.id ? docToSave : doc
      );
      setDocuments(updatedDocuments);
      saveToStorage(updatedDocuments, groups);
      toast({
        title: "Document mis à jour",
        description: "Le document a été mis à jour avec succès",
      });
    } else {
      const newDocument = { ...docToSave, id: uuidv4() };
      const updatedDocuments = [...documents, newDocument];
      setDocuments(updatedDocuments);
      saveToStorage(updatedDocuments, groups);
      toast({
        title: "Document ajouté",
        description: "Le document a été ajouté avec succès",
      });
    }

    setIsDialogOpen(false);
    setCurrentDocument({ id: '', name: '', link: '' });
  };

  const handleEditGroup = (group: DocumentGroup) => {
    setCurrentGroup(group);
    setIsEditing(true);
    setIsGroupDialogOpen(true);
  };

  const handleDeleteGroup = (id: string) => {
    const updatedGroups = groups.filter(group => group.id !== id);
    setGroups(updatedGroups);
    
    // Supprimer les groupId des documents associés
    const updatedDocuments = documents.map(doc =>
      doc.groupId === id ? { ...doc, groupId: undefined } : doc
    );
    setDocuments(updatedDocuments);
    
    saveToStorage(updatedDocuments, updatedGroups);
    toast({
      title: "Groupe supprimé",
      description: "Le groupe a été supprimé avec succès",
    });
  };

  const handleAddGroup = () => {
    setCurrentGroup({ id: '', name: '', expanded: false, items: [] });
    setIsEditing(false);
    setIsGroupDialogOpen(true);
  };

  const handleGroupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentGroup(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveGroup = () => {
    if (!currentGroup.name) {
      toast({
        title: "Erreur",
        description: "Le nom du groupe est obligatoire",
        variant: "destructive",
      });
      return;
    }

    const groupToSave = { ...currentGroup };

    if (isEditing) {
      const updatedGroups = groups.map(group =>
        group.id === groupToSave.id ? { ...groupToSave, items: group.items } : group
      );
      setGroups(updatedGroups);
      saveToStorage(documents, updatedGroups);
      toast({
        title: "Groupe mis à jour",
        description: "Le groupe a été mis à jour avec succès",
      });
    } else {
      const newGroup = { ...groupToSave, id: uuidv4(), items: [] };
      const updatedGroups = [...groups, newGroup];
      setGroups(updatedGroups);
      saveToStorage(documents, updatedGroups);
      toast({
        title: "Groupe ajouté",
        description: "Le groupe a été ajouté avec succès",
      });
    }

    setIsGroupDialogOpen(false);
    setCurrentGroup({ id: '', name: '', expanded: false, items: [] });
  };

  const handleDrop = (targetId: string, targetGroupId?: string) => {
    if (!draggedItem.id) return;
    
    const sourceId = draggedItem.id;
    const sourceGroupId = draggedItem.groupId;
    
    setDocuments(prevDocuments => {
      // 1. Retirer l'élément de sa position actuelle
      let itemToMove: Document | undefined;
      let updatedSourceDocuments = [...prevDocuments];
      
      if (sourceGroupId) {
        // L'élément vient d'un groupe
        const sourceGroup = groups.find(group => group.id === sourceGroupId);
        if (sourceGroup) {
          itemToMove = sourceGroup.items.find(item => item.id === sourceId);
          
          // Retirer l'élément du groupe source
          const updatedGroups = groups.map(group => {
            if (group.id === sourceGroupId) {
              return {
                ...group,
                items: group.items.filter(item => item.id !== sourceId)
              };
            }
            return group;
          });
          setGroups(updatedGroups);
        }
      } else {
        // L'élément vient de la liste des documents non groupés
        itemToMove = prevDocuments.find(doc => doc.id === sourceId);
        updatedSourceDocuments = prevDocuments.filter(doc => doc.id !== sourceId);
      }
      
      if (!itemToMove) return prevDocuments;
      
      // 2. Ajouter l'élément à sa nouvelle position
      itemToMove = { ...itemToMove, groupId: targetGroupId };
      let updatedTargetDocuments = [...updatedSourceDocuments];
      
      if (targetGroupId) {
        // L'élément va dans un groupe
        const updatedGroups = groups.map(group => {
          if (group.id === targetGroupId) {
            return {
              ...group,
              items: [...group.items, itemToMove].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            };
          }
          return group;
        });
        setGroups(updatedGroups);
      } else {
        // L'élément va dans la liste des documents non groupés
        updatedTargetDocuments = [...updatedSourceDocuments, itemToMove].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }
      
      saveToStorage(updatedTargetDocuments, groups);
      return updatedTargetDocuments;
    });
  };

  const handleGroupDrop = (targetGroupId: string) => {
    if (!draggedItem.id) return;
    
    const sourceId = draggedItem.id;
    
    setGroups(prevGroups => {
      // 1. Retirer le groupe de sa position actuelle
      const groupToMove = groups.find(group => group.id === sourceId);
      if (!groupToMove) return prevGroups;
      
      const updatedSourceGroups = prevGroups.filter(group => group.id !== sourceId);
      
      // 2. Trouver le groupe cible et insérer le groupe déplacé
      const targetIndex = updatedSourceGroups.findIndex(group => group.id === targetGroupId);
      if (targetIndex === -1) return prevGroups;
      
      updatedSourceGroups.splice(targetIndex + 1, 0, groupToMove);
      
      saveToStorage(documents, updatedSourceGroups);
      return updatedSourceGroups;
    });
  };

  const toggleGroup = (groupId: string) => {
    const updatedGroups = groups.map(group =>
      group.id === groupId ? { ...group, expanded: !group.expanded } : group
    );
    setGroups(updatedGroups);
    saveToStorage(documents, updatedGroups);
  };

  return {
    documents,
    groups,
    isDialogOpen,
    isGroupDialogOpen,
    isEditing,
    currentDocument,
    currentGroup,
    isSyncing,
    isOnline,
    lastSynced,
    hasUnsyncedData,
    setIsDialogOpen,
    setIsGroupDialogOpen,
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
    handleDrop,
    handleGroupDrop,
    toggleGroup,
    setDraggedItem,
    syncWithServer
  };
};
