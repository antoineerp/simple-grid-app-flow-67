
import React, { useState } from 'react';
import { FilePdf, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PilotageDocumentsTable from '@/components/pilotage/PilotageDocumentsTable';
import DocumentDialog from '@/components/pilotage/DocumentDialog';
import ExigenceSummary from '@/components/pilotage/ExigenceSummary';
import DocumentSummary from '@/components/pilotage/DocumentSummary';
import ResponsabilityMatrix from '@/components/pilotage/ResponsabilityMatrix';
import { MembresProvider } from '@/contexts/MembresContext';
import { exportPilotageToOdf } from "@/services/pdfExport";

interface Document {
  id: number;
  ordre: number;
  nom: string;
  lien: string | null;
}

const Pilotage = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([
    { id: 1, ordre: 1, nom: 'Charte institutionnelle', lien: 'Voir le document' },
    { id: 2, ordre: 2, nom: 'Objectifs stratégiques', lien: null },
    { id: 3, ordre: 3, nom: 'Objectifs opérationnels', lien: 'Voir le document' },
    { id: 4, ordre: 4, nom: 'Risques', lien: null },
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document>({
    id: 0,
    ordre: 0,
    nom: '',
    lien: null
  });

  const handleAddDocument = () => {
    const nextOrdre = documents.length > 0 
      ? Math.max(...documents.map(doc => doc.ordre)) + 1 
      : 1;
    
    setCurrentDocument({
      id: 0,
      ordre: nextOrdre,
      nom: '',
      lien: null
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEditDocument = (doc: Document) => {
    setCurrentDocument({ ...doc });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteDocument = (id: number) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentDocument({
      ...currentDocument,
      [name]: value
    });
  };

  const handleSaveDocument = () => {
    if (currentDocument.nom.trim() === '') {
      toast({
        title: "Erreur",
        description: "Le nom du document est requis",
        variant: "destructive",
      });
      return;
    }

    if (isEditing) {
      setDocuments(documents.map(doc => 
        doc.id === currentDocument.id ? currentDocument : doc
      ));
      toast({
        title: "Document mis à jour",
        description: "Le document a été mis à jour avec succès",
      });
    } else {
      const newId = documents.length > 0 
        ? Math.max(...documents.map(doc => doc.id)) + 1 
        : 1;
      
      setDocuments([...documents, { ...currentDocument, id: newId }]);
      toast({
        title: "Document ajouté",
        description: "Le nouveau document a été ajouté avec succès",
      });
    }
    
    setIsDialogOpen(false);
  };

  const handleReorder = (startIndex: number, endIndex: number) => {
    const result = Array.from(documents);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    const updatedDocuments = result.map((doc, index) => ({
      ...doc,
      ordre: index + 1
    }));
    
    setDocuments(updatedDocuments);
    
    toast({
      title: "Ordre mis à jour",
      description: "L'ordre des documents a été mis à jour avec succès",
    });
  };

  const handleExportPdf = () => {
    exportPilotageToOdf(documents);
    toast({
      title: "Export PDF",
      description: "Les documents ont été exportés au format PDF",
    });
  };

  return (
    <MembresProvider>
      <div className="p-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-app-blue">Pilotage</h1>
            <p className="text-gray-600">Documents de pilotage</p>
          </div>
          <FilePdf 
            className="text-red-500 h-6 w-6 cursor-pointer hover:text-red-600" 
            onClick={handleExportPdf}
          />
        </div>

        <PilotageDocumentsTable 
          documents={documents}
          onEditDocument={handleEditDocument}
          onDeleteDocument={handleDeleteDocument}
          onReorder={handleReorder}
        />

        <div className="flex justify-end mt-4">
          <Button 
            className="bg-app-blue hover:bg-app-blue/90 text-white" 
            onClick={handleAddDocument}
          >
            <Plus className="h-4 w-4 mr-2" /> Ajouter un document
          </Button>
        </div>

        <ExigenceSummary />
        
        <DocumentSummary />
        
        <ResponsabilityMatrix />

        <DocumentDialog 
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          currentDocument={currentDocument}
          onInputChange={handleInputChange}
          onSave={handleSaveDocument}
          isEditing={isEditing}
        />
      </div>
    </MembresProvider>
  );
};

export default Pilotage;
