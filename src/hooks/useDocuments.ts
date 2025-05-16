
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentGroup } from '@/types/documents';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';

// Service de synchronisation simulé pour l'exemple
const syncDocuments = async (docs: Document[], groups: DocumentGroup[]) => {
  localStorage.setItem('documents', JSON.stringify(docs));
  localStorage.setItem('documentGroups', JSON.stringify(groups));
  return { success: true };
};

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      try {
        // Simuler le chargement depuis une API
        const savedDocs = localStorage.getItem('documents');
        const savedGroups = localStorage.getItem('documentGroups');
        
        const docs = savedDocs ? JSON.parse(savedDocs) : [];
        const grps = savedGroups ? JSON.parse(savedGroups) : [];
        
        setDocuments(docs);
        setGroups(grps);
      } catch (error) {
        console.error('Erreur lors du chargement des documents', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les documents",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [toast]);
  
  // Sauvegarde des données
  const saveData = useCallback(async (newDocs: Document[], newGroups: DocumentGroup[]) => {
    try {
      await syncDocuments(newDocs, newGroups);
      setDocuments(newDocs);
      setGroups(newGroups);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des documents', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);
  
  // Gestion des documents
  const handleEdit = useCallback((id: string) => {
    // Implémentation à faire
    console.log('Éditer document', id);
  }, []);
  
  const handleDelete = useCallback((id: string) => {
    const newDocs = documents.filter(doc => doc.id !== id);
    saveData(newDocs, groups);
    toast({
      description: "Document supprimé",
    });
  }, [documents, groups, saveData, toast]);
  
  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    // Copie des documents pour manipulation
    const updatedDocs = [...documents];
    
    // Document à déplacer
    const [movedDoc] = updatedDocs.splice(startIndex, 1);
    
    // Si un groupe cible est spécifié, mettre à jour le groupId du document
    if (targetGroupId !== undefined) {
      movedDoc.groupId = targetGroupId || null;
    }
    
    // Réinsérer le document à la nouvelle position
    updatedDocs.splice(endIndex, 0, movedDoc);
    
    saveData(updatedDocs, groups);
  }, [documents, groups, saveData]);
  
  // Gestion des groupes
  const handleToggleGroup = useCallback((id: string) => {
    const updatedGroups = groups.map(group => 
      group.id === id ? { ...group, expanded: !group.expanded } : group
    );
    setGroups(updatedGroups);
    saveData(documents, updatedGroups);
  }, [documents, groups, saveData]);
  
  const handleEditGroup = useCallback((group: DocumentGroup) => {
    // Implémentation à faire
    console.log('Éditer groupe', group);
  }, []);
  
  const handleDeleteGroup = useCallback((id: string) => {
    // Supprimer le groupe
    const newGroups = groups.filter(group => group.id !== id);
    
    // Pour les documents de ce groupe, enlever la référence au groupe
    const newDocs = documents.map(doc => 
      doc.groupId === id ? { ...doc, groupId: null } : doc
    );
    
    saveData(newDocs, newGroups);
    toast({
      description: "Groupe supprimé",
    });
  }, [documents, groups, saveData, toast]);
  
  const handleGroupReorder = useCallback((startIndex: number, endIndex: number) => {
    const updatedGroups = [...groups];
    const [movedGroup] = updatedGroups.splice(startIndex, 1);
    updatedGroups.splice(endIndex, 0, movedGroup);
    saveData(documents, updatedGroups);
  }, [documents, groups, saveData]);
  
  // Gestion des responsabilités et autres propriétés
  const handleResponsabiliteChange = useCallback((id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    const updatedDocs = documents.map(doc => {
      if (doc.id === id) {
        // Créer une copie des responsabilités actuelles
        const newResponsabilites = { ...doc.responsabilites || {} };
        // Mettre à jour le type spécifique
        newResponsabilites[type] = values;
        
        return { ...doc, responsabilites: newResponsabilites };
      }
      return doc;
    });
    
    saveData(updatedDocs, groups);
  }, [documents, groups, saveData]);
  
  const handleAtteinteChange = useCallback((id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    const updatedDocs = documents.map(doc => 
      doc.id === id ? { ...doc, etat: atteinte } : doc
    );
    
    saveData(updatedDocs, groups);
  }, [documents, groups, saveData]);
  
  const handleExclusionChange = useCallback((id: string) => {
    const updatedDocs = documents.map(doc => {
      if (doc.id === id) {
        return { ...doc, excluded: !doc.excluded };
      }
      return doc;
    });
    
    saveData(updatedDocs, groups);
  }, [documents, groups, saveData]);
  
  // Ajout de documents et groupes
  const handleAddDocument = useCallback(() => {
    const currentUser = getCurrentUser();
    const userId = currentUser?.identifiant_technique || 'system';
    
    const newDocument: Document = {
      id: uuidv4(),
      nom: 'Nouveau document',
      fichier_path: null,
      etat: null,
      excluded: false,
      responsabilites: {
        r: [],
        a: [],
        c: [],
        i: []
      },
      date_creation: new Date(),
      date_modification: new Date(),
      userId
    };
    
    const newDocs = [...documents, newDocument];
    saveData(newDocs, groups);
    toast({
      description: "Nouveau document ajouté",
    });
  }, [documents, groups, saveData, toast]);
  
  const handleAddGroup = useCallback(() => {
    const currentUser = getCurrentUser();
    const userId = currentUser?.identifiant_technique || 'system';
    
    const newGroup: DocumentGroup = {
      id: uuidv4(),
      name: 'Nouveau groupe',
      expanded: true,
      items: [],
      userId
    };
    
    const newGroups = [...groups, newGroup];
    saveData(documents, newGroups);
    toast({
      description: "Nouveau groupe ajouté",
    });
  }, [documents, groups, saveData, toast]);
  
  return {
    documents,
    groups,
    loading,
    handleEdit,
    handleDelete,
    handleReorder,
    handleToggleGroup,
    handleEditGroup,
    handleDeleteGroup,
    handleGroupReorder,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleAddDocument,
    handleAddGroup
  };
};
