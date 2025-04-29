
import { useCallback } from 'react';
import { Document } from '@/types/documents';

interface UseDocumentHandlersProps {
  documents: Document[];
  setEditingDocument: React.Dispatch<React.SetStateAction<Document | null>>;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleSyncWithServer: () => Promise<boolean>;
  documentMutations: {
    handleAddDocument: (document: Document) => void;
    handleEditDocument: (document: Document) => void;
  };
}

export const useDocumentHandlers = ({
  documents,
  setEditingDocument,
  setDialogOpen,
  handleSyncWithServer,
  documentMutations
}: UseDocumentHandlersProps) => {
  
  const handleEdit = useCallback((id: string | null) => {
    if (id === null) {
      // Ajout d'un nouveau document
      handleAddDocument();
      return;
    }
    
    const doc = documents.find(d => d.id === id);
    if (doc) {
      setEditingDocument(doc);
      setDialogOpen(true);
    }
  }, [documents, setEditingDocument, setDialogOpen]);

  const handleAddDocument = useCallback(() => {
    const newDocument: Document = {
      id: crypto.randomUUID(),
      nom: '',
      titre: '',
      fichier_path: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      atteinte: null,
      etat: null,
      exclusion: false,
      date_creation: new Date().toISOString(),
      date_modification: new Date().toISOString()
    };
    setEditingDocument(newDocument);
    setDialogOpen(true);
  }, [setEditingDocument, setDialogOpen]);

  // Sauvegarde d'un document + synchronisation
  const handleSaveDocument = useCallback(async (document: Document) => {
    const isNew = !documents.some(d => d.id === document.id);
    
    if (isNew) {
      documentMutations.handleAddDocument(document);
    } else {
      documentMutations.handleEditDocument(document);
    }
    
    setDialogOpen(false);
    
    // Synchroniser après sauvegarde
    try {
      console.log("Synchronisation après sauvegarde de document");
      await handleSyncWithServer();
    } catch (error) {
      console.error("Erreur lors de la synchronisation après sauvegarde:", error);
    }
  }, [documents, documentMutations, handleSyncWithServer, setDialogOpen]);
  
  return {
    handleEdit,
    handleAddDocument,
    handleSaveDocument,
  };
};
