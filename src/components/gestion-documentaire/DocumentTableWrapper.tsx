
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
  // Passer toutes les props au composant DocumentTable
  return (
    <DocumentTable {...props} />
  );
};

export default DocumentTableWrapper;
