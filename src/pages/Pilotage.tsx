
import React, { useState, useEffect, ChangeEvent } from 'react';
import { useToast } from "@/hooks/use-toast";
import { MembresProvider } from '@/contexts/MembresContext';
import { exportPilotageToOdf } from "@/services/pdfExport";
import { useUnifiedSync } from '@/hooks/useUnifiedSync';
import PilotageHeader from '@/components/pilotage/PilotageHeader';
import PilotageActions from '@/components/pilotage/PilotageActions';
import PilotageDocumentsTable from '@/components/pilotage/PilotageDocumentsTable';
import DocumentDialog from '@/components/pilotage/DocumentDialog';
import ExigenceSummary from '@/components/pilotage/ExigenceSummary';
import DocumentSummary from '@/components/pilotage/DocumentSummary';
import ResponsabilityMatrix from '@/components/pilotage/ResponsabilityMatrix';

// Interface pour les documents de pilotage
interface PilotageDocument {
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
  ordre?: number;
}

// Interface pour la table des documents (format du composant existant)
interface DialogDocument {
  id: number;
  ordre: number;
  nom: string;
  lien: string | null;
}

// Fonction de conversion de PilotageDocument à DialogDocument
const convertToDialogDocument = (doc: PilotageDocument): DialogDocument => {
  return {
    id: parseInt(doc.id) || Math.floor(Math.random() * 1000),
    ordre: doc.ordre || 0,
    nom: doc.nom,
    lien: doc.fichier_path
  };
};

// Fonction de conversion de DialogDocument à PilotageDocument (partiel)
const convertToPartialPilotageDocument = (doc: DialogDocument): Partial<PilotageDocument> => {
  return {
    id: doc.id.toString(),
    nom: doc.nom,
    fichier_path: doc.lien,
    ordre: doc.ordre
  };
};

const Pilotage = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDialogDocument, setCurrentDialogDocument] = useState<DialogDocument>({
    id: 0,
    ordre: 0,
    nom: '',
    lien: null
  });

  // Utiliser notre nouveau hook unifié
  const {
    data: documents,
    isSyncing,
    lastSynced,
    syncFailed,
    isOnline,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
    syncData
  } = useUnifiedSync<PilotageDocument>({
    tableName: 'pilotage_documents',
    autoSync: true,
    syncInterval: 30000,  // 30 secondes
    endpoint: 'documents-sync.php',
    itemFactory: (data) => ({
      id: '',
      nom: data?.nom || 'Nouveau document',
      fichier_path: data?.fichier_path || null,
      responsabilites: data?.responsabilites || { r: [], a: [], c: [], i: [] },
      etat: data?.etat || null,
      date_creation: new Date(),
      date_modification: new Date(),
      excluded: data?.excluded || false,
      groupId: data?.groupId || undefined,
      ordre: data?.ordre || 0
    })
  });

  // Convertir les documents pour l'affichage dans le composant de table existant
  const convertedDocuments = documents.map(doc => convertToDialogDocument(doc));

  // Gestionnaires d'événements
  const handleAddDocument = () => {
    const newOrderValue = documents.length > 0 
      ? Math.max(...documents.map(doc => doc.ordre || 0)) + 1 
      : 1;
      
    const newDocData: Partial<PilotageDocument> = { 
      nom: 'Nouveau document',
      ordre: newOrderValue
    };
    
    const newDocument = createItem(newDocData);
    
    // Convertir pour l'affichage dans le dialogue
    setCurrentDialogDocument(convertToDialogDocument(newDocument));
    
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEditDocument = (doc: DialogDocument) => {
    setCurrentDialogDocument(doc);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteDocument = (id: number) => {
    // Trouver l'ID correspondant dans notre liste de documents
    const docToDelete = documents.find(d => parseInt(d.id) === id);
    if (docToDelete) {
      deleteItem(docToDelete.id);
      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès"
      });
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentDialogDocument(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveDocument = () => {
    if (currentDialogDocument) {
      // Convertir en format PilotageDocument
      const docData = convertToPartialPilotageDocument(currentDialogDocument);
      
      // Trouver le document correspondant dans notre liste
      const docToUpdate = documents.find(d => parseInt(d.id) === currentDialogDocument.id);
      
      if (docToUpdate) {
        // Mettre à jour le document existant
        updateItem(docToUpdate.id, docData);
      } else {
        // Créer un nouveau document si non trouvé (fallback)
        createItem(docData);
      }
      
      setIsDialogOpen(false);
      toast({
        title: isEditing ? "Document mis à jour" : "Document créé",
        description: `Le document a été ${isEditing ? 'mis à jour' : 'créé'} avec succès`
      });
    }
  };

  const handleReorder = (startIndex: number, endIndex: number) => {
    // Réorganiser les documents
    reorderItems(startIndex, endIndex);
    
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

  // Fonction pour déclencher la synchronisation manuelle
  const handleSync = async () => {
    try {
      if (documents && documents.length > 0) {
        const success = await syncData("manual");
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
          documents={convertedDocuments}
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
          currentDocument={currentDialogDocument}
          onInputChange={handleInputChange}
          onSave={handleSaveDocument}
          isEditing={isEditing}
        />
      </div>
    </MembresProvider>
  );
};

export default Pilotage;
