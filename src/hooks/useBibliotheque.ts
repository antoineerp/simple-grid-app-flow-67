
import { useState, useEffect } from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useBibliothequeSync } from '@/features/bibliotheque/hooks/useBibliothequeSync';
import { useBibliothequeMutations } from '@/features/bibliotheque/hooks/useBibliothequeMutations';
import { useBibliothequeGroups } from '@/features/bibliotheque/hooks/useBibliothequeGroups';

export const useBibliotheque = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document>({
    id: '',
    name: '',
    link: null
  });
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup>({
    id: '',
    name: '',
    expanded: false,
    items: []
  });
  const [draggedItem, setDraggedItem] = useState<{ id: string, groupId?: string } | null>(null);
  
  const currentUser = localStorage.getItem('currentUser') || 'default';

  const { 
    syncWithServer, 
    loadFromServer, 
    isSyncing, 
    isOnline, 
    lastSynced 
  } = useBibliothequeSync();
  
  const documentMutations = useBibliothequeMutations(documents, setDocuments);
  const groupOperations = useBibliothequeGroups(groups, setGroups);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      const data = await loadFromServer(currentUser);
      if (data) {
        setDocuments(data.documents);
        setGroups(data.groups);
      }
    };
    
    loadData();
  }, [currentUser]);

  // Auto-sync effect
  useEffect(() => {
    const autoSync = async () => {
      if (documents.length > 0 || groups.length > 0) {
        await syncWithServer(documents, groups, currentUser);
      }
    };

    const syncInterval = setInterval(autoSync, 300000); // Sync every 5 minutes
    return () => clearInterval(syncInterval);
  }, [documents, groups, currentUser]);

  const handleDrop = (targetId: string, targetGroupId?: string) => {
    if (!draggedItem) return;
    
    const { id: sourceId, groupId: sourceGroupId } = draggedItem;
    
    if (sourceId === targetId && sourceGroupId === targetGroupId) return;
    
    if (targetGroupId !== undefined && sourceGroupId !== targetGroupId) {
      // Move document to a group
      let docToMove;
      
      if (sourceGroupId) {
        setGroups(groups => groups.map(group => 
          group.id === sourceGroupId 
            ? { ...group, items: group.items.filter(item => item.id !== sourceId) }
            : group
        ));
        
        const sourceGroup = groups.find(g => g.id === sourceGroupId);
        docToMove = sourceGroup?.items.find(d => d.id === sourceId);
      } else {
        setDocuments(docs => docs.filter(doc => doc.id !== sourceId));
        docToMove = documents.find(d => d.id === sourceId);
      }
      
      if (docToMove) {
        setGroups(groups => groups.map(group => 
          group.id === targetGroupId
            ? { ...group, items: [...group.items, { ...docToMove, groupId: targetGroupId }] }
            : group
        ));
      }
    }
    
    setDraggedItem(null);
  };

  const handleGroupDrop = (targetGroupId: string) => {
    if (!draggedItem) return;
    
    const { id: sourceId, groupId: sourceGroupId } = draggedItem;
    
    if (sourceGroupId !== undefined && sourceId === targetGroupId) return;
    
    if (sourceGroupId === undefined && sourceId) {
      setDocuments(docs => docs.filter(doc => doc.id !== sourceId));
      
      const docToMove = documents.find(d => d.id === sourceId);
      
      if (docToMove) {
        setGroups(groups => groups.map(group => 
          group.id === targetGroupId
            ? { ...group, items: [...group.items, { ...docToMove, groupId: targetGroupId }] }
            : group
        ));
      }
    }
    
    setDraggedItem(null);
  };

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
    draggedItem,
    setIsDialogOpen,
    setIsGroupDialogOpen,
    setDraggedItem,
    handleDrop,
    handleGroupDrop,
    ...documentMutations,
    ...groupOperations
  };
};
