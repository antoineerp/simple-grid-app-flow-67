
import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { Document } from '@/types/documents';
import type { DocumentGroup as DocumentGroupType } from '@/types/documents';
import DocumentTableHeader from '@/components/gestion-documentaire/table/TableHeader';
import DocumentRow from '@/components/gestion-documentaire/table/DocumentRow';
import DocumentGroupComponent from '@/components/gestion-documentaire/table/DocumentGroup';
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
  // Filtrer les documents qui n'appartiennent à aucun groupe
  const ungroupedDocuments = documents.filter(d => !d.groupId);
  
  // Pour chaque groupe, ajouter les documents correspondants
  const groupsWithItems = groups.map((group, index) => {
    // Trouver tous les documents appartenant à ce groupe
    const groupItems = documents.filter(doc => doc.groupId === group.id);
    
    // Retourner le groupe avec ses documents
    return {
      ...group,
      items: groupItems,
      index
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
  } = useDragAndDropTable(documents, onReorder);

  const handleGroupDragStart = (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ groupId }));
    e.currentTarget.classList.add('opacity-50');
  };

  return (
    <div className="bg-white rounded-md shadow overflow-hidden">
      <Table>
        <DocumentTableHeader />
        
        <TableBody>
          {groupsWithItems.map((group) => (
            <DocumentGroupComponent
              key={group.id}
              group={group}
              groupIndex={group.index}
              onResponsabiliteChange={onResponsabiliteChange}
              onAtteinteChange={onAtteinteChange}
              onExclusionChange={onExclusionChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleGroup={onToggleGroup}
              onEditGroup={onEditGroup}
              onDeleteGroup={onDeleteGroup}
              onDragStart={(e, id, gId) => handleDragStart(e, id, gId)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e, id, gId) => handleDrop(e, id, gId)}
              onDragEnd={handleDragEnd}
              onGroupDragStart={handleGroupDragStart}
              onGroupDrop={handleGroupDrop}
            />
          ))}
        </TableBody>
        
        <TableBody>
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
              onDragStart={(e, id, gId) => handleDragStart(e, id, gId)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e, id, gId) => handleDrop(e, id, gId)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentTable;
