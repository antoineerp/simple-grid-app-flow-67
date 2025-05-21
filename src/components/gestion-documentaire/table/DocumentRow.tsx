
import React from 'react';
import { Pencil, Trash, GripVertical } from 'lucide-react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Document } from '@/types/documents';
import ResponsabiliteSelector from './ResponsabiliteSelector';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface DocumentRowProps {
  doc: Document;
  index: number;
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
  index,
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
      className={`border-b hover:bg-gray-50 ${doc.groupId ? 'bg-gray-50' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, doc.id, doc.groupId)}
      onDragOver={(e) => onDragOver(e)}
      onDragLeave={(e) => onDragLeave(e)}
      onDrop={(e) => onDrop(e, doc.id, doc.groupId)}
      onDragEnd={(e) => onDragEnd(e)}
      data-index={index}
      data-id={doc.id}
    >
      <TableCell className="w-10 py-3 px-2">
        <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
      </TableCell>
      <TableCell className="py-3 px-4">
        {doc.nom}
      </TableCell>

      <TableCell className="py-3 px-4 text-center">
        <ResponsabiliteSelector 
          selectedInitiales={doc.responsabilites?.r || []}
          onChange={(values) => onResponsabiliteChange(doc.id, 'r', values)}
          type="r"
          disabled={doc.excluded}
        />
      </TableCell>
      <TableCell className="py-3 px-4 text-center">
        <ResponsabiliteSelector 
          selectedInitiales={doc.responsabilites?.a || []}
          onChange={(values) => onResponsabiliteChange(doc.id, 'a', values)}
          type="a"
          disabled={doc.excluded}
        />
      </TableCell>
      <TableCell className="py-3 px-4 text-center">
        <ResponsabiliteSelector 
          selectedInitiales={doc.responsabilites?.c || []}
          onChange={(values) => onResponsabiliteChange(doc.id, 'c', values)}
          type="c"
          disabled={doc.excluded}
        />
      </TableCell>
      <TableCell className="py-3 px-4 text-center">
        <ResponsabiliteSelector 
          selectedInitiales={doc.responsabilites?.i || []}
          onChange={(values) => onResponsabiliteChange(doc.id, 'i', values)}
          type="i"
          disabled={doc.excluded}
        />
      </TableCell>

      <TableCell className="py-3 px-4 text-center">
        <Checkbox 
          checked={doc.excluded}
          onCheckedChange={() => onExclusionChange(doc.id)}
        />
      </TableCell>

      <TableCell className="py-3 px-4 text-center">
        <Button 
          variant={doc.etat === 'NC' ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0 rounded-full border-red-200 text-red-500"
          onClick={() => onAtteinteChange(doc.id, doc.etat === 'NC' ? null : 'NC')}
          disabled={doc.excluded}
        >
          NC
        </Button>
      </TableCell>
      <TableCell className="py-3 px-4 text-center">
        <Button 
          variant={doc.etat === 'PC' ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0 rounded-full border-yellow-200 text-yellow-500"
          onClick={() => onAtteinteChange(doc.id, doc.etat === 'PC' ? null : 'PC')}
          disabled={doc.excluded}
        >
          PC
        </Button>
      </TableCell>
      <TableCell className="py-3 px-4 text-center">
        <Button 
          variant={doc.etat === 'C' ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0 rounded-full border-green-200 text-green-500"
          onClick={() => onAtteinteChange(doc.id, doc.etat === 'C' ? null : 'C')}
          disabled={doc.excluded}
        >
          C
        </Button>
      </TableCell>
      
      <TableCell className="py-3 px-4 text-right">
        <button 
          className="text-gray-600 hover:text-app-blue mr-3"
          onClick={() => onEdit(doc.id)}
        >
          <Pencil className="h-5 w-5 inline-block" />
        </button>
        <button 
          className="text-gray-600 hover:text-red-500"
          onClick={() => onDelete(doc.id)}
        >
          <Trash className="h-5 w-5 inline-block" />
        </button>
      </TableCell>
    </TableRow>
  );
};

export default DocumentRow;
