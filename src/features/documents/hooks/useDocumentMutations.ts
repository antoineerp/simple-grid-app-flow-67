
import { useCallback } from 'react';
import { Document } from '@/types/documents';
import { useToast } from '@/hooks/use-toast';

export const useDocumentMutations = (
  documents: Document[],
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
) => {
  const { toast } = useToast();

  const handleResponsabiliteChange = useCallback((id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          responsabilites: {
            ...doc.responsabilites,
            [type]: values
          }
        };
      }
      return doc;
    }));
  }, [setDocuments]);

  const handleAtteinteChange = useCallback((id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        return { ...doc, atteinte, etat: atteinte };
      }
      return doc;
    }));
  }, [setDocuments]);

  const handleExclusionChange = useCallback((id: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        const exclusion = !doc.exclusion;
        return { 
          ...doc, 
          exclusion,
          atteinte: exclusion ? null : doc.atteinte,
          etat: exclusion ? 'EX' : doc.atteinte
        };
      }
      return doc;
    }));
  }, [setDocuments]);

  const handleDelete = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès."
    });
  }, [setDocuments, toast]);

  const handleEditDocument = useCallback((doc: Document) => {
    setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));
    toast({
      title: "Document modifié",
      description: `Le document ${doc.nom || doc.titre} a été mis à jour`
    });
  }, [setDocuments, toast]);

  const handleAddDocument = useCallback((document: Document) => {
    setDocuments(prev => [...prev, document]);
    toast({
      title: "Document ajouté",
      description: `Le document ${document.nom || document.titre} a été ajouté`
    });
  }, [setDocuments, toast]);

  return {
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleDelete,
    handleEditDocument,
    handleAddDocument
  };
};
