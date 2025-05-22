
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Trash, Edit, GripVertical, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Document } from '@/types/documents';
import ResponsabiliteSelector from './ResponsabiliteSelector';
import { cn } from "@/lib/utils";
import AtteinteSelector from './AtteinteSelector';

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
  const handleRChange = (values: string[]) => {
    onResponsabiliteChange(doc.id, 'r', values);
  };
  
  const handleAChange = (values: string[]) => {
    onResponsabiliteChange(doc.id, 'a', values);
  };
  
  const handleCChange = (values: string[]) => {
    onResponsabiliteChange(doc.id, 'c', values);
  };
  
  const handleIChange = (values: string[]) => {
    onResponsabiliteChange(doc.id, 'i', values);
  };

  // Convertir le statut 'EX' en excluded=true pour compatibilité
  const isExcluded = doc.excluded || doc.etat === 'EX';
  
  // Convertir etat pour AtteinteSelector qui n'accepte que 'NC', 'PC', 'C' ou null
  const normalizedEtat = doc.etat === 'EX' ? null : doc.etat;

  return (
    <TableRow
      key={doc.id}
      className={cn("border-b hover:bg-gray-50", isExcluded ? "bg-gray-100 text-gray-400" : "")}
      draggable
      onDragStart={(e) => onDragStart(e, doc.id)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, doc.id)}
      onDragEnd={onDragEnd}
    >
      <TableCell className="w-10 text-center">
        <GripVertical className="h-5 w-5 text-gray-400 mx-auto cursor-move" />
      </TableCell>

      <TableCell className="w-1/4 font-medium">
        {doc.nom}
      </TableCell>

      <TableCell className="w-1/12">
        <ResponsabiliteSelector
          selectedInitiales={doc.responsabilites?.r || []}
          onChange={handleRChange}
          type="r"
          disabled={isExcluded}
        />
      </TableCell>

      <TableCell className="w-1/12">
        <ResponsabiliteSelector
          selectedInitiales={doc.responsabilites?.a || []}
          onChange={handleAChange}
          type="a"
          disabled={isExcluded}
        />
      </TableCell>

      <TableCell className="w-1/12">
        <ResponsabiliteSelector
          selectedInitiales={doc.responsabilites?.c || []}
          onChange={handleCChange}
          type="c"
          disabled={isExcluded}
        />
      </TableCell>

      <TableCell className="w-1/12">
        <ResponsabiliteSelector
          selectedInitiales={doc.responsabilites?.i || []}
          onChange={handleIChange}
          type="i"
          disabled={isExcluded}
        />
      </TableCell>

      <TableCell className="w-1/6">
        <AtteinteSelector
          value={normalizedEtat}
          onChange={(value) => onAtteinteChange(doc.id, value)}
          disabled={isExcluded}
        />
      </TableCell>

      <TableCell className="w-1/6 text-right space-x-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-500 hover:text-app-blue"
          onClick={() => onEdit(doc.id)}
          title="Éditer"
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className={isExcluded ? "text-green-600 hover:text-green-700" : "text-gray-500 hover:text-gray-700"}
          onClick={() => onExclusionChange(doc.id)}
          title={isExcluded ? "Inclure" : "Exclure"}
        >
          {isExcluded ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="text-gray-500 hover:text-red-500"
          onClick={() => onDelete(doc.id)}
          title="Supprimer"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default DocumentRow;
