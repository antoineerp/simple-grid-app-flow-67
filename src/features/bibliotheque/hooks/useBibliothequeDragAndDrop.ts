
import { useState, useCallback } from 'react';
import { Document } from '@/types/bibliotheque';

interface DragAndDropState {
  draggedItem: { id: string; groupId?: string } | null;
}

export const useBibliothequeDragAndDrop = (
  documents: Document[],
  setGroups: React.Dispatch<React.SetStateAction<any[]>>,
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
) => {
  const [draggedItem, setDraggedItem] = useState<DragAndDropState['draggedItem']>(null);

  const handleDrop = useCallback((targetId: string, targetGroupId?: string) => {
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
        
        docToMove = documents.find(doc => doc.id === sourceId);
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
  }, [draggedItem, documents, setGroups, setDocuments]);

  const handleGroupDrop = useCallback((targetGroupId: string) => {
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
  }, [draggedItem, documents, setGroups, setDocuments]);

  return {
    draggedItem,
    setDraggedItem,
    handleDrop,
    handleGroupDrop
  };
};
