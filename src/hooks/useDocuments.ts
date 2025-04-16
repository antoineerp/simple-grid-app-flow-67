
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Document, DocumentStats } from '@/types/documents';

export const useDocuments = () => {
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<Document[]>(() => {
    const storedDocuments = localStorage.getItem('documents');
    return storedDocuments ? JSON.parse(storedDocuments) : [
      { 
        id: 1, 
        nom: 'Document 1', 
        lien: 'Voir le document', 
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: 'C' 
      },
      { 
        id: 2, 
        nom: 'Document 2', 
        lien: null, 
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: 'PC' 
      },
      { 
        id: 3, 
        nom: 'Document 3', 
        lien: 'Voir le document', 
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: 'NC' 
      },
    ];
  });

  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState<DocumentStats>({
    exclusion: 0,
    nonConforme: 0,
    partiellementConforme: 0,
    conforme: 0,
    total: 0
  });

  useEffect(() => {
    localStorage.setItem('documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    const newStats = {
      exclusion: documents.filter(d => d.etat === 'EX').length,
      nonConforme: documents.filter(d => d.etat === 'NC').length,
      partiellementConforme: documents.filter(d => d.etat === 'PC').length,
      conforme: documents.filter(d => d.etat === 'C').length,
      total: documents.length
    };
    setStats(newStats);
  }, [documents]);

  const handleResponsabiliteChange = (id: number, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              responsabilites: { 
                ...doc.responsabilites, 
                [type]: values
              } 
            } 
          : doc
      )
    );
  };

  const handleEdit = (id: number) => {
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
  };

  const handleSaveDocument = (updatedDocument: Document) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === updatedDocument.id ? updatedDocument : doc
      )
    );
    toast({
      title: "Document mis à jour",
      description: `Le document ${updatedDocument.id} a été mis à jour avec succès`
    });
  };

  const handleExclusionChange = (id: number) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { ...doc, etat: doc.etat === 'EX' ? null : 'EX' } 
          : doc
      )
    );
  };

  const handleAtteinteChange = (id: number, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { ...doc, etat: atteinte } 
          : doc
      )
    );
  };

  const handleAddDocument = () => {
    const newId = documents.length > 0 
      ? Math.max(...documents.map(d => d.id)) + 1 
      : 1;
    
    const newDocument: Document = {
      id: newId,
      nom: `Document ${newId}`,
      lien: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: null
    };
    
    setDocuments(prev => [...prev, newDocument]);
    
    toast({
      title: "Nouveau document",
      description: `Le document ${newId} a été ajouté`,
    });
  };

  const handleDelete = (id: number) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: "Suppression",
      description: `Le document ${id} a été supprimé`,
    });
  };

  const handleReorder = (startIndex: number, endIndex: number) => {
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
  };

  return {
    documents,
    stats,
    editingDocument,
    dialogOpen,
    setDialogOpen,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleEdit,
    handleSaveDocument,
    handleDelete,
    handleAddDocument,
    handleReorder
  };
};
