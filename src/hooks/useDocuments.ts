
import { useState, useEffect, useCallback } from 'react';
import { useSync } from './useSync';
import { Document, DocumentGroup } from '@/types/documents';
import { useToast } from './use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useDocumentMutations } from '@/features/documents/hooks/useDocumentMutations';
import { useDocumentGroups } from '@/features/documents/hooks/useDocumentGroups';
import { useDocumentSync } from '@/features/documents/hooks/useDocumentSync';
import { getCurrentUserId } from '@/services/auth/authService';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { syncStatus, startSync, endSync, loading, error } = useSync('documents');
  const { toast } = useToast();
  const { syncWithServer, loadFromServer, isSyncing } = useDocumentSync();
  
  // Document mutations
  const {
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleDelete
  } = useDocumentMutations(documents, setDocuments);
  
  // Group mutations
  const {
    handleGroupReorder,
    handleToggleGroup,
    handleSaveGroup,
    handleDeleteGroup
  } = useDocumentGroups(groups, setGroups);

  // Function to synchronize and process documents
  const syncAndProcess = useCallback(async () => {
    startSync();
    try {
      // Get current user ID
      const userId = getCurrentUserId() || '';
      
      // Load documents from server (or local storage if offline)
      const loadedDocuments = await loadFromServer(userId);
      
      if (loadedDocuments) {
        setDocuments(loadedDocuments);
        
        // Extract groups from documents
        const documentGroups: DocumentGroup[] = [];
        const groupIds = new Set<string>();
        
        loadedDocuments.forEach(doc => {
          if (doc.groupId && !groupIds.has(doc.groupId)) {
            groupIds.add(doc.groupId);
            documentGroups.push({
              id: doc.groupId,
              name: doc.groupId, // Default name is the ID
              expanded: true,
              items: [],
              userId: userId
            });
          }
        });
        
        setGroups(documentGroups);
      }
      
      endSync();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      endSync(errorMessage);
      return false;
    }
  }, [startSync, endSync, loadFromServer]);

  // Load initial data
  useEffect(() => {
    syncAndProcess();
  }, [syncAndProcess]);

  // Select a document
  const selectDocument = (id: string) => {
    const document = documents.find(doc => doc.id === id);
    setSelectedDocument(document || null);
  };
  
  // Force reload data
  const forceReload = async () => {
    return await syncAndProcess();
  };

  // Handle document editing
  const handleEdit = (id: string) => {
    const document = documents.find(doc => doc.id === id);
    if (document) {
      setSelectedDocument(document);
      // Additional logic for editing could be added here
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

  // Handle creating/editing group
  const handleEditGroup = (group: DocumentGroup) => {
    handleSaveGroup(group, true);
  };
  
  // Handle adding a new document
  const handleAddDocument = () => {
    const userId = getCurrentUserId() || '';
    const newDoc: Document = {
      id: uuidv4(),
      nom: 'Nouveau document',
      fichier_path: null,
      responsabilites: {
        r: [],
        a: [],
        c: [],
        i: []
      },
      etat: null,
      date_creation: new Date(),
      date_modification: new Date(),
      userId: userId
    };
    
    setDocuments(prev => [...prev, newDoc]);
    setSelectedDocument(newDoc);
    
    toast({
      title: "Document créé",
      description: "Un nouveau document a été créé",
    });
  };

  // Handle adding a new group
  const handleAddGroup = () => {
    const userId = getCurrentUserId() || '';
    const newGroup: DocumentGroup = {
      id: uuidv4(),
      name: 'Nouveau groupe',
      expanded: true,
      items: [],
      userId: userId
    };
    
    setGroups(prev => [...prev, newGroup]);
    
    toast({
      title: "Groupe créé",
      description: "Un nouveau groupe a été créé",
    });
  };

  return {
    documents,
    groups,
    selectedDocument,
    selectDocument,
    syncStatus,
    startSync,
    endSync,
    loading,
    error,
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
    isSyncing,
    syncAndProcess
  };
};

export default useDocuments;
