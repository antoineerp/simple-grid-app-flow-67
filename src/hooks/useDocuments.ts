
import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentStats, DocumentGroup } from '@/types/documents';
import { useToast } from '@/hooks/use-toast';
import { calculateDocumentStats } from '@/services/documents/documentStatsService';
import { loadDocumentsFromServer, syncDocumentsWithServer } from '@/services/documents/documentSyncService';
import { useDocumentMutations } from '@/features/documents/hooks/useDocumentMutations';
import { useDocumentGroups } from '@/features/documents/hooks/useDocumentGroups';
import { getCurrentUser } from '@/services/auth/authService';

export const useDocuments = () => {
  const { toast } = useToast();
  const user = getCurrentUser();
  const currentUser = typeof user === 'object' ? user?.identifiant_technique || 'p71x6d_system' : user || 'p71x6d_system';
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [stats, setStats] = useState<DocumentStats>(() => calculateDocumentStats(documents));
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Initial load from server
  useEffect(() => {
    if (isInitialized) return;
    
    const initializeDocuments = async () => {
      try {
        setIsSyncing(true);
        const serverDocuments = await loadDocumentsFromServer(currentUser);
        if (serverDocuments) {
          console.log(`Loaded ${serverDocuments.length} documents from server`);
          setDocuments(serverDocuments);
          setLastSynced(new Date());
          setSyncFailed(false);
        }
      } catch (error) {
        console.error("Error during document initialization:", error);
        setSyncFailed(true);
        toast({
          title: "Erreur de chargement",
          description: error instanceof Error ? error.message : "Erreur lors du chargement des documents",
          variant: "destructive"
        });
      } finally {
        setIsSyncing(false);
        setIsInitialized(true);
      }
    };

    initializeDocuments();
  }, [currentUser, toast]);

  // Update stats when documents change
  useEffect(() => {
    setStats(calculateDocumentStats(documents));
  }, [documents]);

  const syncWithServer = async (): Promise<boolean> => {
    if (isSyncing) {
      console.log("Une synchronisation est déjà en cours");
      return false;
    }

    setIsSyncing(true);
    try {
      const success = await syncDocumentsWithServer(documents, currentUser);
      setSyncFailed(!success);
      if (success) {
        setLastSynced(new Date());
        toast({
          title: "Synchronisation réussie",
          description: "Les documents ont été synchronisés avec le serveur"
        });
      }
      return success;
    } catch (error) {
      setSyncFailed(true);
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Erreur lors de la synchronisation",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const documentMutations = useDocumentMutations(documents, setDocuments);
  const groupOperations = useDocumentGroups(groups, setGroups);

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

      // Synchronize with server after document update
      syncWithServer().catch(error => {
        console.error("Erreur lors de la synchronisation après mise à jour:", error);
      });

      toast({
        title: "Document mis à jour",
        description: `Le document ${newDoc.id} a été mis à jour avec succès`,
      });
    },
    [toast]
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
    
    // Synchronize with server after adding document
    syncWithServer().catch(error => {
      console.error("Erreur lors de la synchronisation après ajout:", error);
    });
    
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
      
      // Synchronize with server after reordering
      syncWithServer().catch(error => {
        console.error("Erreur lors de la synchronisation après réorganisation:", error);
      });
      
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

  return {
    documents,
    groups,
    stats,
    editingDocument,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isSyncing,
    syncFailed,
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
    syncWithServer
  };
};
