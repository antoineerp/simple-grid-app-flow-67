import React from 'react';
import { Pencil, Trash, GripVertical } from 'lucide-react';
import ResponsableSelector from '@/components/ResponsableSelector';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Document } from '@/types/documents';

interface DocumentTableProps {
  documents: Document[];
  onResponsabiliteChange: (id: number, type: 'r' | 'a' | 'c' | 'i', values: string[]) => void;
  onAtteinteChange: (id: number, atteinte: 'NC' | 'PC' | 'C' | null) => void;
  onExclusionChange: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
}

const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
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
            <TableHead className="py-3 px-4 text-app-blue font-semibold">Lien</TableHead>
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
            <TableHead></TableHead>
            <TableHead></TableHead>
            <TableHead className="py-2 px-2 text-center text-sm font-medium">R</TableHead>
            <TableHead className="py-2 px-2 text-center text-sm font-medium">A</TableHead>
            <TableHead className="py-2 px-2 text-center text-sm font-medium">C</TableHead>
            <TableHead className="py-2 px-2 text-center text-sm font-medium">I</TableHead>
            <TableHead></TableHead>
            <TableHead className="py-2 px-2 text-center text-sm font-medium text-red-500">NC</TableHead>
            <TableHead className="py-2 px-2 text-center text-sm font-medium text-yellow-500">PC</TableHead>
            <TableHead className="py-2 px-2 text-center text-sm font-medium text-green-500">C</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
      
      <TableBody onReorder={onReorder}>
        {documents.length === 0 ? (
          <TableRow className="border-b">
            <TableCell colSpan={12} className="py-4 px-4 text-center text-gray-500">
              Aucun document disponible
            </TableCell>
          </TableRow>
        ) : (
          documents.map((doc) => (
            <TableRow key={doc.id} className="border-b hover:bg-gray-50">
              <TableCell className="py-3 px-2 w-10">
                <GripVertical className="h-5 w-5 text-gray-400" />
              </TableCell>
              <TableCell className="py-3 px-4">{doc.nom}</TableCell>
              <TableCell className="py-3 px-4">
                {doc.lien ? (
                  <a href="#" className="text-app-blue hover:underline">
                    {doc.lien}
                  </a>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
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
                  onClick={(e) => e.stopPropagation()} // Prevent row drag
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
                  onClick={(e) => e.stopPropagation()} // Prevent row drag
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
                  onClick={(e) => e.stopPropagation()} // Prevent row drag
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
                  onClick={(e) => e.stopPropagation()} // Prevent row drag
                />
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
          ))
        )}
      </TableBody>
      
    </Table>
    </div>
  );
};

export default DocumentTable;
