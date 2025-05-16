
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
  ungroupedDocuments: Document[];
  groupsWithItems: (DocumentGroupType & { items: Document[] })[];
  draggedItem: any;
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
  onDocumentDragStart: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDocumentDragOver: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDocumentDragLeave: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDocumentDrop: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDocumentDragEnd: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onGroupDragStart: (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => void;
  onGroupDrop: (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => void;
}

const DocumentTable: React.FC<DocumentTableProps> = ({
  ungroupedDocuments,
  groupsWithItems,
  onResponsabiliteChange,
  onAtteinteChange,
  onExclusionChange,
  onEdit,
  onDelete,
  onToggleGroup,
  onEditGroup,
  onDeleteGroup,
  onDocumentDragStart,
  onDocumentDragOver,
  onDocumentDragLeave,
  onDocumentDrop,
  onDocumentDragEnd,
  onGroupDragStart,
  onGroupDrop
}) => {
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
              onDragStart={onDocumentDragStart}
              onDragOver={onDocumentDragOver}
              onDragLeave={onDocumentDragLeave}
              onDrop={onDocumentDrop}
              onDragEnd={onDocumentDragEnd}
              onGroupDragStart={onGroupDragStart}
              onGroupDrop={onGroupDrop}
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
              onDragStart={onDocumentDragStart}
              onDragOver={onDocumentDragOver}
              onDragLeave={onDocumentDragLeave}
              onDrop={onDocumentDrop}
              onDragEnd={onDocumentDragEnd}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentTable;
