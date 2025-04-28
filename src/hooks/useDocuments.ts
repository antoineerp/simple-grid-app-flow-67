
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

  const { syncWithServer, loadFromServer } = useDocumentSync();
  const documentMutations = useDocumentMutations(documents, setDocuments);
  const groupOperations = useDocumentGroups(groups, setGroups);

  // Initial load from localStorage
  useEffect(() => {
    const loadedDocuments = loadDocumentsFromStorage(currentUser);
    if (loadedDocuments && loadedDocuments.length > 0) {
      console.log(`Loaded ${loadedDocuments.length} documents from localStorage`);
      setDocuments(loadedDocuments);
    }
    
    // Attempt to load from server after loading from localStorage
    const fetchFromServer = async () => {
      try {
        const serverDocuments = await loadFromServer(currentUser);
        if (serverDocuments && serverDocuments.length > 0) {
          console.log(`Loaded ${serverDocuments.length} documents from server`);
          setDocuments(serverDocuments);
        }
      } catch (error) {
        console.error("Error loading documents from server:", error);
      }
    };

    fetchFromServer();
  }, [currentUser, loadFromServer]);

  // Save documents to localStorage whenever they change
  useEffect(() => {
    if (documents.length > 0) {
      saveDocumentsToStorage(documents, currentUser);
      console.log(`Saved ${documents.length} documents to localStorage`);
    }
  }, [documents, currentUser]);

  // Update stats when documents change
  useEffect(() => {
    setStats(calculateDocumentStats(documents));
  }, [documents]);

  // Auto-sync effect with reduced frequency and error handling
  useEffect(() => {
    const autoSync = async () => {
      try {
        if (documents.length > 0) {
          await syncWithServer(documents, currentUser);
          console.log("Auto-sync completed successfully");
        }
      } catch (error) {
        console.error("Auto-sync failed:", error);
      }
    };

    const syncInterval = setInterval(autoSync, 600000); // Sync every 10 minutes
    return () => clearInterval(syncInterval);
  }, [documents, currentUser, syncWithServer]);

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

  const handleSaveDocument = useCallback((updatedDocument: Document) => {
    const newDoc = {
      ...updatedDocument,
      date_modification: new Date()
    };
    
    setDocuments(prev => 
      prev.map(doc => doc.id === newDoc.id ? newDoc : doc)
    );
    
    // Save to localStorage immediately after update
    const updatedDocuments = documents.map(doc => 
      doc.id === newDoc.id ? newDoc : doc
    );
    saveDocumentsToStorage(updatedDocuments, currentUser);
    
    toast({
      title: "Document mis à jour",
      description: `Le document ${newDoc.id} a été mis à jour avec succès`
    });
  }, [documents, currentUser, toast]);

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
    
    const newDocuments = [...documents, newDocument];
    setDocuments(newDocuments);
    
    // Save to localStorage immediately after adding
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
      
      // Save to localStorage immediately after reordering
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
