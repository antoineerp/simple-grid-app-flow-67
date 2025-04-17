
import React from 'react';
import { Pencil, Trash, FileDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportPilotageToOdf } from "@/services/pdfExport";
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

  const handleExportOdf = () => {
    exportPilotageToOdf(documents);
    toast({
      title: "Export ODF",
      description: "Les documents de pilotage ont été exportés au format ODF",
    });
  };

  return (
    <div className="bg-white rounded-md shadow overflow-hidden mt-6">
      <div className="p-2 bg-app-light-blue flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-app-blue border-app-blue hover:bg-app-blue hover:text-white"
          onClick={handleExportOdf}
        >
          <FileDown className="h-4 w-4 mr-1" /> Export ODF
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-app-light-blue">
            <TableHead className="text-app-blue font-semibold">Ordre</TableHead>
            <TableHead className="text-app-blue font-semibold">Nom du document</TableHead>
            <TableHead className="text-app-blue font-semibold">Lien</TableHead>
            <TableHead className="text-app-blue font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody onReorder={onReorder}>
          {documents
            .sort((a, b) => a.ordre - b.ordre)
            .map((doc) => (
              <TableRow key={doc.id} className="border-b hover:bg-gray-50">
                <TableCell>{doc.ordre}</TableCell>
                <TableCell>{doc.nom}</TableCell>
                <TableCell>
                  {doc.lien ? (
                    <a href="#" className="text-app-blue hover:underline">
                      Voir le document
                    </a>
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
