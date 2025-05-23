
import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { Document } from '@/types/documents';
import type { DocumentGroup as DocumentGroupType } from '@/types/documents';
import DocumentTableHeader from './table/TableHeader';
import DocumentRow from './table/DocumentRow';
import DocumentGroupComponent from './table/DocumentGroup';
import { useDragAndDropTable } from '@/hooks/useDragAndDropTable';

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
  onAddDocument: () => void;
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
  onAddDocument
}) => {
  const ungroupedDocuments = documents.filter(d => !d.groupId);
  
  const {
    draggedItemId,
    draggedItemGroupId,
    draggedItemIndex,
    dropTargetId,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleGroupDrop
  } = useDragAndDropTable(
    documents, 
    onReorder,
    (doc) => doc.groupId
  );

  const handleGroupDragStart = (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ groupId, isGroup: true }));
    e.currentTarget.classList.add('opacity-50');
  };

  // Group the documents by their group
  const groupsWithItems = groups.map((group, index) => {
    const groupItems = documents.filter(doc => doc.groupId === group.id);
    return {
      ...group,
      items: groupItems,
      index
    };
  });

  return (
    <div className="bg-white rounded-md shadow overflow-hidden">
      <Table className="table-fixed w-full">
        <DocumentTableHeader onAddDocument={onAddDocument} />
        
        <TableBody>
          {groupsWithItems.map((group, groupIndex) => (
            <DocumentGroupComponent
              key={group.id}
              group={group}
              groupIndex={groupIndex}
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
        
          {ungroupedDocuments.map((doc, index) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              index={index}
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
