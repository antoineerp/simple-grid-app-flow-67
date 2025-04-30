
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
    
    // Debug log
    console.log(`Déplacement de ${sourceId} (groupe: ${sourceGroupId || 'aucun'}) vers ${targetId} (groupe: ${targetGroupId || 'aucun'})`);
    
    if (targetGroupId !== undefined) {
      // Move document to a group
      let docToMove: Document | undefined;
      
      if (sourceGroupId) {
        // Source is in a group
        setGroups(groups => {
          const updatedGroups = groups.map(group => {
            if (group.id === sourceGroupId) {
              const filteredItems = group.items.filter(item => item.id !== sourceId);
              const foundItem = group.items.find(item => item.id === sourceId);
              if (foundItem) docToMove = foundItem;
              return { ...group, items: filteredItems };
            }
            return group;
          });
          
          return updatedGroups;
        });
      } else {
        // Source is not in a group
        docToMove = documents.find(doc => doc.id === sourceId);
        setDocuments(docs => docs.filter(doc => doc.id !== sourceId));
      }
      
      if (docToMove) {
        // Ensure we update the groupId on the document
        const docWithGroupId = { ...docToMove, groupId: targetGroupId };
        console.log(`Document à déplacer:`, docWithGroupId);
        
        setGroups(groups => {
          return groups.map(group => {
            if (group.id === targetGroupId) {
              // Add the document to the target group
              const updatedGroup = { 
                ...group, 
                items: [...group.items, docWithGroupId] 
              };
              console.log(`Groupe mis à jour:`, updatedGroup);
              return updatedGroup;
            }
            return group;
          });
        });
      }
    } else {
      // Move to standalone documents
      if (sourceGroupId) {
        // Source is in a group, move to standalone
        let docToMove: Document | undefined;
        
        setGroups(groups => {
          const updatedGroups = groups.map(group => {
            if (group.id === sourceGroupId) {
              const filteredItems = group.items.filter(item => item.id !== sourceId);
              const foundItem = group.items.find(item => item.id === sourceId);
              if (foundItem) docToMove = foundItem;
              return { ...group, items: filteredItems };
            }
            return group;
          });
          
          return updatedGroups;
        });
        
        if (docToMove) {
          // Remove the groupId
          const docWithoutGroupId = { ...docToMove };
          delete docWithoutGroupId.groupId;
          console.log(`Document sorti du groupe:`, docWithoutGroupId);
          
          setDocuments(docs => [...docs, docWithoutGroupId]);
        }
      }
    }
    
    setDraggedItem(null);
  }, [draggedItem, documents, setGroups, setDocuments]);

  const handleGroupDrop = useCallback((targetGroupId: string) => {
    if (!draggedItem) return;
    
    const { id: sourceId, groupId: sourceGroupId } = draggedItem;
    
    if (sourceGroupId === targetGroupId) return;
    
    console.log(`Déplacement du document ${sourceId} vers le groupe ${targetGroupId}`);
    
    let docToMove: Document | undefined;
    
    if (sourceGroupId) {
      // Moving from one group to another
      setGroups(groups => {
        const updatedGroups = groups.map(group => {
          if (group.id === sourceGroupId) {
            const filteredItems = group.items.filter(item => item.id !== sourceId);
            const foundItem = group.items.find(item => item.id === sourceId);
            if (foundItem) docToMove = foundItem;
            return { ...group, items: filteredItems };
          }
          return group;
        });
        
        return updatedGroups;
      });
    } else {
      // Moving from standalone to a group
      docToMove = documents.find(d => d.id === sourceId);
      setDocuments(docs => docs.filter(doc => doc.id !== sourceId));
    }
    
    if (docToMove) {
      // Ensure we update the groupId on the document
      const docWithGroupId = { ...docToMove, groupId: targetGroupId };
      console.log(`Document à déplacer dans le groupe:`, docWithGroupId);
      
      setGroups(groups => {
        return groups.map(group => {
          if (group.id === targetGroupId) {
            // Add the document to the target group
            const updatedGroup = {
              ...group, 
              items: [...group.items, docWithGroupId] 
            };
            console.log(`Groupe mis à jour:`, updatedGroup);
            return updatedGroup;
          }
          return group;
        });
      });
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
