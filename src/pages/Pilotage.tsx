
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { MembresProvider } from '@/contexts/MembresContext';
import { exportPilotageToOdf } from "@/services/pdfExport";
import { useSyncTableCrud } from '@/hooks/useSyncTableCrud';
import PilotageHeader from '@/components/pilotage/PilotageHeader';
import PilotageActions from '@/components/pilotage/PilotageActions';
import PilotageDocumentsTable from '@/components/pilotage/PilotageDocumentsTable';
import DocumentDialog from '@/components/pilotage/DocumentDialog';
import ExigenceSummary from '@/components/pilotage/ExigenceSummary';
import DocumentSummary from '@/components/pilotage/DocumentSummary';
import ResponsabilityMatrix from '@/components/pilotage/ResponsabilityMatrix';

// Type pour les documents de pilotage
interface Document {
  id: string;
  nom: string;
  fichier_path: string | null;
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  etat: "NC" | "PC" | "C" | null;
  date_creation: Date;
  date_modification: Date;
  excluded: boolean;
  groupId?: string;
}

const Pilotage = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);

  // Utiliser notre hook personnalisé pour la synchronisation CRUD
  const {
    data: documents,
    isSyncing,
    lastSynced,
    syncFailed,
    isOnline,
    createItem,
    updateItem,
    deleteItem,
    syncWithServer
  } = useSyncTableCrud<Document>({
    tableName: 'pilotage_documents',
    autoSync: true,
    syncInterval: 30000,  // 30 secondes
    itemFactory: (data) => ({
      id: '',
      nom: data?.nom || 'Nouveau document',
      fichier_path: data?.fichier_path || null,
      responsabilites: data?.responsabilites || { r: [], a: [], c: [], i: [] },
      etat: data?.etat || null,
      date_creation: new Date(),
      date_modification: new Date(),
      excluded: data?.excluded || false,
      groupId: data?.groupId || undefined
    })
  });

  // Gestionnaires d'événements
  const handleAddDocument = () => {
    const newDocument = createItem();
    setCurrentDocument(newDocument);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEditDocument = (id: string) => {
    const documentToEdit = documents.find(doc => doc.id === id);
    if (documentToEdit) {
      setCurrentDocument(documentToEdit);
      setIsEditing(true);
      setIsDialogOpen(true);
    }
  };

  const handleDeleteDocument = (id: string) => {
    deleteItem(id);
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès"
    });
  };

  const handleInputChange = (field: keyof Document, value: any) => {
    if (currentDocument) {
      setCurrentDocument(prev => ({
        ...prev!,
        [field]: value,
        date_modification: new Date()
      }));
    }
  };

  const handleSaveDocument = () => {
    if (currentDocument) {
      updateItem(currentDocument.id, currentDocument);
      setIsDialogOpen(false);
      toast({
        title: isEditing ? "Document mis à jour" : "Document créé",
        description: `Le document a été ${isEditing ? 'mis à jour' : 'créé'} avec succès`
      });
    }
  };

  const handleReorder = (startIndex: number, endIndex: number) => {
    // Créer une nouvelle liste réordonnée
    const reorderedDocs = [...documents];
    const [removed] = reorderedDocs.splice(startIndex, 1);
    reorderedDocs.splice(endIndex, 0, removed);
    
    // Mettre à jour la liste complète
    documents.forEach((doc, i) => updateItem(doc.id, { ordre: i }));
  };

  const handleExportPdf = () => {
    exportPilotageToOdf(documents);
    toast({
      title: "Export PDF",
      description: "Les documents ont été exportés au format PDF",
    });
  };

  // Fonction pour déclencher la synchronisation manuelle
  const handleSync = async () => {
    try {
      if (documents && documents.length > 0) {
        const success = await syncWithServer("manual");
        if (success) {
          toast({
            title: "Synchronisation",
            description: "Les documents ont été synchronisés avec succès",
          });
        }
      } else {
        toast({
          title: "Synchronisation",
          description: "Aucun document à synchroniser",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      toast({
        title: "Erreur de synchronisation",
        description: "Une erreur est survenue lors de la synchronisation",
        variant: "destructive"
      });
    }
  };

  return (
    <MembresProvider>
      <div className="p-8">
        <PilotageHeader 
          onExport={handleExportPdf}
          onSync={handleSync}
          isSyncing={isSyncing}
          syncFailed={syncFailed}
          lastSynced={lastSynced}
          isOnline={isOnline}
        />

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
