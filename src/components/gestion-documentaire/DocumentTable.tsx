
import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { Document } from '@/types/documents';
import type { DocumentGroup as DocumentGroupType } from '@/types/documents';
import DocumentTableHeader from './table/TableHeader';
import DocumentRow from './table/DocumentRow';
import DocumentGroupComponent from './table/DocumentGroup';
import { useDragAndDrop } from './table/useDragAndDrop';

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
  onDeleteGroup
}) => {
  const ungroupedDocuments = documents.filter(d => !d.groupId);
  const {
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleGroupDrop
  } = useDragAndDrop(documents, onReorder);

  const handleGroupDragStart = (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ groupId }));
    e.currentTarget.classList.add('opacity-50');
  };

  return (
    <div className="bg-white rounded-md shadow overflow-hidden">
      <Table>
        <DocumentTableHeader />
        
        <TableBody>
          {groups.map((group) => (
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
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onGroupDragStart={handleGroupDragStart}
              onGroupDrop={handleGroupDrop}
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
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentTable;
