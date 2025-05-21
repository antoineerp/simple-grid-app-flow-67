
import React from 'react';
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
import { useDragAndDropTable } from '@/hooks/useDragAndDropTable';

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
  const sortedDocuments = [...documents].sort((a, b) => a.ordre - b.ordre);
  
  const {
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  } = useDragAndDropTable(sortedDocuments, onReorder);

  const handleLinkClick = (lien: string) => {
    if (!lien.startsWith('http://') && !lien.startsWith('https://')) {
      window.open(`https://${lien}`, '_blank');
    } else {
      window.open(lien, '_blank');
    }
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
          {sortedDocuments.map((doc, index) => (
            <TableRow 
              key={doc.id} 
              className="border-b hover:bg-gray-50"
              draggable
              onDragStart={(e) => handleDragStart(e, String(doc.id), undefined, index)}
              onDragOver={(e) => handleDragOver(e)}
              onDragLeave={(e) => handleDragLeave(e)}
              onDrop={(e) => handleDrop(e, String(doc.id))}
              onDragEnd={(e) => handleDragEnd(e)}
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
