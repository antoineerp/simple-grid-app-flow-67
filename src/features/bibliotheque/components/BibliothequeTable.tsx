
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
  
  // Collecter tous les éléments pour le glisser-déposer
  const allItems = [...ungroupedDocuments];
  groups.forEach(group => {
    if (group.items && Array.isArray(group.items)) {
      allItems.push(...group.items);
    }
  });
  
  // Enhanced drag and drop using our custom hook
  const {
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleGroupDrop
  } = useDragAndDropTable(
    allItems, 
    onReorder, 
    (doc) => doc.groupId
  );
  
  // Gestion du glisser-déposer pour les groupes
  const handleGroupDragStart = (e: React.DragEvent<HTMLTableRowElement>, groupId: string, index: number) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: groupId, isGroup: true, index }));
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
          {groups.map((group, groupIndex) => (
            <BibliothequeGroup
              key={group.id}
              group={group}
              groupIndex={groupIndex}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleGroup={onToggleGroup}
              onDragStart={(e, id, groupId, index) => handleDragStart(e, id, groupId, index)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e, id, groupId) => handleDrop(e, id, groupId)}
              onDragEnd={handleDragEnd}
              onGroupDragStart={(e) => handleGroupDragStart(e, group.id, groupIndex)}
              onGroupDrop={(e) => handleGroupDrop(e, group.id)}
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
              onDragStart={(e, id, groupId) => handleDragStart(e, id, groupId, index)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e, id, groupId) => handleDrop(e, id, groupId)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
