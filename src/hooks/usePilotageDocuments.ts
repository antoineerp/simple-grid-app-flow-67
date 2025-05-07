
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/types/documents';
import { syncPilotageWithServer, loadPilotageFromStorage } from '@/services/pilotage/pilotageSyncService';

export const usePilotageDocuments = () => {
  const { toast } = useToast();
  const currentUser = localStorage.getItem('currentUser') || 'default';
  const [documents, setDocuments] = useState<Document[]>(() => loadPilotageFromStorage(currentUser));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  
  // Sauvegarder les changements dans le stockage local et synchroniser avec le serveur
  useEffect(() => {
    const savePilotageToStorage = async () => {
      localStorage.setItem(`pilotage_${currentUser}`, JSON.stringify(documents));
      
      // Si l'utilisateur est admin ou gestionnaire, aussi sauvegarder comme template
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'admin' || userRole === 'administrateur' || userRole === 'gestionnaire') {
        localStorage.setItem('pilotage_template', JSON.stringify(documents));
      }
      
      // Synchroniser avec le serveur
      try {
        await syncPilotageWithServer(documents, currentUser);
      } catch (error) {
        console.error('Erreur de synchronisation des documents de pilotage:', error);
      }
      
      // Notifier sur la mise à jour des documents
      window.dispatchEvent(new Event('pilotageUpdate'));
    };
    
    savePilotageToStorage();
  }, [documents, currentUser]);
  
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
    
    setCurrentDocument(newDocument);
    setIsEditing(false);
    setIsDialogOpen(true);
  }, [documents]);
  
  const handleEditDocument = useCallback((document: Document) => {
    setCurrentDocument({ ...document });
    setIsEditing(true);
    setIsDialogOpen(true);
  }, []);
  
  const handleDeleteDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: "Document supprimé",
      description: `Le document ${id} a été supprimé`,
    });
  }, [toast]);
  
  const handleInputChange = useCallback((field: string, value: any) => {
    setCurrentDocument(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  }, []);
  
  const handleSaveDocument = useCallback(() => {
    if (!currentDocument) return;
    
    if (isEditing) {
      // Mise à jour d'un document existant
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === currentDocument.id 
            ? { ...currentDocument, date_modification: new Date() }
            : doc
        )
      );
      
      toast({
        title: "Document mis à jour",
        description: `Le document ${currentDocument.id} a été mis à jour`,
      });
    } else {
      // Ajout d'un nouveau document
      setDocuments(prev => [...prev, { 
        ...currentDocument, 
        date_creation: new Date(),
        date_modification: new Date()
      }]);
      
      toast({
        title: "Document ajouté",
        description: `Le document ${currentDocument.id} a été ajouté`,
      });
    }
    
    setIsDialogOpen(false);
    setCurrentDocument(null);
  }, [currentDocument, isEditing, toast]);
  
  const handleReorder = useCallback((startIndex: number, endIndex: number) => {
    setDocuments(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);
  
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
