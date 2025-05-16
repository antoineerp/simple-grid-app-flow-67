
import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentGroup } from '@/types/documents';
import { useToast } from './use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useDocumentMutations } from '@/features/documents/hooks/useDocumentMutations';
import { useDocumentGroups } from '@/features/documents/hooks/useDocumentGroups';
import { useDocumentSync } from '@/features/documents/hooks/useDocumentSync';
import { getCurrentUserId } from '@/services/auth/authService';
import { useSyncContext } from '@/contexts/SyncContext';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use the centralized sync context
  let syncContext;
  try {
    syncContext = useSyncContext();
  } catch (e) {
    console.warn("SyncContext not available in useDocuments, fallback to local implementation");
  }
  
  // Set up local sync state in case the context isn't available
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const isOnline = navigator.onLine;
  
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
  
  // Unified load method for documents - used initially and for refreshes
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsSyncing(true);
    
    try {
      // Get current user ID
      const userId = getCurrentUserId() || '';
      
      // Try to load from local storage first
      let localDocs: Document[] = [];
      try {
        const storedData = localStorage.getItem(`documents_${userId}`);
        if (storedData) {
          localDocs = JSON.parse(storedData);
          console.log(`Loaded ${localDocs.length} documents from local storage`);
        }
      } catch (localErr) {
        console.error("Error loading documents from local storage:", localErr);
      }
      
      // Set initial data from local storage to prevent blank page
      if (localDocs.length > 0) {
        setDocuments(localDocs);
        
        // Extract groups
        const documentGroups: DocumentGroup[] = [];
        const groupIds = new Set<string>();
        
        localDocs.forEach(doc => {
          if (doc.groupId && !groupIds.has(doc.groupId)) {
            groupIds.add(doc.groupId);
            documentGroups.push({
              id: doc.groupId,
              name: doc.groupId,
              expanded: true,
              items: [],
              userId
            });
          }
        });
        
        setGroups(documentGroups);
      }
      
      // Only try to load from server if we're online
      if (navigator.onLine) {
        // Use the sync context if available
        if (syncContext) {
          // Register for sync without modifying data
          syncContext.registerTableForSync?.('documents');
          
          // Request load via sync context
          await syncContext.loadData?.('documents');
          setLastSynced(new Date());
        } else {
          // Fallback to direct API call if context not available
          const { loadFromServer } = useDocumentSync();
          const docs = await loadFromServer(userId);
          
          if (docs) {
            setDocuments(docs);
            
            // Extract groups
            const documentGroups: DocumentGroup[] = [];
            const groupIds = new Set<string>();
            
            docs.forEach(doc => {
              if (doc.groupId && !groupIds.has(doc.groupId)) {
                groupIds.add(doc.groupId);
                documentGroups.push({
                  id: doc.groupId,
                  name: doc.groupId,
                  expanded: true,
                  items: [],
                  userId
                });
              }
            });
            
            setGroups(documentGroups);
            
            // Save to localStorage
            localStorage.setItem(`documents_${userId}`, JSON.stringify(docs));
          }
        }
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error("Error loading documents:", errorMessage);
      return false;
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [syncContext]);

  // Load initial data
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Select a document
  const selectDocument = (id: string) => {
    const document = documents.find(doc => doc.id === id);
    setSelectedDocument(document || null);
  };
  
  // Force reload data
  const forceReload = async () => {
    return await loadDocuments();
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

  // Handle adding a new document
  const handleAddDocument = useCallback(() => {
    const newDoc: Document = {
      id: uuidv4(),
      nom: "Nouveau document",
      fichier_path: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: null,
      date_creation: new Date(),
      date_modification: new Date(),
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
    lastSynced,
    selectDocument,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleDelete,
    handleEdit,
    handleReorder,
    handleGroupReorder,
    handleToggleGroup,
    handleSaveGroup,
    handleDeleteGroup,
    handleEditGroup,
    handleAddDocument,
    handleAddGroup,
    forceReload,
    isSyncing
  };
};
