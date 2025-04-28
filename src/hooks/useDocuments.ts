
import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentStats, DocumentGroup } from '@/types/documents';
import { useToast } from '@/hooks/use-toast';
import { calculateDocumentStats } from '@/services/documents/documentStatsService';
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

  const { syncWithServer, loadFromServer, isSyncing, isOnline, lastSynced } = useDocumentSync();
  const documentMutations = useDocumentMutations(documents, setDocuments);
  const groupOperations = useDocumentGroups(groups, setGroups);

  // Initial load
  useEffect(() => {
    const fetchDocuments = async () => {
      const serverDocuments = await loadFromServer(currentUser);
      if (serverDocuments) {
        setDocuments(serverDocuments);
      }
    };

    fetchDocuments();
  }, [currentUser]);

  // Update stats when documents change
  useEffect(() => {
    setStats(calculateDocumentStats(documents));
  }, [documents]);

  // Auto-sync effect
  useEffect(() => {
    const autoSync = async () => {
      if (documents.length > 0) {
        await syncWithServer(documents, currentUser);
      }
    };

    const syncInterval = setInterval(autoSync, 300000); // Sync every 5 minutes
    return () => clearInterval(syncInterval);
  }, [documents, currentUser]);

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
    
    toast({
      title: "Document mis à jour",
      description: `Le document ${newDoc.id} a été mis à jour avec succès`
    });
  }, [toast]);

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
    
    setDocuments(prev => [...prev, newDocument]);
    toast({
      title: "Nouveau document",
      description: `Le document ${newId} a été ajouté`,
    });
  }, [documents, toast]);

  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    setDocuments(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      
      if (targetGroupId !== undefined) {
        removed.groupId = targetGroupId;
      }
      
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const handleAddGroup = useCallback(() => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: DocumentGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  }, []);

  const forceSyncWithServer = async () => {
    await syncWithServer(documents, currentUser);
  };

  return {
    documents,
    groups,
    stats,
    editingDocument,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isSyncing,
    isOnline,
    lastSynced,
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
    syncWithServer: forceSyncWithServer
  };
};
