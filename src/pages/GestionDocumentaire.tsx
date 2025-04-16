
import React, { useState } from 'react';
import { Pencil, Trash, FileText, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Document {
  id: number;
  nom: string;
  lien: string | null;
  responsabilites: {
    r: boolean;
    a: boolean;
    c: boolean;
    i: boolean;
  };
  etat: string;
}

const GestionDocumentaire = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([
    { 
      id: 1, 
      nom: 'Document 1', 
      lien: 'Voir le document', 
      responsabilites: { r: true, a: false, c: true, i: false },
      etat: 'C' 
    },
    { 
      id: 2, 
      nom: 'Document 2', 
      lien: null, 
      responsabilites: { r: false, a: true, c: false, i: true },
      etat: 'PC' 
    },
    { 
      id: 3, 
      nom: 'Document 3', 
      lien: 'Voir le document', 
      responsabilites: { r: true, a: true, c: false, i: false },
      etat: 'NC' 
    },
  ]);

  const [stats, setStats] = useState({
    exclusion: 0,
    nonConforme: 1,
    partiellementConforme: 1,
    conforme: 1,
    total: 3
  });

  // Add handlers for edit and delete actions
  const handleEdit = (id: number) => {
    toast({
      title: "Modification",
      description: `Édition du document ${id}`,
    });
    // Implementation of edit functionality would go here
  };

  const handleDelete = (id: number) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    setStats(prev => ({
      ...prev,
      total: prev.total - 1
    }));
    toast({
      title: "Suppression",
      description: `Le document ${id} a été supprimé`,
    });
  };

  // Handle row reordering with drag and drop
  const handleReorder = (startIndex: number, endIndex: number) => {
    const result = Array.from(documents);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setDocuments(result);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Gestion Documentaire</h1>
          <p className="text-gray-600">Documentation des tâches</p>
        </div>
        <FileText className="text-red-500 h-6 w-6" />
      </div>

      <div className="flex space-x-2 mb-4 mt-4">
        <div className="badge bg-gray-200 text-gray-800">
          Exclusion: {stats.exclusion}
        </div>
        <div className="badge bg-red-100 text-red-800">
          Non Conforme: {stats.nonConforme}
        </div>
        <div className="badge bg-yellow-100 text-yellow-800">
          Partiellement Conforme: {stats.partiellementConforme}
        </div>
        <div className="badge bg-green-100 text-green-800">
          Conforme: {stats.conforme}
        </div>
        <div className="badge bg-blue-100 text-blue-800">
          Total: {stats.total}
        </div>
      </div>

      <div className="bg-white rounded-md shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-app-light-blue text-left">
              <TableHead className="py-3 px-4 text-app-blue font-semibold">Nom</TableHead>
              <TableHead className="py-3 px-4 text-app-blue font-semibold">Lien</TableHead>
              <TableHead className="py-3 px-4 text-app-blue font-semibold text-center" colSpan={4}>
                Responsabilités
              </TableHead>
              <TableHead className="py-3 px-4 text-app-blue font-semibold">Exclusion</TableHead>
              <TableHead className="py-3 px-4 text-app-blue font-semibold">État</TableHead>
              <TableHead className="py-3 px-4 text-app-blue font-semibold text-right">Actions</TableHead>
            </TableRow>
            <TableRow className="bg-app-light-blue text-left">
              <TableHead className="py-2"></TableHead>
              <TableHead className="py-2"></TableHead>
              <TableHead className="py-2 px-2 text-center text-sm font-medium">R</TableHead>
              <TableHead className="py-2 px-2 text-center text-sm font-medium">A</TableHead>
              <TableHead className="py-2 px-2 text-center text-sm font-medium">C</TableHead>
              <TableHead className="py-2 px-2 text-center text-sm font-medium">I</TableHead>
              <TableHead className="py-2"></TableHead>
              <TableHead className="py-2 px-4 text-sm font-medium">NCPCC</TableHead>
              <TableHead className="py-2"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody onReorder={handleReorder}>
            {documents.length === 0 ? (
              <TableRow className="border-b">
                <TableCell colSpan={10} className="py-4 px-4 text-center text-gray-500">
                  Aucun document disponible
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id} className="border-b hover:bg-gray-50">
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
                  <TableCell className="py-3 px-2 text-center">
                    {doc.responsabilites.r ? "+" : "-"}
                  </TableCell>
                  <TableCell className="py-3 px-2 text-center">
                    {doc.responsabilites.a ? "+" : "-"}
                  </TableCell>
                  <TableCell className="py-3 px-2 text-center">
                    {doc.responsabilites.c ? "+" : "-"}
                  </TableCell>
                  <TableCell className="py-3 px-2 text-center">
                    {doc.responsabilites.i ? "+" : "-"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    <input 
                      type="checkbox" 
                      className="form-checkbox h-4 w-4 text-app-blue rounded"
                      onClick={(e) => e.stopPropagation()} // Prevent row drag
                    />
                  </TableCell>
                  <TableCell className="py-3 px-4">{doc.etat}</TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <button 
                      className="text-gray-600 hover:text-app-blue mr-3"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row drag
                        handleEdit(doc.id);
                      }}
                    >
                      <Pencil className="h-5 w-5 inline-block" />
                    </button>
                    <button 
                      className="text-gray-600 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row drag
                        handleDelete(doc.id);
                      }}
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

      <div className="flex justify-end mt-4">
        <button 
          className="btn-primary"
          onClick={() => {
            toast({
              title: "Nouveau document",
              description: "Ajout d'un nouveau document",
            });
            // Implementation would go here
          }}
        >
          Nouveau document
        </button>
      </div>
    </div>
  );
};

export default GestionDocumentaire;
