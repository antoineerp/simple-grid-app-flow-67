
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface Document {
  id: number;
  ordre: number;
  nom: string;
  lien: string | null;
}

export const usePilotageDocuments = () => {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const [documents, setDocuments] = useState<Document[]>([
    { id: 1, ordre: 1, nom: 'Charte institutionnelle', lien: 'Voir le document' },
    { id: 2, ordre: 2, nom: 'Objectifs stratégiques', lien: null },
    { id: 3, ordre: 3, nom: 'Objectifs opérationnels', lien: 'Voir le document' },
    { id: 4, ordre: 4, nom: 'Risques', lien: null },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  const [currentDocument, setCurrentDocument] = useState<Document>({
    id: 0,
    ordre: 0,
    nom: '',
    lien: null
  });

  const handleAddDocument = () => {
    const nextOrdre = documents.length > 0 
      ? Math.max(...documents.map(doc => doc.ordre)) + 1 
      : 1;
    
    setCurrentDocument({
      id: 0,
      ordre: nextOrdre,
      nom: '',
      lien: null
    });
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
      
      setDocuments([...documents, { ...currentDocument, id: newId }]);
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

  // Fonction simulée de synchronisation avec le serveur
  const syncWithServer = async () => {
    if (!isOnline) {
      toast({
        title: "Mode hors ligne",
        description: "La synchronisation est impossible en mode hors ligne",
        variant: "destructive"
      });
      return false;
    }

    setIsSyncing(true);
    
    try {
      // Simuler une requête API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simuler une réponse réussie
      setLastSynced(new Date());
      setSyncFailed(false);
      
      toast({
        title: "Synchronisation réussie",
        description: "Les documents ont été synchronisés avec le serveur",
      });
      
      return true;
    } catch (error) {
      console.error("Erreur de synchronisation:", error);
      setSyncFailed(true);
      
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser les documents",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsSyncing(false);
    }
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
    isOnline,
    isSyncing,
    syncFailed,
    lastSynced,
    syncWithServer
  };
};
