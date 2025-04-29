
import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentStats, DocumentGroup } from '@/types/documents';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useToast } from '@/hooks/use-toast';
import { useDocumentSync } from './useDocumentSync';
import { useDocumentMutations } from './useDocumentMutations';
import { useDocumentGroups } from './useDocumentGroups';
import { getCurrentUser } from '@/services/auth/authService';

export const useDocumentCore = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();

  // Get current user
  const user = getCurrentUser();
  const userId = typeof user === 'object' ? (user?.email || user?.identifiant_technique || 'p71x6d_system') : user || 'p71x6d_system';

  const { loadFromServer, syncWithServer } = useDocumentSync();
  
  // Calculate document statistics
  const stats: DocumentStats = {
    total: documents.length,
    conforme: documents.filter(d => d.etat === 'C').length,
    partiellementConforme: documents.filter(d => d.etat === 'PC').length,
    nonConforme: documents.filter(d => d.etat === 'NC').length,
    exclusion: documents.filter(d => d.etat === 'EX' || d.exclusion === true).length
  };

  return {
    documents,
    setDocuments,
    groups,
    setGroups,
    editingDocument,
    setEditingDocument,
    editingGroup,
    setEditingGroup,
    dialogOpen,
    setDialogOpen,
    groupDialogOpen,
    setGroupDialogOpen,
    isSyncing,
    setIsSyncing,
    syncFailed,
    setSyncFailed,
    loadError,
    setLoadError,
    lastSynced,
    setLastSynced,
    stats,
    isOnline,
    userId,
    toast,
    loadFromServer,
    syncWithServer
  };
};
