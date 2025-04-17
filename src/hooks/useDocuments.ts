
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Document, DocumentStats } from '@/types/documents';

export const useDocuments = () => {
  const { toast } = useToast();
  const currentUser = localStorage.getItem('currentUser') || 'default';
  
  const [documents, setDocuments] = useState<Document[]>(() => loadDocumentsFromStorage());
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState<DocumentStats>({
    exclusion: 0,
    nonConforme: 0,
    partiellementConforme: 0,
    conforme: 0,
    total: 0
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Load documents from storage
  function loadDocumentsFromStorage(): Document[] {
    const storedDocuments = localStorage.getItem(`documents_${currentUser}`);
    
    if (storedDocuments) {
      return JSON.parse(storedDocuments);
    } else {
      const defaultDocuments = localStorage.getItem('documents_template') || localStorage.getItem('documents');
      
      if (defaultDocuments) {
        return JSON.parse(defaultDocuments);
      }
      
      return getDefaultDocuments();
    }
  }
  
  // Get default documents if no existing data
  function getDefaultDocuments(): Document[] {
    return [
      { 
        id: '1', 
        nom: 'Document 1',
        fichier_path: 'Voir le document',
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: 'C',
        date_creation: new Date(),
        date_modification: new Date()
      },
      { 
        id: '2', 
        nom: 'Document 2',
        fichier_path: null,
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: 'PC',
        date_creation: new Date(),
        date_modification: new Date()
      },
      { 
        id: '3', 
        nom: 'Document 3',
        fichier_path: 'Voir le document',
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: 'NC',
        date_creation: new Date(),
        date_modification: new Date()
      },
    ];
  }

  // Notify other components of document updates
  const notifyDocumentUpdate = useCallback(() => {
    window.dispatchEvent(new Event('documentUpdate'));
  }, []);

  // Save documents to storage
  const saveDocumentsToStorage = useCallback((docs: Document[]) => {
    localStorage.setItem(`documents_${currentUser}`, JSON.stringify(docs));
    
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin' || userRole === 'administrateur') {
      localStorage.setItem('documents_template', JSON.stringify(docs));
    }
    
    notifyDocumentUpdate();
  }, [currentUser, notifyDocumentUpdate]);

  // Sync with server (placeholder for future implementation)
  const syncWithServer = useCallback(async () => {
    try {
      setIsSyncing(true);
      
      // Simulate server request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/documents', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userId: currentUser, documents })
      // });
      // if (!response.ok) throw new Error('Failed to sync documents');
      
      toast({
        title: "Synchronisation réussie",
        description: "Vos documents ont été synchronisés avec le serveur",
      });
      
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser vos documents",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, toast]);

  // Calculate document statistics
  const calculateStats = useCallback((docs: Document[]) => {
    const exclusionCount = docs.filter(d => d.etat === 'EX').length;
    const nonExcludedDocuments = docs.filter(d => d.etat !== 'EX');
    
    return {
      exclusion: exclusionCount,
      nonConforme: nonExcludedDocuments.filter(d => d.etat === 'NC').length,
      partiellementConforme: nonExcludedDocuments.filter(d => d.etat === 'PC').length,
      conforme: nonExcludedDocuments.filter(d => d.etat === 'C').length,
      total: nonExcludedDocuments.length
    };
  }, []);

  // Update statistics when documents change
  useEffect(() => {
    setStats(calculateStats(documents));
  }, [documents, calculateStats]);

  // Save documents to storage when they change
  useEffect(() => {
    saveDocumentsToStorage(documents);
  }, [documents, saveDocumentsToStorage]);

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
