
import React from 'react';
import { Document } from '@/types/documents';
import type { DocumentGroup as DocumentGroupType } from '@/types/documents';
import DocumentTable from './DocumentTable';

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
 * DocumentTableWrapper - Composant wrapper pour DocumentTable
 * Cela permet d'utiliser le composant DocumentTable tout en conservant sa fonctionnalité complète
 */
const DocumentTableWrapper: React.FC<DocumentTableWrapperProps> = (props) => {
  // Préparation des propriétés pour le composant DocumentTable
  const ungroupedDocuments = props.documents.filter(d => !d.groupId);
  
  // Pour chaque groupe, ajouter les documents correspondants
  const groupsWithItems = props.groups.map(group => {
    // Trouver tous les documents appartenant à ce groupe
    const groupItems = props.documents.filter(doc => doc.groupId === group.id);
    
    // Retourner le groupe avec ses documents
    return {
      ...group,
      items: groupItems
    };
  });

  // Dummy fonctions pour la gestion du drag and drop
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => {
    console.log('Drag start', id, groupId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    // Implémentation de base
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => {
    console.log('Drop', id, groupId);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    // Implémentation de base
  };

  const handleGroupDragStart = (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => {
    console.log('Group drag start', groupId);
  };

  const handleGroupDrop = (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => {
    console.log('Group drop', groupId);
  };

  // Passer toutes les props au composant DocumentTable avec les fonctions de drag and drop
  return (
    <DocumentTable
      documents={props.documents}
      groups={props.groups}
      ungroupedDocuments={ungroupedDocuments}
      groupsWithItems={groupsWithItems}
      draggedItem={null}
      onResponsabiliteChange={props.onResponsabiliteChange}
      onAtteinteChange={props.onAtteinteChange}
      onExclusionChange={props.onExclusionChange}
      onEdit={props.onEdit}
      onDelete={props.onDelete}
      onReorder={props.onReorder}
      onGroupReorder={props.onGroupReorder}
      onToggleGroup={props.onToggleGroup}
      onEditGroup={props.onEditGroup}
      onDeleteGroup={props.onDeleteGroup}
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
