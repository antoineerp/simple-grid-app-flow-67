import { useCallback } from 'react';
import { Document } from '@/types/bibliotheque';
import { useToast } from '@/hooks/use-toast';

export const useBibliothequeMutations = (
  documents: Document[],
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
) => {
  const { toast } = useToast();

  const handleEditDocument = useCallback((doc: Document) => {
    setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));
    toast({
      title: "Document modifié",
      description: `Le document ${doc.name} a été mis à jour`,
    });
  }, [setDocuments, toast]);

  const handleDeleteDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé",
    });
  }, [setDocuments, toast]);

  const handleAddDocument = useCallback((document: Document) => {
    setDocuments(prev => [...prev, document]);
    toast({
      title: "Document ajouté",
      description: `Le document ${document.name} a été ajouté`,
    });
  }, [setDocuments, toast]);

  return {
    handleEditDocument,
    handleDeleteDocument,
    handleAddDocument
  };
};
