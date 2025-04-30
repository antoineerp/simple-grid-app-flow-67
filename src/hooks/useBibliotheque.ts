
import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useToast } from '@/components/ui/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getCurrentUser } from '@/services/auth/authService';

const LOCAL_STORAGE_PREFIX = 'bibliotheque_';

export const useBibliotheque = () => {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);

  // Chargement des données depuis le localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const userId = getCurrentUser() || 'default';
        const storedDocuments = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}documents_${userId}`);
        const storedGroups = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}groups_${userId}`);
        
        if (storedDocuments) {
          setDocuments(JSON.parse(storedDocuments));
        }
        
        if (storedGroups) {
          setGroups(JSON.parse(storedGroups));
        }
        
        // Charger également l'état de synchronisation
        const storedLastSynced = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}last_synced_${userId}`);
        if (storedLastSynced) {
          setLastSynced(new Date(storedLastSynced));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };
    
    loadData();
  }, []);

  // Sauvegarde des données dans le localStorage
  const saveData = useCallback(() => {
    try {
      const userId = getCurrentUser() || 'default';
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}documents_${userId}`, JSON.stringify(documents));
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}groups_${userId}`, JSON.stringify(groups));
      
      if (lastSynced) {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}last_synced_${userId}`, lastSynced.toISOString());
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des données:", error);
    }
  }, [documents, groups, lastSynced]);

  // Sauvegarde automatique des données lorsqu'elles changent
  useEffect(() => {
    saveData();
  }, [documents, groups, saveData]);

  // Ajouter un document
  const handleAddDocument = useCallback((document: Document) => {
    const newDocument = {
      ...document,
      id: document.id || `doc-${Date.now()}`,
      userId: getCurrentUser() || 'default'
    };
    
    setDocuments(prev => [...prev, newDocument]);
    setIsDialogOpen(false);
    
    toast({
      title: "Document ajouté",
      description: "Le document a été ajouté avec succès"
    });
  }, [toast]);

  // Mettre à jour un document
  const handleUpdateDocument = useCallback((document: Document) => {
    setDocuments(prev => prev.map(doc => doc.id === document.id ? document : doc));
    setIsDialogOpen(false);
    
    toast({
      title: "Document mis à jour",
      description: "Le document a été mis à jour avec succès"
    });
  }, [toast]);

  // Supprimer un document
  const handleDeleteDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    
    // Supprimer également l'ID du document des groupes
    setGroups(prev => prev.map(group => ({
      ...group,
      items: group.items.filter(itemId => itemId !== id)
    })));
    
    setIsDialogOpen(false);
    
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès"
    });
  }, [toast]);

  // Ajouter un groupe
  const handleAddGroup = useCallback((group: DocumentGroup) => {
    const newGroup = {
      ...group,
      id: group.id || `group-${Date.now()}`,
      userId: getCurrentUser() || 'default',
      expanded: false,
      items: group.items || []
    };
    
    setGroups(prev => [...prev, newGroup]);
    setIsGroupDialogOpen(false);
    
    toast({
      title: "Groupe ajouté",
      description: "Le groupe a été ajouté avec succès"
    });
  }, [toast]);

  // Mettre à jour un groupe
  const handleUpdateGroup = useCallback((group: DocumentGroup) => {
    setGroups(prev => prev.map(g => g.id === group.id ? group : g));
    setIsGroupDialogOpen(false);
    
    toast({
      title: "Groupe mis à jour",
      description: "Le groupe a été mis à jour avec succès"
    });
  }, [toast]);

  // Supprimer un groupe
  const handleDeleteGroup = useCallback((id: string) => {
    // Récupérer les documents associés à ce groupe
    const groupDocuments = documents.filter(doc => doc.groupId === id);
    
    // Supprimer le groupe
    setGroups(prev => prev.filter(group => group.id !== id));
    
    // Mettre à jour les documents pour qu'ils n'aient plus de groupe
    if (groupDocuments.length > 0) {
      setDocuments(prev => prev.map(doc => 
        doc.groupId === id ? { ...doc, groupId: undefined } : doc
      ));
    }
    
    setIsGroupDialogOpen(false);
    
    toast({
      title: "Groupe supprimé",
      description: "Le groupe a été supprimé avec succès"
    });
  }, [documents, toast]);

  // Synchroniser avec le serveur (simulation)
  const handleSyncDocuments = useCallback(async () => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Mode hors ligne",
        description: "La synchronisation n'est pas disponible en mode hors ligne"
      });
      return;
    }
    
    setIsSyncing(true);
    
    try {
      // Simuler une synchronisation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mise à jour de l'état de synchronisation
      setLastSynced(new Date());
      setSyncFailed(false);
      
      toast({
        title: "Synchronisation réussie",
        description: "Les documents ont été synchronisés avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      setSyncFailed(true);
      
      toast({
        variant: "destructive",
        title: "Échec de la synchronisation",
        description: "Une erreur est survenue lors de la synchronisation"
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, toast]);

  // Préparez et renvoyez toutes les fonctions et états nécessaires
  return {
    documents,
    groups,
    isDialogOpen,
    isGroupDialogOpen,
    isEditing,
    currentDocument,
    currentGroup,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed,
    setIsDialogOpen,
    setIsGroupDialogOpen,
    setIsEditing,
    setCurrentDocument,
    setCurrentGroup,
    handleAddDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleSyncDocuments
  };
};
