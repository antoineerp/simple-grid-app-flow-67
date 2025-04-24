import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Document } from '@/types/documents';
import { getUserId } from '@/services/auth/authService';
import { 
  loadDocumentsFromStorage, 
  saveDocumentsToStorage, 
  calculateDocumentStats,
  syncDocumentsWithServer
} from '@/services/documents';

export const useDocuments = () => {
  const { toast } = useToast();
  const userId = getUserId() || 'anonymous';
  
  const [documents, setDocuments] = useState<Document[]>(() => loadDocumentsFromStorage(userId));
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState(calculateDocumentStats(documents));
  const [isSyncing, setIsSyncing] = useState(false);

  // Update statistics when documents change
  useEffect(() => {
    setStats(calculateDocumentStats(documents));
  }, [documents]);

  // Save documents to storage when they change
  useEffect(() => {
    saveDocumentsToStorage(documents, userId);
  }, [documents, userId]);

  // Document manipulation functions
  const handleResponsabiliteChange = useCallback((id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              responsabilites: { 
                ...doc.responsabilites, 
                [type]: values
              },
              date_modification: new Date()
            } 
          : doc
      )
    );
  }, []);

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
      prev.map(doc => 
        doc.id === newDoc.id ? newDoc : doc
      )
    );
    toast({
      title: "Document mis à jour",
      description: `Le document ${newDoc.id} a été mis à jour avec succès`
    });
  }, [toast]);

  const handleAtteinteChange = useCallback((id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              etat: atteinte,
              date_modification: new Date()
            } 
          : doc
      )
    );
  }, []);

  const handleExclusionChange = useCallback((id: string) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              etat: doc.etat === 'EX' ? null : 'EX',
              date_modification: new Date()
            } 
          : doc
      )
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: "Suppression",
      description: `Le document ${id} a été supprimé`,
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

  const handleReorder = useCallback((startIndex: number, endIndex: number) => {
    setDocuments(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });

    toast({
      title: "Réorganisation",
      description: "L'ordre des documents a été mis à jour",
    });
  }, [toast]);

  const syncWithServer = useCallback(async () => {
    setIsSyncing(true);
    
    const success = await syncDocumentsWithServer(documents, userId);
    
    if (success) {
      toast({
        title: "Synchronisation réussie",
        description: "Vos documents ont été synchronisés avec le serveur",
      });
    } else {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser vos documents",
        variant: "destructive"
      });
    }
    
    setIsSyncing(false);
    return success;
  }, [documents, userId, toast]);

  return {
    documents,
    stats,
    editingDocument,
    dialogOpen,
    isSyncing,
    setDialogOpen,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleEdit,
    handleSaveDocument,
    handleDelete,
    handleAddDocument,
    handleReorder,
    syncWithServer
  };
};
