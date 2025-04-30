
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
    
    if (!draggedItem) return;
    
    const { id: sourceId, groupId: sourceGroupId } = draggedItem;
    
    if (sourceId === targetId && sourceGroupId === targetGroupId) return;
    
    // Trouver les index pour la réorganisation
    const allDocs = [...documents];
    
    const sourceIndex = allDocs.findIndex(d => d.id === sourceId);
    const targetIndex = allDocs.findIndex(d => d.id === targetId);
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      console.log(`Déplacement du document ${sourceId} vers ${targetId} (groupe: ${targetGroupId || 'aucun'})`);
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
    
    if (!draggedItem) return;
    
    const { id: sourceId, groupId: sourceGroupId } = draggedItem;
    
    if (sourceGroupId === groupId) return;
    
    // Trouver le document qui est en train d'être déplacé
    const sourceDocument = documents.find(d => d.id === sourceId);
    
    if (sourceDocument) {
      const sourceIndex = documents.findIndex(d => d.id === sourceId);
      
      // Obtenir la dernière position dans le groupe cible
      const targetGroupDocs = documents.filter(d => d.groupId === groupId);
      const targetIndex = targetGroupDocs.length > 0 ? 
        documents.indexOf(targetGroupDocs[targetGroupDocs.length - 1]) + 1 : 
        documents.length;
      
      console.log(`Déplacement du document ${sourceId} vers le groupe ${groupId} (index: ${targetIndex})`);
      onReorder(sourceIndex, targetIndex, groupId);
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
