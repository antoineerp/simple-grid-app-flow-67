import React, { useState } from 'react';
import { Pencil, Trash, GripVertical, ChevronDown, ExternalLink } from 'lucide-react';
import ResponsableSelector from '@/components/ResponsableSelector';
import { Document, DocumentGroup } from '@/types/documents';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface DocumentTableProps {
  documents: Document[];
  groups: DocumentGroup[];
  onResponsabiliteChange: (id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => void;
  onAtteinteChange: (id: string, atteinte: 'NC' | 'PC' | 'C' | null) => void;
  onExclusionChange: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (startIndex: number, endIndex: number, targetGroupId?: string) => void;
  onGroupReorder: (startIndex: number, endIndex: number) => void;
  onToggleGroup: (id: string) => void;
  onEditGroup: (group: DocumentGroup) => void;
  onDeleteGroup: (id: string) => void;
}

const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
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
  const ungroupedDocuments = documents.filter(d => !d.groupId);
  const [draggedItem, setDraggedItem] = useState<{ index: number, groupId: string | null } | null>(null);

  const getGroupItemIndex = (groupId: string, localIndex: number) => {
    let globalStartIndex = ungroupedDocuments.length;
    
    for (const group of groups) {
      if (group.id === groupId) {
        return globalStartIndex + localIndex;
      }
      globalStartIndex += group.items.length;
    }
    
    return localIndex;
  };

  const handleDragStart = (e: React.DragEvent, index: number, groupId: string | null = null) => {
    setDraggedItem({ index, groupId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ index, groupId }));
    
    setTimeout(() => {
      e.currentTarget.classList.add('opacity-50');
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('border-dashed', 'border-2', 'border-primary');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number, targetGroupId?: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
    
    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
    const { index: startIndex, groupId: sourceGroupId } = dragData;
    
    if (sourceGroupId === targetGroupId && startIndex === targetIndex) return;
    
    let actualStartIndex = startIndex;
    if (sourceGroupId) {
      actualStartIndex = getGroupItemIndex(sourceGroupId, startIndex);
    }
    
    let actualTargetIndex = targetIndex;
    if (targetGroupId) {
      actualTargetIndex = getGroupItemIndex(targetGroupId, targetIndex);
    }
    
    onReorder(actualStartIndex, actualTargetIndex, targetGroupId);
    setDraggedItem(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItem(null);
  };

  const renderFileLink = (fichier_path: string | null) => {
    if (!fichier_path) return <span className="text-gray-500">-</span>;
    
    return (
      <a 
        href={fichier_path}
        target="_blank"
        rel="noopener noreferrer"
        className="text-app-blue hover:underline inline-flex items-center gap-1"
      >
        {fichier_path}
        <ExternalLink className="h-4 w-4" />
      </a>
    );
  };

  return (
    <div className="bg-white rounded-md shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-app-light-blue">
            <TableHead className="w-10"></TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold w-1/3">Nom</TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold">Fichier</TableHead>
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
        <TableBody>
          {groups.map((group) => (
            <React.Fragment key={group.id}>
              <TableRow 
                className="border-b hover:bg-gray-50 cursor-pointer" 
                onClick={() => onToggleGroup(group.id)}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  const index = groups.findIndex(g => g.id === group.id);
                  handleDragStart(e, index);
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  e.stopPropagation();
                  const index = groups.findIndex(g => g.id === group.id);
                  if (draggedItem?.groupId === null) {
                    handleDrop(e, index);
                  }
                }}
                onDragEnd={handleDragEnd}
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
                    <span className="font-medium text-app-blue">{group.name}</span>
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
                group.items.map((doc, index) => (
                  <TableRow 
                    key={doc.id} 
                    className="border-b hover:bg-gray-50 bg-gray-50"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, group.id)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index, group.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <TableCell className="py-3 px-2 w-10">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </TableCell>
                    <TableCell className="py-3 px-4">{doc.nom}</TableCell>
                    <TableCell className="py-3 px-4">
                      {renderFileLink(doc.fichier_path)}
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
                ))
              )}
            </React.Fragment>
          ))}
        </TableBody>
        <TableBody>
          {ungroupedDocuments.map((doc, index) => (
            <TableRow 
              key={doc.id} 
              className="border-b hover:bg-gray-50"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <TableCell className="py-3 px-2 w-10">
                <GripVertical className="h-5 w-5 text-gray-400" />
              </TableCell>
              <TableCell className="py-3 px-4">{doc.nom}</TableCell>
              <TableCell className="py-3 px-4">
                {renderFileLink(doc.fichier_path)}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentTable;
