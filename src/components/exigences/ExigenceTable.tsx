import React from 'react';
import { Pencil, Trash, GripVertical, ChevronDown, FolderPlus } from 'lucide-react';
import ResponsableSelector from '@/components/ResponsableSelector';
import { Exigence, ExigenceGroup } from '@/types/exigences';
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
  groups: ExigenceGroup[];
  onResponsabiliteChange: (id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => void;
  onAtteinteChange: (id: string, atteinte: 'NC' | 'PC' | 'C' | null) => void;
  onExclusionChange: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (startIndex: number, endIndex: number, targetGroupId?: string) => void;
  onGroupReorder: (startIndex: number, endIndex: number) => void;
  onToggleGroup: (id: string) => void;
  onEditGroup: (group: ExigenceGroup) => void;
  onDeleteGroup: (id: string) => void;
}

const ExigenceTable: React.FC<ExigenceTableProps> = ({
  exigences,
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
  const ungroupedExigences = exigences.filter(e => !e.groupId);

  const handleDrop = (event: React.DragEvent, targetIndex: number, targetGroupId?: string) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
    
    const startIndex = parseInt(event.dataTransfer.getData('text/plain'));
    if (startIndex !== targetIndex) {
      onReorder(startIndex, targetIndex, targetGroupId);
    }
  };

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
        <TableBody onReorder={onGroupReorder}>
          {groups.map((group) => (
            <React.Fragment key={group.id}>
              <TableRow className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => onToggleGroup(group.id)}>
                <TableCell className="py-3 px-2 w-10">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </TableCell>
                <TableCell className="py-3 px-4 text-center">
                  <ChevronDown className={`h-4 w-4 inline-block transition-transform ${group.expanded ? 'rotate-180' : ''}`} />
                </TableCell>
                <TableCell className="py-3 px-4 font-medium" colSpan={7}>{group.name}</TableCell>
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
              {group.expanded && (
                <TableBody onReorder={(start, end) => onReorder(start, end, group.id)}>
                  {group.items.map((exigence, index) => (
                    <TableRow 
                      key={exigence.id} 
                      className="border-b hover:bg-gray-50 bg-gray-50"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-dashed', 'border-2', 'border-primary');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
                      }}
                      onDrop={(e) => handleDrop(e, index, group.id)}
                    >
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
              )}
            </React.Fragment>
          ))}
        </TableBody>
        <TableBody onReorder={onReorder}>
          {ungroupedExigences.map((exigence) => (
            <TableRow key={exigence.id} className="border-b hover:bg-gray-50">
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
