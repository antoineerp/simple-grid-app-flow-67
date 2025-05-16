
import React from 'react';
import { Document } from '@/types/documents';
import type { DocumentGroup as DocumentGroupType } from '@/types/documents';
import DocumentTable from './table/DocumentTable';
import { useDragAndDrop } from './table/useDragAndDrop';

interface DocumentTableWrapperProps {
  documents: Document[];
  groups: DocumentGroupType[];
  onResponsabiliteChange: (id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => void;
  onAtteinteChange: (id: string, atteinte: 'NC' | 'PC' | 'C' | null) => void;
  onExclusionChange: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (startIndex: number, endIndex: number, targetGroupId?: string) => void;
  onGroupReorder: (startIndex: number, endIndex: number) => void;
  onToggleGroup: (id: string) => void;
  onEditGroup: (group: DocumentGroupType) => void;
  onDeleteGroup: (id: string) => void;
}

/**
 * DocumentTableWrapper - Composant wrapper pour l'ancien DocumentTable
 * Cela permet d'utiliser l'ancien composant tout en conservant sa fonctionnalité complète
 */
const DocumentTableWrapper: React.FC<DocumentTableWrapperProps> = (props) => {
  // Utiliser la même logique que l'ancien composant
  const { documents, groups } = props;
  
  // Filtrer les documents qui n'appartiennent à aucun groupe
  const ungroupedDocuments = documents.filter(d => !d.groupId);
  
  // Pour chaque groupe, ajouter les documents correspondants
  const groupsWithItems = groups.map(group => {
    // Trouver tous les documents appartenant à ce groupe
    const groupItems = documents.filter(doc => doc.groupId === group.id);
    
    // Retourner le groupe avec ses documents
    return {
      ...group,
      items: groupItems
    };
  });
  
  const {
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleGroupDrop
  } = useDragAndDrop(documents, props.onReorder);

  const handleGroupDragStart = (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ groupId }));
    e.currentTarget.classList.add('opacity-50');
  };

  // Utiliser l'ancien composant avec les données préparées
  return (
    <DocumentTable
      {...props}
      groupsWithItems={groupsWithItems}
      ungroupedDocuments={ungroupedDocuments}
      draggedItem={draggedItem}
      onDocumentDragStart={handleDragStart}
      onDocumentDragOver={handleDragOver}
      onDocumentDragLeave={handleDragLeave}
      onDocumentDrop={handleDrop}
      onDocumentDragEnd={handleDragEnd}
      onGroupDragStart={handleGroupDragStart}
      onGroupDrop={handleGroupDrop}
    />
  );
};

export default DocumentTableWrapper;
