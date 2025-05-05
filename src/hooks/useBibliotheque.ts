
import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

export interface Document {
  id: string | number;
  title: string;
  status: string;
  groupId?: string | number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface DocumentGroup {
  id: string | number;
  name: string;
  [key: string]: any;
}

export const useBibliotheque = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const { toast } = useToast();

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsSyncing(true);
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/bibliotheque-load.php`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors du chargement des données: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents || []);
        setGroups(data.groups || []);
        setSyncFailed(false);
      } else {
        console.error("Erreur lors du chargement des données:", data.message);
        setSyncFailed(true);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
      setSyncFailed(true);
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: "Impossible de charger les documents."
      });
    } finally {
      setIsSyncing(false);
    }
  }, [toast]);

  // Initialize data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Document CRUD functions
  const handleDocumentEdit = (document: Document) => {
    // Implementation will be added later
    console.log('Edit document:', document);
  };

  const handleDocumentDelete = (documentId: string | number) => {
    // Implementation will be added later
    console.log('Delete document:', documentId);
  };

  const openDocumentDialog = (document: Document | null) => {
    // Implementation will be added later
    console.log('Open document dialog:', document);
  };

  // Group CRUD functions
  const handleGroupEdit = (group: DocumentGroup) => {
    // Implementation will be added later
    console.log('Edit group:', group);
  };

  const handleGroupDelete = (groupId: string | number) => {
    // Implementation will be added later
    console.log('Delete group:', groupId);
  };

  const openGroupDialog = (group: DocumentGroup | null) => {
    // Implementation will be added later
    console.log('Open group dialog:', group);
  };

  // Sync with server
  const syncWithServer = async () => {
    await loadData();
    return { success: !syncFailed };
  };

  return {
    documents,
    groups,
    isSyncing,
    syncFailed,
    handleDocumentEdit,
    handleDocumentDelete,
    openDocumentDialog,
    handleGroupEdit,
    handleGroupDelete,
    openGroupDialog,
    syncWithServer
  };
};
