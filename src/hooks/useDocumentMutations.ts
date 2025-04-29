
import { useCallback } from 'react';
import { Document } from '@/types/documents';
import { useToast } from '@/hooks/use-toast';

export const useDocumentMutations = (
  documents: Document[],
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
) => {
  const { toast } = useToast();

  const handleResponsabiliteChange = useCallback((id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              responsabilites: { ...(doc.responsabilites || { r: [], a: [], c: [], i: [] }), [type]: values },
              date_modification: new Date()
            } 
          : doc
      )
    );
  }, [setDocuments]);

  const handleAtteinteChange = useCallback((id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { ...doc, atteinte, etat: atteinte, date_modification: new Date() }
          : doc
      )
    );
  }, [setDocuments]);

  const handleExclusionChange = useCallback((id: string) => {
    setDocuments(prev => 
      prev.map(doc => {
        if (doc.id === id) {
          // Check if doc.etat exists before trying to use it
          const currentEtat = doc.etat || null;
          return { 
            ...doc, 
            exclusion: !doc.exclusion, 
            etat: currentEtat === 'EX' ? null : 'EX', 
            date_modification: new Date() 
          };
        }
        return doc;
      })
    );
  }, [setDocuments]);

  const handleDelete = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: "Suppression",
      description: `Le document ${id} a été supprimé`,
    });
  }, [setDocuments, toast]);

  const handleAddDocument = useCallback((document: Document) => {
    // Ensure all required properties are present
    const newDocument = {
      ...document,
      etat: document.etat || null,
      responsabilites: document.responsabilites || { r: [], a: [], c: [], i: [] },
      date_modification: new Date()
    };
    
    setDocuments(prev => [...prev, newDocument]);
    toast({
      title: "Nouveau document",
      description: `Le document a été ajouté`,
    });
  }, [setDocuments, toast]);

  const handleEditDocument = useCallback((document: Document) => {
    setDocuments(prev => 
      prev.map(doc => doc.id === document.id ? document : doc)
    );
    toast({
      title: "Document modifié",
      description: `Le document a été mis à jour`,
    });
  }, [setDocuments, toast]);

  return {
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleDelete,
    handleAddDocument,
    handleEditDocument
  };
};
