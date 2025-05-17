
import { useState, useEffect, useCallback } from 'react';
import { useSync } from './useSync';
import { Document, DocumentGroup } from '@/types/documents';
import { useToast } from './use-toast';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUserId } from '@/services/auth/authService';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { syncStatus, startSync, endSync, loading, error } = useSync('documents');
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Fonction de chargement des documents sécurisée
  const loadDocuments = useCallback(async () => {
    try {
      startSync();
      setIsSyncing(true);
      
      // Simulation de chargement des documents (à remplacer par votre logique réelle)
      const loadedDocuments = localStorage.getItem('documents');
      const parsedDocuments = loadedDocuments ? JSON.parse(loadedDocuments) : [];
      
      // Assurez-vous que parsedDocuments est un tableau
      const safeDocuments = Array.isArray(parsedDocuments) ? parsedDocuments : [];
      
      setDocuments(safeDocuments);
      
      // Extraire les groupes
      const documentGroups: DocumentGroup[] = [];
      const groupIds = new Set<string>();
      
      safeDocuments.forEach(doc => {
        if (doc.groupId && !groupIds.has(doc.groupId)) {
          groupIds.add(doc.groupId);
          documentGroups.push({
            id: doc.groupId,
            name: doc.groupId, // Default name is the ID
            expanded: true,
            items: [],
            userId: getCurrentUserId() || ''
          });
        }
      });
      
      setGroups(documentGroups);
      
      endSync();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      endSync(errorMessage);
      console.error("Erreur lors du chargement des documents:", errorMessage);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [startSync, endSync]);

  // Load initial data
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Fonction pour forcer le rechargement
  const forceReload = async () => {
    return await loadDocuments();
  };

  // Handle document mutations
  const handleResponsabiliteChange = (id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === id 
          ? {
              ...doc,
              responsabilites: {
                ...doc.responsabilites || { r: [], a: [], c: [], i: [] },
                [type]: values
              }
            }
          : doc
      )
    );
  };

  const handleAtteinteChange = (id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === id 
          ? { ...doc, etat: atteinte || undefined }
          : doc
      )
    );
  };

  const handleExclusionChange = (id: string) => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === id 
          ? { ...doc, etat: doc.etat === 'EX' ? null : 'EX' }
          : doc
      )
    );
  };

  const handleDelete = (id: string) => {
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
    
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé"
    });
  };

  // Handle document editing
  const handleEdit = (id: string) => {
    const document = documents.find(doc => doc.id === id);
    if (document) {
      setSelectedDocument(document);
    }
  };

  // Handle document reordering
  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    setDocuments(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      
      // If target group is provided, update the document's group
      const updatedDoc = targetGroupId !== undefined ? { ...removed, groupId: targetGroupId === 'none' ? undefined : targetGroupId } : removed;
      
      result.splice(endIndex, 0, updatedDoc);
      return result;
    });
  }, []);

  // Handle group reordering
  const handleGroupReorder = useCallback((startIndex: number, endIndex: number) => {
    setGroups(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  // Handle toggling group expansion
  const handleToggleGroup = useCallback((id: string) => {
    setGroups(prev => 
      prev.map(group => 
        group.id === id 
          ? { ...group, expanded: !group.expanded }
          : group
      )
    );
  }, []);

  // Handle creating/editing group
  const handleEditGroup = (group: DocumentGroup) => {
    // Find if group already exists
    const existingIndex = groups.findIndex(g => g.id === group.id);
    
    if (existingIndex >= 0) {
      // Update existing group
      setGroups(prev => {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...group };
        return updated;
      });
    } else {
      // Create new group
      setGroups(prev => [...prev, { ...group, id: group.id || uuidv4() }]);
    }
  };

  // Handle deleting a group
  const handleDeleteGroup = (id: string) => {
    // Remove the group
    setGroups(prev => prev.filter(group => group.id !== id));
    
    // Update documents that were in this group to have no group
    setDocuments(prev => 
      prev.map(doc => 
        doc.groupId === id 
          ? { ...doc, groupId: undefined }
          : doc
      )
    );
    
    toast({
      title: "Groupe supprimé",
      description: "Le groupe et ses associations ont été supprimés"
    });
  };

  // Handle adding a new document
  const handleAddDocument = useCallback(() => {
    const now = new Date();
    const newDoc: Document = {
      id: uuidv4(),
      nom: "Nouveau document",
      fichier_path: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: null,
      date_creation: now,
      date_modification: now,
      userId: getCurrentUserId() || ''
    };
    
    setDocuments(prev => [...prev, newDoc]);
    setSelectedDocument(newDoc);
    
    toast({
      title: "Document créé",
      description: "Un nouveau document a été créé"
    });
    
    return newDoc;
  }, [toast]);

  // Handle adding a new group
  const handleAddGroup = useCallback(() => {
    const newGroup: DocumentGroup = {
      id: uuidv4(),
      name: "Nouveau groupe",
      expanded: true,
      items: [],
      userId: getCurrentUserId() || ''
    };
    
    setGroups(prev => [...prev, newGroup]);
    
    toast({
      title: "Groupe créé",
      description: "Un nouveau groupe a été créé"
    });
    
    return newGroup;
  }, [toast]);

  return {
    documents,
    groups,
    selectedDocument,
    loading,
    error,
    syncStatus,
    isSyncing,
    selectDocument: (id: string) => {
      const document = documents.find(doc => doc.id === id);
      setSelectedDocument(document || null);
    },
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleDelete,
    handleEdit,
    handleReorder,
    handleGroupReorder,
    handleToggleGroup,
    handleEditGroup,
    handleDeleteGroup,
    handleAddDocument,
    handleAddGroup,
    forceReload
  };
};
