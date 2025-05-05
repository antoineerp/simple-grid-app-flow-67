
import React from 'react';
import { Pencil, Trash, GripVertical } from 'lucide-react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Document } from '@/types/documents';
import ResponsableSelector from '@/components/ResponsableSelector';
import FileLink from './FileLink';

interface DocumentRowProps {
  doc: Document;
  onResponsabiliteChange: (id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => void;
  onAtteinteChange: (id: string, atteinte: 'NC' | 'PC' | 'C' | null) => void;
  onExclusionChange: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragOver: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLTableRowElement>) => void;
}

const DocumentRow: React.FC<DocumentRowProps> = ({ 
  doc, 
  onResponsabiliteChange, 
  onAtteinteChange, 
  onExclusionChange, 
  onEdit, 
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}) => {
  return (
    <TableRow 
      key={doc.id} 
      className="border-b hover:bg-gray-50"
      draggable
      onDragStart={(e) => onDragStart(e, doc.id, doc.groupId)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, doc.id, doc.groupId)}
      onDragEnd={onDragEnd}
    >
      <TableCell className="py-3 px-2 w-10">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </TableCell>
      <TableCell className="py-3 px-4">{doc.nom}</TableCell>
      <TableCell className="py-3 px-4">
        <FileLink fichier_path={doc.fichier_path} />
      </TableCell>
      
      <TableCell className="py-3 px-1 text-center">
        <ResponsableSelector 
          selectedInitiales={doc.responsabilites.r}
          onChange={(values) => onResponsabiliteChange(doc.id, 'r', values)}
          type="r"
        />
      </TableCell>
      <TableCell className="py-3 px-1 text-center">
        <ResponsableSelector 
          selectedInitiales={doc.responsabilites.a}
          onChange={(values) => onResponsabiliteChange(doc.id, 'a', values)}
          type="a"
        />
      </TableCell>
      <TableCell className="py-3 px-1 text-center">
        <ResponsableSelector 
          selectedInitiales={doc.responsabilites.c}
          onChange={(values) => onResponsabiliteChange(doc.id, 'c', values)}
          type="c"
        />
      </TableCell>
      <TableCell className="py-3 px-1 text-center">
        <ResponsableSelector 
          selectedInitiales={doc.responsabilites.i}
          onChange={(values) => onResponsabiliteChange(doc.id, 'i', values)}
          type="i"
        />
      </TableCell>
      
      <TableCell className="py-3 px-4 text-center">
        <input 
          type="checkbox" 
          className="form-checkbox h-4 w-4 text-app-blue rounded"
          checked={doc.etat === 'EX'}
          onChange={() => onExclusionChange(doc.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      
      <TableCell className="py-3 px-1 text-center">
        <input 
          type="radio" 
          name={`atteinte-${doc.id}`}
          checked={doc.etat === 'NC'}
          onChange={() => onAtteinteChange(doc.id, 'NC')}
          className="form-radio h-4 w-4 text-red-500"
          disabled={doc.etat === 'EX'}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell className="py-3 px-1 text-center">
        <input 
          type="radio" 
          name={`atteinte-${doc.id}`}
          checked={doc.etat === 'PC'}
          onChange={() => onAtteinteChange(doc.id, 'PC')}
          className="form-radio h-4 w-4 text-yellow-500"
          disabled={doc.etat === 'EX'}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell className="py-3 px-1 text-center">
        <input 
          type="radio" 
          name={`atteinte-${doc.id}`}
          checked={doc.etat === 'C'}
          onChange={() => onAtteinteChange(doc.id, 'C')}
          className="form-radio h-4 w-4 text-green-500"
          disabled={doc.etat === 'EX'}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      
      <TableCell className="py-3 px-4 text-right">
        <button 
          className="text-gray-600 hover:text-app-blue mr-3"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(doc.id);
          }}
        >
          <Pencil className="h-5 w-5 inline-block" />
        </button>
        <button 
          className="text-gray-600 hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(doc.id);
          }}
        >
          <Trash className="h-5 w-5 inline-block" />
        </button>
      </TableCell>
    </TableRow>
  );
};

export default DocumentRow;
