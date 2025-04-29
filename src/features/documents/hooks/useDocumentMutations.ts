
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
              responsabilites: { ...doc.responsabilites, [type]: values },
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
          ? { ...doc, etat: atteinte, date_modification: new Date() }
          : doc
      )
    );
  }, [setDocuments]);

  const handleExclusionChange = useCallback((id: string) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { ...doc, etat: doc.etat === 'EX' ? null : 'EX', date_modification: new Date() }
          : doc
      )
    );
  }, [setDocuments]);

  const handleDelete = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: "Suppression",
      description: `Le document ${id} a été supprimé`,
    });
  }, [setDocuments, toast]);

  return {
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleDelete
  };
};
