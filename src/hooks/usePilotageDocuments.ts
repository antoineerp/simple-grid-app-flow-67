
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getCurrentUserId } from '@/services/core/userService';

interface Document {
  id: number;
  ordre: number;
  nom: string;
  lien: string | null;
  userId?: string;
}

// Test data sets
const antcirierDocuments: Document[] = [
  { id: 1, ordre: 1, nom: 'Politique qualité', lien: 'politique-qualite.pdf', userId: 'p71x6d_cirier' },
  { id: 2, ordre: 2, nom: 'Manuel qualité', lien: 'manuel-qualite.pdf', userId: 'p71x6d_cirier' },
  { id: 3, ordre: 3, nom: 'Plan d\'action', lien: null, userId: 'p71x6d_cirier' },
  { id: 4, ordre: 4, nom: 'Analyse des risques', lien: 'analyse-risques.xlsx', userId: 'p71x6d_cirier' },
];

const defaultDocuments: Document[] = [
  { id: 1, ordre: 1, nom: 'Document test 1', lien: null, userId: undefined },
  { id: 2, ordre: 2, nom: 'Document test 2', lien: 'document-test.pdf', userId: undefined },
];

export const usePilotageDocuments = () => {
  const { toast } = useToast();
  const currentUser = getCurrentUserId();
  const isAntcirier = currentUser === 'p71x6d_cirier';
  
  // Initialiser avec les données de test appropriées
  const [documents, setDocuments] = useState<Document[]>(
    isAntcirier ? antcirierDocuments : defaultDocuments
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document>({
    id: 0,
    ordre: 0,
    nom: '',
    lien: null,
    userId: undefined
  });

  // Effect pour mettre à jour les documents quand l'utilisateur change
  useEffect(() => {
    setDocuments(isAntcirier ? antcirierDocuments : defaultDocuments);
  }, [isAntcirier]);

  const handleAddDocument = () => {
    const nextOrdre = documents.length > 0 
      ? Math.max(...documents.map(doc => doc.ordre)) + 1 
      : 1;
    
    const newDocument: Document = {
      id: 0,
      ordre: nextOrdre,
      nom: '',
      lien: null,
      userId: isAntcirier ? 'p71x6d_cirier' : undefined
    };
    
    setCurrentDocument(newDocument);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEditDocument = (doc: Document) => {
    setCurrentDocument({ ...doc });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteDocument = (id: number) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentDocument({
      ...currentDocument,
      [name]: value
    });
  };

  const handleSaveDocument = () => {
    if (currentDocument.nom.trim() === '') {
      toast({
        title: "Erreur",
        description: "Le nom du document est requis",
        variant: "destructive",
      });
      return;
    }

    if (isEditing) {
      setDocuments(documents.map(doc => 
        doc.id === currentDocument.id ? currentDocument : doc
      ));
      toast({
        title: "Document mis à jour",
        description: "Le document a été mis à jour avec succès",
      });
    } else {
      const newId = documents.length > 0 
        ? Math.max(...documents.map(doc => doc.id)) + 1 
        : 1;
      
      // Créer une copie complète avec l'ID et s'assurer que userId est défini
      const newDoc: Document = { 
        ...currentDocument, 
        id: newId,
        userId: isAntcirier ? 'p71x6d_cirier' : currentDocument.userId
      };
      
      setDocuments([...documents, newDoc]);
      toast({
        title: "Document ajouté",
        description: "Le nouveau document a été ajouté avec succès",
      });
    }
    
    setIsDialogOpen(false);
  };

  const handleReorder = (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return;
    
    const result = Array.from(documents);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    const updatedDocuments = result.map((doc, index) => ({
      ...doc,
      ordre: index + 1
    }));
    
    setDocuments(updatedDocuments);
    
    toast({
      title: "Ordre mis à jour",
      description: "L'ordre des documents a été mis à jour avec succès",
    });
  };

  return {
    documents,
    isDialogOpen,
    setIsDialogOpen,
    isEditing,
    currentDocument,
    handleAddDocument,
    handleEditDocument,
    handleDeleteDocument,
    handleInputChange,
    handleSaveDocument,
    handleReorder,
  };
};
