
import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { Document } from '@/types/documents';
import type { DocumentGroup as DocumentGroupType } from '@/types/documents';
import DocumentTableHeader from './table/TableHeader';
import DocumentRow from './table/DocumentRow';
import DocumentGroupComponent from './table/DocumentGroup';

interface DocumentTableProps {
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

const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  groups,
  onResponsabiliteChange,
  onAtteinteChange,
  onExclusionChange,
  onEdit,
  onDelete,
  onReorder,
  onGroupReorder,
  onToggleGroup,
  onEditGroup,
  onDeleteGroup,
  ...otherProps
}) => {
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

  return (
    <div className="bg-white rounded-md shadow overflow-hidden">
      <Table>
        <DocumentTableHeader />
        
        <TableBody>
          {groupsWithItems.map((group) => (
            <DocumentGroupComponent
              key={group.id}
              group={group}
              onResponsabiliteChange={onResponsabiliteChange}
              onAtteinteChange={onAtteinteChange}
              onExclusionChange={onExclusionChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleGroup={onToggleGroup}
              onEditGroup={onEditGroup}
              onDeleteGroup={onDeleteGroup}
              {...otherProps}
            />
          ))}
        </TableBody>
        
        <TableBody>
          {ungroupedDocuments.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              onResponsabiliteChange={onResponsabiliteChange}
              onAtteinteChange={onAtteinteChange}
              onExclusionChange={onExclusionChange}
              onEdit={onEdit}
              onDelete={onDelete}
              {...otherProps}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentTable;
