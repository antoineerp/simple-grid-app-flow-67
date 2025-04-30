
import { useState, useEffect, useCallback } from 'react';
import { loadBibliothequeFromStorage, saveBibliothequeToStorage, getBibliothequeItems } from '@/services/bibliotheque/bibliothequeService';
import { Document, DocumentGroup, BibliothequeItem } from '@/types/bibliotheque';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const useBibliotheque = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup | null>(null);
  
  const { syncWithServer } = useGlobalSync();
  const { isOnline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  // Pour la compatibilité avec l'ancien code
  const [items, setItems] = useState<BibliothequeItem[]>([]);
  
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const currentUser = localStorage.getItem('currentUser') || 'default';
      
      // Load from storage
      const { documents: docs, groups: grps } = loadBibliothequeFromStorage(currentUser);
      setDocuments(docs);
      setGroups(grps);
      setItems(docs); // Pour la compatibilité avec l'ancien code
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  
  const handleSyncDocuments = async () => {
    if (!syncWithServer) return;
    
    setIsSyncing(true);
    setSyncFailed(false);
    
    try {
      const allDocs = [...documents];
      const currentUser = localStorage.getItem('currentUser') || 'default';
      
      const success = await syncWithServer(allDocs, { 
        tableName: 'bibliotheque',
        groups
      }, currentUser);
      
      if (success) {
        setLastSynced(new Date());
      } else {
        setSyncFailed(true);
      }
    } catch (err) {
      console.error('Error syncing documents:', err);
      setSyncFailed(true);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleAddDocument = (document: Document) => {
    const newDocuments = [...documents, document];
    const currentUser = localStorage.getItem('currentUser') || 'default';
    
    setDocuments(newDocuments);
    setItems(newDocuments);
    saveBibliothequeToStorage(newDocuments, groups, currentUser);
    setIsDialogOpen(false);
    
    // Auto-sync if online
    if (isOnline && syncWithServer) {
      handleSyncDocuments();
    }
  };
  
  const handleUpdateDocument = (document: Document) => {
    const newDocuments = documents.map(doc => 
      doc.id === document.id ? document : doc
    );
    const currentUser = localStorage.getItem('currentUser') || 'default';
    
    setDocuments(newDocuments);
    setItems(newDocuments);
    saveBibliothequeToStorage(newDocuments, groups, currentUser);
    setIsDialogOpen(false);
    
    // Auto-sync if online
    if (isOnline && syncWithServer) {
      handleSyncDocuments();
    }
  };
  
  const handleDeleteDocument = (id: string) => {
    const newDocuments = documents.filter(doc => doc.id !== id);
    const currentUser = localStorage.getItem('currentUser') || 'default';
    
    setDocuments(newDocuments);
    setItems(newDocuments);
    saveBibliothequeToStorage(newDocuments, groups, currentUser);
    setIsDialogOpen(false);
    
    // Auto-sync if online
    if (isOnline && syncWithServer) {
      handleSyncDocuments();
    }
  };
  
  const handleAddGroup = (group: DocumentGroup) => {
    const newGroups = [...groups, group];
    const currentUser = localStorage.getItem('currentUser') || 'default';
    
    setGroups(newGroups);
    saveBibliothequeToStorage(documents, newGroups, currentUser);
    setIsGroupDialogOpen(false);
    
    // Auto-sync if online
    if (isOnline && syncWithServer) {
      handleSyncDocuments();
    }
  };
  
  const handleUpdateGroup = (group: DocumentGroup) => {
    const newGroups = groups.map(g => 
      g.id === group.id ? group : g
    );
    const currentUser = localStorage.getItem('currentUser') || 'default';
    
    setGroups(newGroups);
    saveBibliothequeToStorage(documents, newGroups, currentUser);
    setIsGroupDialogOpen(false);
    
    // Auto-sync if online
    if (isOnline && syncWithServer) {
      handleSyncDocuments();
    }
  };
  
  const handleDeleteGroup = (id: string) => {
    // Remove the group and update documents that belong to it
    const newGroups = groups.filter(g => g.id !== id);
    const newDocuments = documents.map(doc => {
      if (doc.groupId === id) {
        return { ...doc, groupId: undefined };
      }
      return doc;
    });
    
    const currentUser = localStorage.getItem('currentUser') || 'default';
    
    setGroups(newGroups);
    setDocuments(newDocuments);
    setItems(newDocuments);
    saveBibliothequeToStorage(newDocuments, newGroups, currentUser);
    setIsGroupDialogOpen(false);
    
    // Auto-sync if online
    if (isOnline && syncWithServer) {
      handleSyncDocuments();
    }
  };
  
  // Pour assurer la compatibilité avec l'ancien code
  const refreshItems = fetchItems;
  
  return { 
    documents, 
    groups, 
    items,
    loading, 
    error, 
    refreshItems,
    isDialogOpen,
    isGroupDialogOpen,
    isEditing,
    currentDocument,
    currentGroup,
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
    handleSyncDocuments,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed
  };
};
