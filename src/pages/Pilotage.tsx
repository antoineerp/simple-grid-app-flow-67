
import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { MembresProvider } from '@/contexts/MembresContext';
import { exportPilotageToOdf } from "@/services/pdfExport";
import { useSyncedData } from '@/hooks/useSyncedData';
import PilotageHeader from '@/components/pilotage/PilotageHeader';
import PilotageActions from '@/components/pilotage/PilotageActions';
import PilotageDocumentsTable from '@/components/pilotage/PilotageDocumentsTable';
import DocumentDialog from '@/components/pilotage/DocumentDialog';
import ExigenceSummary from '@/components/pilotage/ExigenceSummary';
import DocumentSummary from '@/components/pilotage/DocumentSummary';
import ResponsabilityMatrix from '@/components/pilotage/ResponsabilityMatrix';
import { useState } from 'react';

// Type spécifique pour le document de pilotage
interface PilotageDocument {
  id: number;
  ordre: number;
  nom: string;
  lien: string | null;
}

const Pilotage = () => {
  const { toast } = useToast();
  
  // États pour la gestion du dialogue
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentDocument, setCurrentDocument] = useState<PilotageDocument>({
    id: 0,
    ordre: 0,
    nom: "",
    lien: null
  });
  
  // Utiliser le hook pour la gestion des documents avec synchronisation
  const {
    data: documents,
    updateData: setDocuments,
    isSyncing,
    forceReload,
    repairSync,
  } = useSyncedData<PilotageDocument>(
    'pilotage_documents', // Nom de la table pour le stockage
    [], // Données initiales
    async (userId) => {
      // Fonction de chargement des données
      console.log("Chargement des documents pilotage pour", userId);
      // Ici, vous pourriez appeler votre API pour charger les données
      const storedData = localStorage.getItem(`pilotage_documents_${userId}`);
      return storedData ? JSON.parse(storedData) : [];
    },
    async (data, userId) => {
      // Fonction de sauvegarde des données
      console.log("Sauvegarde des documents pilotage pour", userId);
      // Ici, vous pourriez appeler votre API pour sauvegarder les données
      localStorage.setItem(`pilotage_documents_${userId}`, JSON.stringify(data));
      return true;
    }
  );

  // Gérer l'ajout d'un document
  const handleAddDocument = () => {
    const nextOrdre = documents.length > 0 
      ? Math.max(...documents.map(doc => doc.ordre)) + 1 
      : 1;
      
    setCurrentDocument({
      id: 0,
      ordre: nextOrdre,
      nom: "",
      lien: null
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  // Gérer la modification d'un document
  const handleEditDocument = (doc: PilotageDocument) => {
    setCurrentDocument({ ...doc });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Gérer la suppression d'un document
  const handleDeleteDocument = (id: number) => {
    const updatedDocs = documents.filter(d => d.id !== id);
    setDocuments(updatedDocs);
  };

  // Gérer les modifications d'un champ de document
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentDocument(prev => ({
      ...prev,
      [name]: name === 'ordre' ? parseInt(value, 10) || 0 : value
    }));
  };

  // Gérer la sauvegarde d'un document
  const handleSaveDocument = () => {
    if (isEditing) {
      const updatedDocs = documents.map(doc => 
        doc.id === currentDocument.id ? currentDocument : doc
      );
      setDocuments(updatedDocs);
    } else {
      const newId = documents.length > 0 
        ? Math.max(...documents.map(doc => doc.id)) + 1 
        : 1;
      
      setDocuments([...documents, { ...currentDocument, id: newId }]);
    }
    setIsDialogOpen(false);
  };

  // Gérer la réorganisation des documents
  const handleReorder = (startIndex: number, endIndex: number) => {
    const result = Array.from(documents);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    // Mettre à jour l'ordre explicite
    const reorderedDocs = result.map((doc, idx) => ({
      ...doc,
      ordre: idx + 1
    }));
    
    setDocuments(reorderedDocs);
  };

  // Gérer l'export PDF
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
        <PilotageHeader onExport={handleExportPdf} />

        <div className="flex justify-end mb-4">
          <button 
            onClick={forceReload} 
            className="px-3 py-1 mr-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isSyncing}
          >
            {isSyncing ? "Chargement..." : "Actualiser"}
          </button>
          <button 
            onClick={repairSync} 
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
            disabled={isSyncing}
          >
            Réparer la synchronisation
          </button>
        </div>

        <PilotageDocumentsTable 
          documents={documents}
          onEditDocument={handleEditDocument}
          onDeleteDocument={handleDeleteDocument}
          onReorder={handleReorder}
        />

        <PilotageActions onAddDocument={handleAddDocument} />

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
