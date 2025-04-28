
import { useState, useCallback } from 'react';
import { Document, DocumentGroup } from '@/types/collaboration';

interface DraggedItem {
  id: string;
  groupId?: string;
}

export const useCollaborationDragAndDrop = (
  documents: Document[],
  setGroups: React.Dispatch<React.SetStateAction<DocumentGroup[]>>,
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
) => {
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLTableRowElement>, targetId: string, targetGroupId?: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-100');
    
    if (!draggedItem) return;
    
    const { id: draggedId, groupId: draggedGroupId } = draggedItem;
    
    // If the dragged item is the same as the target, do nothing
    if (draggedId === targetId) return;
    
    if (draggedGroupId) {
      // Moving a document from a group
      setGroups(prevGroups => {
        // Find the source group
        const sourceGroup = prevGroups.find(g => g.id === draggedGroupId);
        if (!sourceGroup) return prevGroups;
        
        if (targetGroupId) {
          // Moving to another group
          const targetGroup = prevGroups.find(g => g.id === targetGroupId);
          if (!targetGroup) return prevGroups;
          
          // Find the dragged document and the target position
          const draggedDoc = sourceGroup.items.find(item => item.id === draggedId);
          const targetIndex = targetGroup.items.findIndex(item => item.id === targetId);
          
          if (!draggedDoc) return prevGroups;
          
          // Remove from source group and add to target group at the right position
          const newGroups = prevGroups.map(group => {
            if (group.id === draggedGroupId) {
              return {
                ...group,
                items: group.items.filter(item => item.id !== draggedId)
              };
            }
            if (group.id === targetGroupId) {
              const newItems = [...group.items];
              newItems.splice(targetIndex + 1, 0, draggedDoc);
              return {
                ...group,
                items: newItems
              };
            }
            return group;
          });
          
          return newGroups;
        } else {
          // Moving to ungrouped documents
          const draggedDoc = sourceGroup.items.find(item => item.id === draggedId);
          if (!draggedDoc) return prevGroups;
          
          // Add to documents
          setDocuments(prevDocs => {
            const targetIndex = prevDocs.findIndex(doc => doc.id === targetId);
            const newDocs = [...prevDocs];
            newDocs.splice(targetIndex + 1, 0, draggedDoc);
            return newDocs;
          });
          
          // Remove from source group
          return prevGroups.map(group => {
            if (group.id === draggedGroupId) {
              return {
                ...group,
                items: group.items.filter(item => item.id !== draggedId)
              };
            }
            return group;
          });
        }
      });
    } else {
      // Moving an ungrouped document
      if (targetGroupId) {
        // Moving to a group
        setDocuments(prevDocs => {
          const draggedDoc = prevDocs.find(doc => doc.id === draggedId);
          if (!draggedDoc) return prevDocs;
          
          // Remove from documents
          const newDocs = prevDocs.filter(doc => doc.id !== draggedId);
          
          // Add to target group
          setGroups(prevGroups => {
            return prevGroups.map(group => {
              if (group.id === targetGroupId) {
                const targetIndex = group.items.findIndex(item => item.id === targetId);
                const newItems = [...group.items];
                newItems.splice(targetIndex + 1, 0, draggedDoc);
                return {
                  ...group,
                  items: newItems
                };
              }
              return group;
            });
          });
          
          return newDocs;
        });
      } else {
        // Reordering ungrouped documents
        setDocuments(prevDocs => {
          const draggedDocIndex = prevDocs.findIndex(doc => doc.id === draggedId);
          const targetIndex = prevDocs.findIndex(doc => doc.id === targetId);
          
          if (draggedDocIndex === -1 || targetIndex === -1) return prevDocs;
          
          const newDocs = [...prevDocs];
          const [removed] = newDocs.splice(draggedDocIndex, 1);
          newDocs.splice(targetIndex, 0, removed);
          
          return newDocs;
        });
      }
    }
  }, [draggedItem, setDocuments, setGroups]);

  const handleGroupDrop = useCallback((e: React.DragEvent<HTMLTableRowElement>, targetGroupId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-100');
    
    if (!draggedItem) return;
    
    const { id: draggedId, groupId: draggedGroupId } = draggedItem;
    
    // If trying to drop a group onto itself, do nothing
    if (draggedGroupId === undefined && draggedId === targetGroupId) return;
    
    if (draggedGroupId === undefined) {
      // We're dragging a group
      setGroups(prevGroups => {
        const groups = [...prevGroups];
        const draggedGroupIndex = groups.findIndex(g => g.id === draggedId);
        const targetGroupIndex = groups.findIndex(g => g.id === targetGroupId);
        
        if (draggedGroupIndex === -1 || targetGroupIndex === -1) return prevGroups;
        
        const [removed] = groups.splice(draggedGroupIndex, 1);
        groups.splice(targetGroupIndex, 0, removed);
        
        return groups;
      });
    } else {
      // We're dragging a document from a group into a group
      setGroups(prevGroups => {
        const sourceGroup = prevGroups.find(g => g.id === draggedGroupId);
        const targetGroup = prevGroups.find(g => g.id === targetGroupId);
        
        if (!sourceGroup || !targetGroup || draggedGroupId === targetGroupId) return prevGroups;
        
        const draggedDoc = sourceGroup.items.find(item => item.id === draggedId);
        
        if (!draggedDoc) return prevGroups;
        
        return prevGroups.map(group => {
          if (group.id === draggedGroupId) {
            return {
              ...group,
              items: group.items.filter(item => item.id !== draggedId)
            };
          }
          if (group.id === targetGroupId) {
            return {
              ...group,
              items: [...group.items, draggedDoc]
            };
          }
          return group;
        });
      });
    }
  }, [draggedItem, setGroups]);

  return {
    draggedItem,
    setDraggedItem,
    handleDrop,
    handleGroupDrop
  };
};
