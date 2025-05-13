
import React, { useState } from 'react';
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
  const [draggedItem, setDraggedItem] = useState<{ id: string, groupId?: string } | null>(null);
  const ungroupedDocuments = documents.filter(doc => !doc.groupId);

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => {
    setDraggedItem({ id, groupId });
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, groupId }));
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-dashed', 'border-2', 'border-primary');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string, targetGroupId?: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
    
    if (!draggedItem) return;
    
    const { id: sourceId, groupId: sourceGroupId } = draggedItem;
    if (sourceId === targetId) return;
    
    // Calculate indices
    let sourceIndex = -1;
    let targetIndex = -1;
    
    if (!sourceGroupId) {
      sourceIndex = ungroupedDocuments.findIndex(d => d.id === sourceId);
    } else {
      const group = groups.find(g => g.id === sourceGroupId);
      if (group) {
        const groupDocs = documents.filter(d => d.groupId === sourceGroupId);
        sourceIndex = ungroupedDocuments.length + 
                      groups.slice(0, groups.findIndex(g => g.id === sourceGroupId))
                        .reduce((acc, g) => acc + documents.filter(d => d.groupId === g.id).length, 0) + 
                      groupDocs.findIndex(d => d.id === sourceId);
      }
    }
    
    if (!targetGroupId) {
      targetIndex = ungroupedDocuments.findIndex(d => d.id === targetId);
    } else {
      const group = groups.find(g => g.id === targetGroupId);
      if (group) {
        const groupDocs = documents.filter(d => d.groupId === targetGroupId);
        targetIndex = ungroupedDocuments.length + 
                      groups.slice(0, groups.findIndex(g => g.id === targetGroupId))
                        .reduce((acc, g) => acc + documents.filter(d => d.groupId === g.id).length, 0) + 
                      groupDocs.findIndex(d => d.id === targetId);
      }
    }
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      onReorder(sourceIndex, targetIndex, targetGroupId);
    }
    
    setDraggedItem(null);
  };

  const handleGroupDrop = (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
    
    if (!draggedItem) return;
    
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    // Handle dropping items into groups
    if (data.id && !data.isGroup) {
      const sourceId = data.id;
      const sourceGroupId = data.groupId;
      
      if (sourceGroupId === groupId) return;
      
      let sourceIndex = -1;
      
      if (!sourceGroupId) {
        sourceIndex = ungroupedDocuments.findIndex(d => d.id === sourceId);
        if (sourceIndex !== -1) {
          sourceIndex = sourceIndex;
        }
      } else {
        const group = groups.find(g => g.id === sourceGroupId);
        if (group) {
          const groupDocs = documents.filter(d => d.groupId === sourceGroupId);
          sourceIndex = ungroupedDocuments.length + 
                        groups.slice(0, groups.findIndex(g => g.id === sourceGroupId))
                          .reduce((acc, g) => acc + documents.filter(d => d.groupId === g.id).length, 0) + 
                        groupDocs.findIndex(d => d.id === sourceId);
        }
      }
      
      const targetGroupDocs = documents.filter(d => d.groupId === groupId);
      const targetIndex = ungroupedDocuments.length + 
                        groups.slice(0, groups.findIndex(g => g.id === groupId))
                          .reduce((acc, g) => acc + documents.filter(d => d.groupId === g.id).length, 0) + 
                        targetGroupDocs.length;
      
      if (sourceIndex !== -1) {
        onReorder(sourceIndex, targetIndex, groupId);
      }
    }
    // Handle group reordering
    else if (data.groupId) {
      const sourceGroupId = data.groupId;
      if (sourceGroupId === groupId) return;
      
      const sourceIndex = groups.findIndex(g => g.id === sourceGroupId);
      const targetIndex = groups.findIndex(g => g.id === groupId);
      
      if (sourceIndex !== -1 && targetIndex !== -1) {
        onGroupReorder(sourceIndex, targetIndex);
      }
    }
    
    setDraggedItem(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItem(null);
  };

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
            />
          ))}
          
          {ungroupedDocuments.map(doc => (
            <BibliothequeDocumentRow
              key={doc.id}
              document={doc}
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
