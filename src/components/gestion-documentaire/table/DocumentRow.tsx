import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Document } from '@/types/documents';
import { Pencil, Trash, GripVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import FileLink from './FileLink';
import ResponsableSelector from '@/components/ResponsableSelector';

interface DocumentRowProps {
  doc: Document;
  onResponsabiliteChange: (id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => void;
  onAtteinteChange: (id: string, atteinte: 'NC' | 'PC' | 'C' | null) => void;
  onExclusionChange: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart?: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragOver?: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragEnd?: (e: React.DragEvent<HTMLTableRowElement>) => void;
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
  const handleResponsabiliteChange = (type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    onResponsabiliteChange(doc.id, type, values);
  };
  
  const handleAtteinteChange = (value: 'NC' | 'PC' | 'C' | null) => {
    onAtteinteChange(doc.id, value);
  };
  
  const handleExclusionChange = () => {
    onExclusionChange(doc.id);
  };
  
  // Calculate if the document is excluded
  const isExcluded = doc.etat === 'EX';
  
  return (
    <TableRow 
      className={`border-b ${isExcluded ? 'bg-gray-100' : 'bg-white'}`}
      draggable
      onDragStart={e => onDragStart && onDragStart(e, doc.id, doc.groupId)}
      onDragOver={e => onDragOver && onDragOver(e)}
      onDragLeave={e => onDragLeave && onDragLeave(e)}
      onDrop={e => onDrop && onDrop(e, doc.id, doc.groupId)}
      onDragEnd={onDragEnd}
    >
      <TableCell className="w-10 p-2">
        <div className="flex justify-center cursor-grab">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </TableCell>
      
      <TableCell className="py-3 px-4 font-medium">{doc.nom || doc.name}</TableCell>
      
      <TableCell className="py-3 px-4">
        <FileLink filePath={doc.fichier_path} />
      </TableCell>
      
      {/* RACI Columns - these are the ones that were missing or not rendering */}
      <TableCell className="py-3 px-2 text-center">
        <ResponsableSelector
          selectedInitiales={doc.responsabilites?.r || []}
          onChange={(values) => handleResponsabiliteChange('r', values)}
          type="r"
        />
      </TableCell>
      
      <TableCell className="py-3 px-2 text-center">
        <ResponsableSelector
          selectedInitiales={doc.responsabilites?.a || []}
          onChange={(values) => handleResponsabiliteChange('a', values)}
          type="a"
        />
      </TableCell>
      
      <TableCell className="py-3 px-2 text-center">
        <ResponsableSelector
          selectedInitiales={doc.responsabilites?.c || []}
          onChange={(values) => handleResponsabiliteChange('c', values)}
          type="c"
        />
      </TableCell>
      
      <TableCell className="py-3 px-2 text-center">
        <ResponsableSelector
          selectedInitiales={doc.responsabilites?.i || []}
          onChange={(values) => handleResponsabiliteChange('i', values)}
          type="i"
        />
      </TableCell>
      
      <TableCell className="py-3 px-4 text-center">
        <Checkbox 
          checked={isExcluded} 
          onCheckedChange={handleExclusionChange}
        />
      </TableCell>
      
      <TableCell className="py-3 px-1 text-center">
        <Button
          variant={doc.etat === 'NC' ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0 rounded-full border-red-200 text-red-500"
          onClick={() => handleAtteinteChange(doc.etat === 'NC' ? null : 'NC')}
        >
          NC
        </Button>
      </TableCell>
      
      <TableCell className="py-3 px-1 text-center">
        <Button
          variant={doc.etat === 'PC' ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0 rounded-full border-yellow-200 text-yellow-500"
          onClick={() => handleAtteinteChange(doc.etat === 'PC' ? null : 'PC')}
        >
          PC
        </Button>
      </TableCell>
      
      <TableCell className="py-3 px-1 text-center">
        <Button
          variant={doc.etat === 'C' ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0 rounded-full border-green-200 text-green-500"
          onClick={() => handleAtteinteChange(doc.etat === 'C' ? null : 'C')}
        >
          C
        </Button>
      </TableCell>
      
      <TableCell className="py-3 px-4 text-right">
        <div className="flex justify-end space-x-1">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0" 
            onClick={() => onEdit(doc.id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 text-red-500" 
            onClick={() => onDelete(doc.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default DocumentRow;
