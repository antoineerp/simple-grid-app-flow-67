
import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentStats, DocumentGroup } from '@/types/documents';
import { useToast } from '@/hooks/use-toast';
import { calculateDocumentStats } from '@/services/documents/documentStatsService';
import { loadDocumentsFromStorage, saveDocumentsToStorage } from '@/services/documents';
import { useDocumentSync } from '@/features/documents/hooks/useDocumentSync';
import { useDocumentMutations } from '@/features/documents/hooks/useDocumentMutations';
import { useDocumentGroups } from '@/features/documents/hooks/useDocumentGroups';

export const useDocuments = () => {
  const { toast } = useToast();
  const currentUser = localStorage.getItem('currentUser') || 'default';
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [stats, setStats] = useState<DocumentStats>(() => calculateDocumentStats(documents));
  const [isInitialized, setIsInitialized] = useState(false);

  const { syncWithServer, loadFromServer, isSyncing } = useDocumentSync();
  const documentMutations = useDocumentMutations(documents, setDocuments);
  const groupOperations = useDocumentGroups(groups, setGroups);

  // Initial load from server with localStorage fallback
  useEffect(() => {
    if (isInitialized) return;
    
    const initializeDocuments = async () => {
      try {
        // Try to load from server first
        const serverDocuments = await loadFromServer(currentUser);
        if (serverDocuments && serverDocuments.length > 0) {
          console.log(`Loaded ${serverDocuments.length} documents from server`);
          setDocuments(serverDocuments);
          setIsInitialized(true);
          return;
        }
        
        // Fall back to localStorage if server load fails
        const localDocuments = loadDocumentsFromStorage(currentUser);
        if (localDocuments && localDocuments.length > 0) {
          console.log(`Loaded ${localDocuments.length} documents from localStorage`);
          setDocuments(localDocuments);
          
          // Try to sync with server after loading from localStorage
          try {
            await syncWithServer(localDocuments, currentUser);
          } catch (error) {
            console.error("Failed to sync after localStorage load:", error);
          }
        }
      } catch (error) {
        console.error("Error during document initialization:", error);
        
        // Ultimate fallback to localStorage
        const localDocuments = loadDocumentsFromStorage(currentUser);
        if (localDocuments && localDocuments.length > 0) {
          setDocuments(localDocuments);
        }
      } finally {
        setIsInitialized(true);
      }
    };

    initializeDocuments();
  }, [currentUser, loadFromServer, syncWithServer]);

  // Update stats when documents change
  useEffect(() => {
    setStats(calculateDocumentStats(documents));
  }, [documents]);

  // We've removed the automatic sync effect that was causing flickering
  // and only sync manually or when calling specific actions

  const handleEdit = useCallback((id: string) => {
    const documentToEdit = documents.find(doc => doc.id === id);
    if (documentToEdit) {
      setEditingDocument(documentToEdit);
      setDialogOpen(true);
    } else {
      toast({
        title: "Erreur",
        description: `Le document ${id} n'a pas été trouvé`,
        variant: "destructive"
      });
    }
  }, [documents, toast]);

  const handleSaveDocument = useCallback(
    (updatedDocument: Document) => {
      const newDoc = {
        ...updatedDocument,
        date_modification: new Date(),
      };

      setDocuments((prev) => prev.map((doc) => (doc.id === newDoc.id ? newDoc : doc)));

      // Save to localStorage as backup
      const updatedDocuments = documents.map((doc) =>
        doc.id === newDoc.id ? newDoc : doc
      );
      saveDocumentsToStorage(updatedDocuments, currentUser);

      toast({
        title: "Document mis à jour",
        description: `Le document ${newDoc.id} a été mis à jour avec succès`,
      });
    },
    [documents, currentUser, toast]
  );

  const handleAddDocument = useCallback(() => {
    const maxId = documents.length > 0 
      ? Math.max(...documents.map(d => parseInt(d.id)))
      : 0;
    
    const newId = (maxId + 1).toString();
    const newDocument: Document = {
      id: newId,
      nom: `Document ${newId}`,
      fichier_path: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: null,
      date_creation: new Date(),
      date_modification: new Date()
    };
    
    // Important: Create a new array to trigger a proper React state update
    const newDocuments = [...documents, newDocument];
    setDocuments(newDocuments);
    
    // Save to localStorage as backup
    saveDocumentsToStorage(newDocuments, currentUser);
    
    toast({
      title: "Nouveau document",
      description: `Le document ${newId} a été ajouté`,
    });
  }, [documents, currentUser, toast]);

  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    setDocuments(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      
      if (targetGroupId !== undefined) {
        removed.groupId = targetGroupId;
      }
      
      result.splice(endIndex, 0, removed);
      
      // Save to localStorage as backup
      saveDocumentsToStorage(result, currentUser);
      
      return result;
    });
  }, [currentUser]);

  const handleAddGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: DocumentGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  return {
    documents,
    groups,
    stats,
    editingDocument,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isSyncing,
    setDialogOpen,
    setGroupDialogOpen,
    ...documentMutations,
    handleEdit,
    handleSaveDocument,
    handleAddDocument,
    handleReorder,
    handleAddGroup,
    handleEditGroup,
    ...groupOperations,
    syncWithServer
  };
};
