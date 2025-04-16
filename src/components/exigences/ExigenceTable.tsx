
import React from 'react';
import { Pencil, Trash, GripVertical } from 'lucide-react';
import ResponsableSelector from '@/components/ResponsableSelector';
import { Exigence } from '@/types/exigences';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface ExigenceTableProps {
  exigences: Exigence[];
  onResponsabiliteChange: (id: number, type: 'r' | 'a' | 'c' | 'i', values: string[]) => void;
  onAtteinteChange: (id: number, atteinte: 'NC' | 'PC' | 'C' | null) => void;
  onExclusionChange: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
}

const ExigenceTable: React.FC<ExigenceTableProps> = ({
  exigences,
  onResponsabiliteChange,
  onAtteinteChange,
  onExclusionChange,
  onEdit,
  onDelete,
  onReorder
}) => {
  return (
    <div className="bg-white rounded-md shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold w-1/3">Nom</TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold text-center" colSpan={4}>
              Responsabilités
            </TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold">Exclusion</TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold text-center" colSpan={3}>
              Atteinte
            </TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold text-right">Actions</TableHead>
          </TableRow>
          <TableRow>
            <TableHead></TableHead>
            <TableHead className="py-2"></TableHead>
            <TableHead className="py-2 px-2 text-center text-sm font-medium">R</TableHead>
            <TableHead className="py-2 px-2 text-center text-sm font-medium">A</TableHead>
            <TableHead className="py-2 px-2 text-center text-sm font-medium">C</TableHead>
            <TableHead className="py-2 px-2 text-center text-sm font-medium">I</TableHead>
            <TableHead className="py-2"></TableHead>
            <TableHead className="py-2 px-2 text-center text-sm font-medium text-red-500">NC</TableHead>
            <TableHead className="py-2 px-2 text-center text-sm font-medium text-yellow-500">PC</TableHead>
            <TableHead className="py-2 px-2 text-center text-sm font-medium text-green-500">C</TableHead>
            <TableHead className="py-2"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody onReorder={onReorder}>
          {exigences.map((exigence) => (
            <TableRow key={exigence.id} className="border-b">
              <TableCell className="py-3 px-2 w-10">
                <GripVertical className="h-5 w-5 text-gray-400" />
              </TableCell>
              <TableCell className="py-3 px-4">{exigence.nom}</TableCell>
              
              <TableCell className="py-3 px-1 text-center">
                <ResponsableSelector 
                  selectedInitiales={exigence.responsabilites.r}
                  onChange={(values) => onResponsabiliteChange(exigence.id, 'r', values)}
                  type="r"
                />
              </TableCell>
              <TableCell className="py-3 px-1 text-center">
                <ResponsableSelector 
                  selectedInitiales={exigence.responsabilites.a}
                  onChange={(values) => onResponsabiliteChange(exigence.id, 'a', values)}
                  type="a"
                />
              </TableCell>
              <TableCell className="py-3 px-1 text-center">
                <ResponsableSelector 
                  selectedInitiales={exigence.responsabilites.c}
                  onChange={(values) => onResponsabiliteChange(exigence.id, 'c', values)}
                  type="c"
                />
              </TableCell>
              <TableCell className="py-3 px-1 text-center">
                <ResponsableSelector 
                  selectedInitiales={exigence.responsabilites.i}
                  onChange={(values) => onResponsabiliteChange(exigence.id, 'i', values)}
                  type="i"
                />
              </TableCell>
              
              <TableCell className="py-3 px-4 text-center">
                <input 
                  type="checkbox" 
                  checked={exigence.exclusion}
                  onChange={() => onExclusionChange(exigence.id)}
                  className="form-checkbox h-4 w-4 text-app-blue rounded"
                  onClick={(e) => e.stopPropagation()} // Prevent row drag
                />
              </TableCell>

              <TableCell className="py-3 px-1 text-center">
                <input 
                  type="radio" 
                  name={`atteinte-${exigence.id}`}
                  checked={exigence.atteinte === 'NC'}
                  onChange={() => onAtteinteChange(exigence.id, 'NC')}
                  className="form-radio h-4 w-4 text-red-500"
                  disabled={exigence.exclusion}
                  onClick={(e) => e.stopPropagation()} // Prevent row drag
                />
              </TableCell>
              <TableCell className="py-3 px-1 text-center">
                <input 
                  type="radio" 
                  name={`atteinte-${exigence.id}`}
                  checked={exigence.atteinte === 'PC'}
                  onChange={() => onAtteinteChange(exigence.id, 'PC')}
                  className="form-radio h-4 w-4 text-yellow-500"
                  disabled={exigence.exclusion}
                  onClick={(e) => e.stopPropagation()} // Prevent row drag
                />
              </TableCell>
              <TableCell className="py-3 px-1 text-center">
                <input 
                  type="radio" 
                  name={`atteinte-${exigence.id}`}
                  checked={exigence.atteinte === 'C'}
                  onChange={() => onAtteinteChange(exigence.id, 'C')}
                  className="form-radio h-4 w-4 text-green-500"
                  disabled={exigence.exclusion}
                  onClick={(e) => e.stopPropagation()} // Prevent row drag
                />
              </TableCell>
              
              <TableCell className="py-3 px-4 text-right">
                <button 
                  className="text-gray-600 hover:text-app-blue mr-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(exigence.id);
                  }}
                >
                  <Pencil className="h-5 w-5 inline-block" />
                </button>
                <button 
                  className="text-gray-600 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(exigence.id);
                  }}
                >
                  <Trash className="h-5 w-5 inline-block" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExigenceTable;
