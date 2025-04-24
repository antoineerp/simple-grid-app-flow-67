
import React from 'react';
import { Pencil, Trash, GripVertical, ChevronDown } from 'lucide-react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Document, type DocumentGroup as DocumentGroupType } from '@/types/documents';
import DocumentRow from './DocumentRow';

interface DocumentGroupProps {
  group: DocumentGroupType;
  onResponsabiliteChange: (id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => void;
  onAtteinteChange: (id: string, atteinte: 'NC' | 'PC' | 'C' | null) => void;
  onExclusionChange: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onEditGroup: (group: DocumentGroupType) => void;
  onDeleteGroup: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragOver: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onGroupDragStart: (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => void;
  onGroupDrop: (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => void;
}

const DocumentGroupComponent: React.FC<DocumentGroupProps> = ({ 
  group,
  onResponsabiliteChange,
  onAtteinteChange,
  onExclusionChange,
  onEdit,
  onDelete,
  onToggleGroup,
  onEditGroup,
  onDeleteGroup,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onGroupDragStart,
  onGroupDrop
}) => {
  return (
    <React.Fragment>
      <TableRow 
        className="border-b hover:bg-gray-50 cursor-pointer" 
        onClick={() => onToggleGroup(group.id)}
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          onGroupDragStart(e, group.id);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDragOver(e);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          onDragLeave(e);
        }}
        onDrop={(e) => {
          e.stopPropagation();
          onGroupDrop(e, group.id);
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          onDragEnd(e);
        }}
      >
        <TableCell className="py-3 px-2 w-10">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </TableCell>
        <TableCell 
          className="py-3 px-4 w-full text-left" 
          colSpan={9}
        >
          <div className="flex items-center">
            <ChevronDown 
              className={`h-4 w-4 mr-2 inline-block transition-transform ${group.expanded ? 'rotate-180' : ''}`} 
            />
            <span className="font-bold text-black">{group.name}</span>
          </div>
        </TableCell>
        <TableCell className="py-3 px-4 text-right">
          <button 
            className="text-gray-600 hover:text-app-blue mr-3"
            onClick={(e) => {
              e.stopPropagation();
              onEditGroup(group);
            }}
          >
            <Pencil className="h-5 w-5 inline-block" />
          </button>
          <button 
            className="text-gray-600 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteGroup(group.id);
            }}
          >
            <Trash className="h-5 w-5 inline-block" />
          </button>
        </TableCell>
      </TableRow>
      
      {group.expanded && group.items.map((doc) => (
        <DocumentRow
          key={doc.id}
          doc={doc}
          onResponsabiliteChange={onResponsabiliteChange}
          onAtteinteChange={onAtteinteChange}
          onExclusionChange={onExclusionChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
        />
      ))}
    </React.Fragment>
  );
};

export default DocumentGroupComponent;
