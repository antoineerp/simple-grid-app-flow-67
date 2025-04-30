
import React, { useState } from 'react';
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
  const [draggedItem, setDraggedItem] = useState<{ id: string, groupId?: string } | null>(null);

  const prepareItems = () => {
    let allItems: { id: string; groupId?: string; index: number }[] = 
      ungroupedExigences.map((item, index) => ({
        id: item.id,
        groupId: undefined,
        index
      }));

    groups.forEach(group => {
      const groupItems = exigences.filter(item => item.groupId === group.id)
        .map((item, groupIndex) => ({
          id: item.id,
          groupId: group.id,
          index: groupIndex
        }));
      allItems = [...allItems, ...groupItems];
    });

    return allItems;
  };

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
    
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const { id: sourceId, groupId: sourceGroupId } = data;
    
    if (sourceId === targetId) return;
    
    const allItems = prepareItems();
    const sourceItem = allItems.find(item => item.id === sourceId);
    const targetItem = allItems.find(item => item.id === targetId);
    
    if (!sourceItem || !targetItem) return;
    
    let sourceIndex = sourceItem.index;
    let targetIndex = targetItem.index;
    
    let adjustedSourceIndex = sourceIndex;
    if (sourceGroupId) {
      const groupStartIndex = ungroupedExigences.length;
      const previousGroupsItemCount = groups
        .slice(0, groups.findIndex(g => g.id === sourceGroupId))
        .reduce((total, g) => {
          return total + exigences.filter(e => e.groupId === g.id).length;
        }, 0);
      
      adjustedSourceIndex = groupStartIndex + previousGroupsItemCount + sourceIndex;
    }
    
    let adjustedTargetIndex = targetIndex;
    if (targetGroupId) {
      const groupStartIndex = ungroupedExigences.length;
      const previousGroupsItemCount = groups
        .slice(0, groups.findIndex(g => g.id === targetGroupId))
        .reduce((total, g) => {
          return total + exigences.filter(e => e.groupId === g.id).length;
        }, 0);
      
      adjustedTargetIndex = groupStartIndex + previousGroupsItemCount + targetIndex;
    }
    
    onReorder(adjustedSourceIndex, adjustedTargetIndex, targetGroupId);
    setDraggedItem(null);
  };

  const handleGroupDrop = (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      if (data.id) {
        const sourceId = data.id;
        const sourceGroupId = data.groupId;
        
        if (sourceGroupId === groupId) return;
        
        const sourceExigence = exigences.find(e => e.id === sourceId);
        if (!sourceExigence) return;
        
        let sourceIndex = -1;
        if (!sourceGroupId) {
          sourceIndex = ungroupedExigences.findIndex(e => e.id === sourceId);
        } else {
          const groupIndex = groups.findIndex(g => g.id === sourceGroupId);
          if (groupIndex === -1) return;
          
          const groupItems = exigences.filter(e => e.groupId === sourceGroupId);
          const indexInGroup = groupItems.findIndex(e => e.id === sourceId);
          
          sourceIndex = ungroupedExigences.length + 
            groups.slice(0, groupIndex).reduce((total, g) => {
              return total + exigences.filter(e => e.groupId === g.id).length;
            }, 0) + indexInGroup;
        }
        
        if (sourceIndex === -1) return;
        
        const targetGroup = groups.find(g => g.id === groupId);
        if (!targetGroup) return;
        
        const targetGroupIndex = groups.findIndex(g => g.id === groupId);
        const targetGroupItems = exigences.filter(e => e.groupId === groupId);
        
        const targetIndex = ungroupedExigences.length + 
          groups.slice(0, targetGroupIndex).reduce((total, g) => {
            return total + exigences.filter(e => e.groupId === g.id).length;
          }, 0) + targetGroupItems.length;
        
        onReorder(sourceIndex, targetIndex, groupId);
      } else if (data.groupId) {
        const sourceGroupId = data.groupId;
        const sourceIndex = groups.findIndex(g => g.id === sourceGroupId);
        const targetIndex = groups.findIndex(g => g.id === groupId);
        
        if (sourceIndex !== -1 && targetIndex !== -1) {
          onGroupReorder(sourceIndex, targetIndex);
        }
      }
    } catch (error) {
      console.error("Erreur lors du drop:", error);
    }
    
    setDraggedItem(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItem(null);
  };

  const handleGroupDragStart = (e: React.DragEvent<HTMLTableRowElement>, groupId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ groupId }));
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
          {groups.map((group) => (
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
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </TableCell>
                <TableCell className="py-3 px-4 w-full text-left" colSpan={9}>
                  <div className="flex items-center">
                    <ChevronDown 
                      className={`h-4 w-4 mr-2 inline-block transition-transform ${group.expanded ? 'rotate-180' : ''}`} 
                    />
                    <span className="font-medium">{group.name}</span>
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
              {group.expanded && (
                group.items.map((exigence, index) => (
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
                      <Checkbox 
                        checked={exigence.exclusion}
                        onCheckedChange={() => onExclusionChange(exigence.id)}
                        className="form-checkbox h-4 w-4 text-app-blue rounded"
                      />
                    </TableCell>

                    {/* Nouveaux boutons d'atteinte comme dans DocumentRow */}
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
                ))
              )}
            </React.Fragment>
          ))}
        </TableBody>
        <TableBody>
          {ungroupedExigences.map((exigence, index) => (
            <TableRow 
              key={exigence.id} 
              className="border-b hover:bg-gray-50"
              draggable
              onDragStart={(e) => handleDragStart(e, exigence.id)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, exigence.id)}
              onDragEnd={handleDragEnd}
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
                <Checkbox 
                  checked={exigence.exclusion}
                  onCheckedChange={() => onExclusionChange(exigence.id)}
                  className="form-checkbox h-4 w-4 text-app-blue rounded"
                />
              </TableCell>

              {/* Nouveaux boutons d'atteinte comme dans DocumentRow */}
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
        </TableBody>
      </Table>
    </div>
  );
};

export default ExigenceTable;
