
import React from 'react';
import { GripVertical, Pencil, Trash, ChevronDown, ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Document, DocumentGroup } from '@/types/bibliotheque';

interface BibliothequeTableProps {
  documents: Document[];
  groups: DocumentGroup[];
  onEditDocument: (doc: Document) => void;
  onDeleteDocument: (id: string) => void;
  onEditGroup: (group: DocumentGroup) => void;
  onDeleteGroup: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => void;
  onDragOver: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop: (e: React.DragEvent<HTMLTableRowElement>, targetId: string, targetGroupId?: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onGroupDrop: (e: React.DragEvent<HTMLTableRowElement>, targetGroupId: string) => void;
}

export const BibliothequeTable: React.FC<BibliothequeTableProps> = ({
  documents,
  groups,
  onEditDocument,
  onDeleteDocument,
  onEditGroup,
  onDeleteGroup,
  onToggleGroup,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onGroupDrop
}) => {
  const renderDocumentLink = (url: string | undefined) => {
    if (!url) return <span className="text-gray-500">-</span>;
    
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-app-blue hover:underline inline-flex items-center gap-1"
      >
        Voir le document
        <ExternalLink className="h-4 w-4" />
      </a>
    );
  };

  return (
    <div className="bg-white rounded-md shadow overflow-hidden mt-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold">Nom du document</TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold">Lien</TableHead>
            <TableHead className="py-3 px-4 text-app-blue font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        
        {groups.map((group) => (
          <TableBody key={group.id}>
            <TableRow 
              className="border-b hover:bg-gray-50 cursor-pointer" 
              onClick={() => onToggleGroup(group.id)}
              draggable
              onDragStart={(e) => onDragStart(e, group.id)}
              onDragOver={(e) => onDragOver(e)}
              onDragLeave={(e) => onDragLeave(e)}
              onDrop={(e) => onGroupDrop(e, group.id)}
              onDragEnd={onDragEnd}
            >
              <TableCell className="py-3 px-2 w-10">
                <GripVertical className="h-5 w-5 text-gray-400" />
              </TableCell>
              <TableCell className="py-3 px-4">
                <div className="flex items-center">
                  <ChevronDown className={`h-4 w-4 mr-2 inline-block transition-transform ${group.expanded ? 'rotate-180' : ''}`} />
                  <span className="font-medium">{group.name}</span>
                </div>
              </TableCell>
              <TableCell className="py-3 px-4"></TableCell>
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
            
            {group.expanded && group.items.map((item) => (
              <TableRow 
                key={item.id} 
                className="border-b hover:bg-gray-50 bg-gray-50"
                draggable
                onDragStart={(e) => onDragStart(e, item.id, group.id)}
                onDragOver={(e) => onDragOver(e)}
                onDragLeave={(e) => onDragLeave(e)}
                onDrop={(e) => onDrop(e, item.id, group.id)}
                onDragEnd={onDragEnd}
              >
                <TableCell className="py-3 px-2 w-10">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </TableCell>
                <TableCell className="py-3 px-4 pl-8">{item.titre}</TableCell>
                <TableCell className="py-3 px-4">
                  {renderDocumentLink(item.url)}
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <button 
                    className="text-gray-600 hover:text-app-blue mr-3"
                    onClick={() => onEditDocument(item)}
                  >
                    <Pencil className="h-5 w-5 inline-block" />
                  </button>
                  <button 
                    className="text-gray-600 hover:text-red-500"
                    onClick={() => onDeleteDocument(item.id)}
                  >
                    <Trash className="h-5 w-5 inline-block" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        ))}
        
        <TableBody>
          {documents.map((doc) => (
            <TableRow 
              key={doc.id} 
              className="border-b hover:bg-gray-50"
              draggable
              onDragStart={(e) => onDragStart(e, doc.id)}
              onDragOver={(e) => onDragOver(e)}
              onDragLeave={(e) => onDragLeave(e)}
              onDrop={(e) => onDrop(e, doc.id)}
              onDragEnd={onDragEnd}
            >
              <TableCell className="py-3 px-2 w-10">
                <GripVertical className="h-5 w-5 text-gray-400" />
              </TableCell>
              <TableCell className="py-3 px-4">{doc.titre}</TableCell>
              <TableCell className="py-3 px-4">
                {renderDocumentLink(doc.url)}
              </TableCell>
              <TableCell className="py-3 px-4 text-right">
                <button 
                  className="text-gray-600 hover:text-app-blue mr-3"
                  onClick={() => onEditDocument(doc)}
                >
                  <Pencil className="h-5 w-5 inline-block" />
                </button>
                <button 
                  className="text-gray-600 hover:text-red-500"
                  onClick={() => onDeleteDocument(doc.id)}
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
