
import { useState } from 'react';
import { Document } from '@/types/documents';

interface DragAndDropHandlers {
  draggedItem: { id: string; groupId?: string } | null;
  handleDragStart: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  handleDragOver: (e: React.DragEvent<HTMLTableRowElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLTableRowElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLTableRowElement>, targetId: string, targetGroupId?: string) => void;
  handleDragEnd: (e: React.DragEvent<HTMLTableRowElement>) => void;
  handleGroupDrop: (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => void;
}

export const useDragAndDrop = (
  documents: Document[],
  onReorder: (startIndex: number, endIndex: number, targetGroupId?: string) => void,
): DragAndDropHandlers => {
  const [draggedItem, setDraggedItem] = useState<{ id: string; groupId?: string } | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => {
    setDraggedItem({ id, groupId });
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, groupId }));
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-dashed', 'border-2', 'border-primary');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string, targetGroupId?: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
    
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const { id: sourceId, groupId: sourceGroupId } = data;
    
    if (sourceId === targetId) return;
    
    let sourceIndex = -1;
    let targetIndex = -1;

    // Calculate sourceIndex
    if (sourceGroupId) {
      const groupStartIndex = documents.filter(d => !d.groupId).length;
      sourceIndex = groupStartIndex + documents.filter(d => d.groupId === sourceGroupId)
        .findIndex(d => d.id === sourceId);
    } else {
      sourceIndex = documents.filter(d => !d.groupId).findIndex(d => d.id === sourceId);
    }

    // Calculate targetIndex
    if (targetGroupId) {
      const groupStartIndex = documents.filter(d => !d.groupId).length;
      targetIndex = groupStartIndex + documents.filter(d => d.groupId === targetGroupId)
        .findIndex(d => d.id === targetId);
    } else {
      targetIndex = documents.filter(d => !d.groupId).findIndex(d => d.id === targetId);
    }

    if (sourceIndex !== -1 && targetIndex !== -1) {
      onReorder(sourceIndex, targetIndex, targetGroupId);
    }
    
    setDraggedItem(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItem(null);
  };

  const handleGroupDrop = (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      if (data.id) {
        const sourceId = data.id;
        const sourceGroupId = data.groupId;
        
        if (sourceGroupId === groupId) return;
        
        const sourceIndex = documents.findIndex(d => d.id === sourceId);
        const targetIndex = documents.filter(d => d.groupId === groupId).length;
        
        if (sourceIndex !== -1) {
          onReorder(sourceIndex, targetIndex, groupId);
        }
      }
    } catch (error) {
      console.error("Erreur lors du drop:", error);
    }
    
    setDraggedItem(null);
  };

  return {
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleGroupDrop
  };
};
