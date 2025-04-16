import React, { useState, useEffect } from 'react';
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
import ResponsableSelector from '@/components/ResponsableSelector';
import { MembresProvider } from '@/contexts/MembresContext';
import DocumentForm from '@/components/gestion-documentaire/DocumentForm';

interface Document {
  id: number;
  nom: string;
  lien: string | null;
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  etat: string;
}

const GestionDocumentaireContent = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>(() => {
    const storedDocuments = localStorage.getItem('documents');
    return storedDocuments ? JSON.parse(storedDocuments) : [
      { 
        id: 1, 
        nom: 'Document 1', 
        lien: 'Voir le document', 
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: 'C' 
      },
      { 
        id: 2, 
        nom: 'Document 2', 
        lien: null, 
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: 'PC' 
      },
      { 
        id: 3, 
        nom: 'Document 3', 
        lien: 'Voir le document', 
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: 'NC' 
      },
    ];
  });

  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Sauvegarde des documents dans le localStorage
  useEffect(() => {
    localStorage.setItem('documents', JSON.stringify(documents));
  }, [documents]);

  const [stats, setStats] = useState({
    exclusion: 0,
    nonConforme: 1,
    partiellementConforme: 1,
    conforme: 1,
    total: 3
  });

  // Mise à jour des statistiques quand les documents changent
  useEffect(() => {
    const newStats = {
      exclusion: documents.filter(d => d.etat === 'EX').length,
      nonConforme: documents.filter(d => d.etat === 'NC').length,
      partiellementConforme: documents.filter(d => d.etat === 'PC').length,
      conforme: documents.filter(d => d.etat === 'C').length,
      total: documents.length
    };
    setStats(newStats);
  }, [documents]);

  // Handler pour les responsabilités
  const handleResponsabiliteChange = (id: number, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { 
              ...doc, 
              responsabilites: { 
                ...doc.responsabilites, 
                [type]: values
              } 
            } 
          : doc
      )
    );
  };

  // Modifier le handler d'édition pour ouvrir la modale
  const handleEdit = (id: number) => {
    const documentToEdit = documents.find(doc => doc.id === id);
    if (documentToEdit) {
      setEditingDocument(documentToEdit);
      setDialogOpen(true);
    } else {
      toast({
        title: "Erreur",
        description: `Le document ${id} n'a pas été trouvé`,
        variant: "destructive"
      });
    }
  };

  // Fonction pour enregistrer les modifications
  const handleSaveDocument = (updatedDocument: Document) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === updatedDocument.id ? updatedDocument : doc
      )
    );
    toast({
      title: "Document mis à jour",
      description: `Le document ${updatedDocument.id} a été mis à jour avec succès`
    });
  };

  // Add handlers for edit and delete actions
  const handleDelete = (id: number) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast({
      title: "Suppression",
      description: `Le document ${id} a été supprimé`,
    });
  };

  // Handler pour ajouter un nouveau document
  const handleAddDocument = () => {
    const newId = documents.length > 0 
      ? Math.max(...documents.map(d => d.id)) + 1 
      : 1;
    
    const newDocument: Document = {
      id: newId,
      nom: `Document ${newId}`,
      lien: null,
      responsabilites: { r: [], a: [], c: [], i: [] },
      etat: 'NC'
    };
    
    setDocuments(prev => [...prev, newDocument]);
    setStats(prev => ({
      ...prev,
      nonConforme: prev.nonConforme + 1,
      total: prev.total + 1
    }));
    
    toast({
      title: "Nouveau document",
      description: `Le document ${newId} a été ajouté`,
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
                    <ResponsableSelector 
                      selectedInitiales={doc.responsabilites.r}
                      onChange={(values) => handleResponsabiliteChange(doc.id, 'r', values)}
                      type="r"
                    />
                  </TableCell>
                  <TableCell className="py-3 px-2 text-center">
                    <ResponsableSelector 
                      selectedInitiales={doc.responsabilites.a}
                      onChange={(values) => handleResponsabiliteChange(doc.id, 'a', values)}
                      type="a"
                    />
                  </TableCell>
                  <TableCell className="py-3 px-2 text-center">
                    <ResponsableSelector 
                      selectedInitiales={doc.responsabilites.c}
                      onChange={(values) => handleResponsabiliteChange(doc.id, 'c', values)}
                      type="c"
                    />
                  </TableCell>
                  <TableCell className="py-3 px-2 text-center">
                    <ResponsableSelector 
                      selectedInitiales={doc.responsabilites.i}
                      onChange={(values) => handleResponsabiliteChange(doc.id, 'i', values)}
                      type="i"
                    />
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
          onClick={handleAddDocument}
        >
          Nouveau document
        </button>
      </div>

      <DocumentForm 
        document={editingDocument}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveDocument}
      />
    </div>
  );
};

// Composant wrapper pour fournir le contexte
const GestionDocumentaire = () => (
  <MembresProvider>
    <GestionDocumentaireContent />
  </MembresProvider>
);

export default GestionDocumentaire;
