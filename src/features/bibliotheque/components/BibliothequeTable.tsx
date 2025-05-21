
import React from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BibliothequeGroup } from './BibliothequeGroup';
import { BibliothequeDocumentRow } from './BibliothequeDocumentRow';
import { useDragAndDropTable } from '@/hooks/useDragAndDropTable';

interface BibliothequeTableProps {
  documents: Document[];
  groups: DocumentGroup[];
  onEdit: (document: Document | null, group?: DocumentGroup) => void;
  onDelete: (id: string, isGroup?: boolean) => void;
  onReorder: (startIndex: number, endIndex: number, targetGroupId?: string) => void;
  onGroupReorder: (startIndex: number, endIndex: number) => void;
  onToggleGroup: (id: string) => void;
}

export const BibliothequeTable: React.FC<BibliothequeTableProps> = ({
  documents,
  groups,
  onEdit,
  onDelete,
  onReorder,
  onGroupReorder,
  onToggleGroup
}) => {
  const ungroupedDocuments = documents.filter(doc => !doc.groupId);
  
  // Enhanced drag and drop using our custom hook
  const {
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

  return (
    <div className="bg-white rounded-md shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-app-light-blue">
            <TableHead className="w-10"></TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold">Nom du document</TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold">Lien</TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map(group => (
            <BibliothequeGroup
              key={group.id}
              group={group}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleGroup={onToggleGroup}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onGroupDragStart={handleGroupDragStart}
              onGroupDrop={handleGroupDrop}
              documents={documents.filter(doc => doc.groupId === group.id)}
            />
          ))}
          
          {ungroupedDocuments.map((doc, index) => (
            <BibliothequeDocumentRow
              key={doc.id}
              document={doc}
              index={index}
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
