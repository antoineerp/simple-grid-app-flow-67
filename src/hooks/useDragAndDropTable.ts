
import { useState } from 'react';

interface DragAndDropState {
  draggedItem: { id: string; groupId?: string; index: number } | null;
}

export function useDragAndDropTable<T extends { id: string | number }>(
  items: T[],
  onReorder: (startIndex: number, endIndex: number, targetGroupId?: string) => void,
  getGroupId?: (item: T) => string | undefined
) {
  const [dragState, setDragState] = useState<DragAndDropState>({ draggedItem: null });

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string | number, index: number, groupId?: string) => {
    setDragState({
      draggedItem: { id: String(id), groupId, index }
    });
    
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, groupId, index }));
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-dashed', 'border-2', 'border-primary');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string | number, targetIndex: number, targetGroupId?: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
    
    if (!dragState.draggedItem) return;
    
    const sourceId = dragState.draggedItem.id;
    const sourceIndex = dragState.draggedItem.index;
    const sourceGroupId = dragState.draggedItem.groupId;
    
    if (sourceId === String(targetId) && sourceGroupId === targetGroupId) return;
    
    console.log(`Moving item from index ${sourceIndex} to ${targetIndex} (group: ${targetGroupId || 'none'})`);
    onReorder(sourceIndex, targetIndex, targetGroupId);
    
    setDragState({ draggedItem: null });
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    setDragState({ draggedItem: null });
  };

  const handleGroupDrop = (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
    
    if (!dragState.draggedItem) return;
    
    const sourceId = dragState.draggedItem.id;
    const sourceIndex = dragState.draggedItem.index;
    const sourceGroupId = dragState.draggedItem.groupId;
    
    if (sourceGroupId === groupId) return;
    
    // Find the last index in the target group
    let targetIndex = items.length;
    const groupItems = items.filter(item => getGroupId && getGroupId(item) === groupId);
    if (groupItems.length > 0) {
      const lastGroupItem = groupItems[groupItems.length - 1];
      const lastGroupItemIndex = items.findIndex(item => 
        item.id === lastGroupItem.id
      );
      if (lastGroupItemIndex !== -1) {
        targetIndex = lastGroupItemIndex + 1;
      }
    } else {
      // If no items in group yet, insert at the end
      targetIndex = items.length;
    }
    
    console.log(`Moving item from index ${sourceIndex} to group ${groupId} at index ${targetIndex}`);
    onReorder(sourceIndex, targetIndex, groupId);
    
    setDragState({ draggedItem: null });
  };

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleGroupDrop
  };
}
