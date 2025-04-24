
import React, { useState } from 'react';
import { Pencil, Trash, GripVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: number;
  ordre: number;
  nom: string;
  lien: string | null;
}

interface PilotageDocumentsTableProps {
  documents: Document[];
  onEditDocument: (doc: Document) => void;
  onDeleteDocument: (id: number) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
}

const PilotageDocumentsTable: React.FC<PilotageDocumentsTableProps> = ({
  documents,
  onEditDocument,
  onDeleteDocument,
  onReorder
}) => {
  const { toast } = useToast();
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const handleLinkClick = (lien: string) => {
    if (!lien.startsWith('http://') && !lien.startsWith('https://')) {
      window.open(`https://${lien}`, '_blank');
    } else {
      window.open(lien, '_blank');
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    // Ajout d'un délai pour permettre à l'image du drag d'être visible
    setTimeout(() => {
      e.currentTarget.classList.add('opacity-50');
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('border-dashed', 'border-2', 'border-primary');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
    
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex !== dropIndex) {
      onReorder(dragIndex, dropIndex);
      toast({
        description: `Document déplacé avec succès`,
      });
    }
    
    setDraggedItem(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItem(null);
  };

  return (
    <div className="bg-white rounded-md shadow overflow-hidden mt-6">
      <Table>
        <TableHeader>
          <TableRow className="bg-app-light-blue">
            <TableHead className="text-app-blue font-medium text-sm">Nom du document</TableHead>
            <TableHead className="text-app-blue font-medium text-sm">Lien</TableHead>
            <TableHead className="text-app-blue font-medium text-sm text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents
            .sort((a, b) => a.ordre - b.ordre)
            .map((doc, index) => (
              <TableRow 
                key={doc.id} 
                className="border-b hover:bg-gray-50"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <TableCell className="flex items-center text-sm">
                  <GripVertical className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 cursor-move" />
                  {doc.nom}
                </TableCell>
                <TableCell className="text-sm">
                  {doc.lien ? (
                    <button 
                      onClick={() => handleLinkClick(doc.lien as string)}
                      className="text-app-blue hover:underline"
                    >
                      Voir le document
                    </button>
                  ) : (
                    <span className="text-gray-500">Aucun lien</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-600 hover:text-app-blue"
                    onClick={() => onEditDocument(doc)}
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-600 hover:text-red-500"
                    onClick={() => onDeleteDocument(doc.id)}
                  >
                    <Trash className="h-5 w-5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PilotageDocumentsTable;
