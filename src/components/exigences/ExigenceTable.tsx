
import React from 'react';
import { Pencil, Trash, GripVertical, ChevronDown } from 'lucide-react';
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDragAndDropTable } from '@/hooks/useDragAndDropTable';

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
  
  const {
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleGroupDrop
  } = useDragAndDropTable(
    exigences, 
    onReorder,
    (exigence) => exigence.groupId
  );

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
            <TableHead className="py-3 px-4 text-app-blue font-semibold w-1/3">Exigence</TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold text-center" colSpan={4}>
              Responsabilités
            </TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold">Exclusion</TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold text-center" colSpan={3}>
              Atteinte
            </TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold text-right">Actions</TableHead>
          </TableRow>
          <TableRow className="bg-app-light-blue">
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
        <TableBody>
          {groups.map((group, groupIndex) => {
            // For each group, get its items
            const groupItems = exigences.filter(e => e.groupId === group.id);
            
            return (
              <React.Fragment key={group.id}>
                {/* Group Row */}
                <TableRow 
                  className="border-b hover:bg-gray-50 cursor-pointer" 
                  onClick={() => onToggleGroup(group.id)}
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    handleGroupDragStart(e, group.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDragOver(e);
                  }}
                  onDragLeave={(e) => {
                    e.stopPropagation();
                    handleDragLeave(e);
                  }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleGroupDrop(e, group.id);
                  }}
                  onDragEnd={(e) => {
                    e.stopPropagation();
                    handleDragEnd(e);
                  }}
                >
                  <TableCell className="py-3 px-2 w-10">
                    <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  </TableCell>
                  <TableCell className="py-3 px-4 w-full text-left" colSpan={9}>
                    <div className="flex items-center">
                      <ChevronDown 
                        className={`h-4 w-4 mr-2 inline-block transition-transform ${group.expanded ? 'rotate-180' : ''}`} 
                      />
                      <span className="font-bold text-app-blue text-sm">{group.name}</span>
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

                {group.expanded && groupItems.map((exigence, index) => (
                  <TableRow 
                    key={exigence.id} 
                    className="border-b hover:bg-gray-50 bg-gray-50"
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleDragStart(e, exigence.id, group.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDragOver(e);
                    }}
                    onDragLeave={(e) => {
                      e.stopPropagation();
                      handleDragLeave(e);
                    }}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleDrop(e, exigence.id, group.id);
                    }}
                    onDragEnd={(e) => {
                      e.stopPropagation();
                      handleDragEnd(e);
                    }}
                  >
                    <TableCell className="py-3 px-2 w-10">
                      <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
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
                      <Checkbox 
                        checked={exigence.exclusion}
                        onCheckedChange={() => onExclusionChange(exigence.id)}
                        className="form-checkbox h-4 w-4 text-app-blue rounded"
                      />
                    </TableCell>

                    <TableCell className="py-3 px-1 text-center">
                      <Button
                        variant={exigence.atteinte === 'NC' ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full border-red-200 text-red-500"
                        onClick={() => onAtteinteChange(exigence.id, exigence.atteinte === 'NC' ? null : 'NC')}
                        disabled={exigence.exclusion}
                      >
                        NC
                      </Button>
                    </TableCell>
                    <TableCell className="py-3 px-1 text-center">
                      <Button
                        variant={exigence.atteinte === 'PC' ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full border-yellow-200 text-yellow-500"
                        onClick={() => onAtteinteChange(exigence.id, exigence.atteinte === 'PC' ? null : 'PC')}
                        disabled={exigence.exclusion}
                      >
                        PC
                      </Button>
                    </TableCell>
                    <TableCell className="py-3 px-1 text-center">
                      <Button
                        variant={exigence.atteinte === 'C' ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full border-green-200 text-green-500"
                        onClick={() => onAtteinteChange(exigence.id, exigence.atteinte === 'C' ? null : 'C')}
                        disabled={exigence.exclusion}
                      >
                        C
                      </Button>
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
              </React.Fragment>
            );
          })}

          {/* Ungrouped exigences */}
          {ungroupedExigences.map((exigence, index) => (
            <TableRow 
              key={exigence.id} 
              className="border-b hover:bg-gray-50"
              draggable
              onDragStart={(e) => handleDragStart(e, exigence.id, undefined)}
              onDragOver={(e) => handleDragOver(e)}
              onDragLeave={(e) => handleDragLeave(e)}
              onDrop={(e) => handleDrop(e, exigence.id, undefined)}
              onDragEnd={(e) => handleDragEnd(e)}
            >
              <TableCell className="py-3 px-2 w-10">
                <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
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
                <Checkbox 
                  checked={exigence.exclusion}
                  onCheckedChange={() => onExclusionChange(exigence.id)}
                  className="form-checkbox h-4 w-4 text-app-blue rounded"
                />
              </TableCell>

              <TableCell className="py-3 px-1 text-center">
                <Button
                  variant={exigence.atteinte === 'NC' ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full border-red-200 text-red-500"
                  onClick={() => onAtteinteChange(exigence.id, exigence.atteinte === 'NC' ? null : 'NC')}
                  disabled={exigence.exclusion}
                >
                  NC
                </Button>
              </TableCell>
              <TableCell className="py-3 px-1 text-center">
                <Button
                  variant={exigence.atteinte === 'PC' ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full border-yellow-200 text-yellow-500"
                  onClick={() => onAtteinteChange(exigence.id, exigence.atteinte === 'PC' ? null : 'PC')}
                  disabled={exigence.exclusion}
                >
                  PC
                </Button>
              </TableCell>
              <TableCell className="py-3 px-1 text-center">
                <Button
                  variant={exigence.atteinte === 'C' ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full border-green-200 text-green-500"
                  onClick={() => onAtteinteChange(exigence.id, exigence.atteinte === 'C' ? null : 'C')}
                  disabled={exigence.exclusion}
                >
                  C
                </Button>
              </TableCell>
              
              <TableCell className="py-3 px-4 text-right">
                <button 
                  className="text-gray-600 hover:text-app-blue mr-3"
                  onClick={() => onEdit(exigence.id)}
                >
                  <Pencil className="h-5 w-5 inline-block" />
                </button>
                <button 
                  className="text-gray-600 hover:text-red-500"
                  onClick={() => onDelete(exigence.id)}
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
