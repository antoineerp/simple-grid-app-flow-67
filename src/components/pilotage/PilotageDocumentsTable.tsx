
import React, { useState } from 'react';
import { Pencil, Trash, GripVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import DataTable, { Column } from '@/components/common/DataTable';

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

  const sortedDocuments = [...documents].sort((a, b) => a.ordre - b.ordre);

  const columns: Column<Document>[] = [
    {
      key: 'nom',
      header: 'Nom du document',
      cell: (doc) => (
        <div className="flex items-center text-sm">
          <GripVertical className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 cursor-move" />
          {doc.nom}
        </div>
      )
    },
    {
      key: 'lien',
      header: 'Lien',
      cell: (doc) => (
        doc.lien ? (
          <button 
            onClick={() => handleLinkClick(doc.lien as string)}
            className="text-app-blue hover:underline text-sm"
          >
            Voir le document
          </button>
        ) : (
          <span className="text-gray-500 text-sm">Aucun lien</span>
        )
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (doc) => (
        <div>
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
        </div>
      )
    }
  ];

  return (
    <div className="mt-6">
      <DataTable
        data={sortedDocuments}
        columns={columns}
        dragAndDrop={{
          onDragStart: (e, _, index) => handleDragStart(e, index),
          onDragOver: (e, _, index) => handleDragOver(e, index),
          onDragLeave: handleDragLeave,
          onDrop: (e, _, index) => handleDrop(e, index),
          onDragEnd: handleDragEnd
        }}
        className="bg-white rounded-md shadow overflow-hidden"
      />
    </div>
  );
};

export default PilotageDocumentsTable;
