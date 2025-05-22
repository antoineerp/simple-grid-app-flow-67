
import React, { useState, useEffect, ChangeEvent } from 'react';
import { useToast } from "@/hooks/use-toast";
import { MembresProvider } from '@/contexts/MembresContext';
import { exportPilotageToOdf } from "@/services/pdfExport";
import { useUnifiedSync } from '@/hooks/useUnifiedSync';
import { syncEvents } from '@/services/sync/UnifiedSyncService';
import PilotageHeader from '@/components/pilotage/PilotageHeader';
import PilotageActions from '@/components/pilotage/PilotageActions';
import PilotageDocumentsTable from '@/components/pilotage/PilotageDocumentsTable';
import DocumentDialog from '@/components/pilotage/DocumentDialog';
import ExigenceSummary from '@/components/pilotage/ExigenceSummary';
import DocumentSummary from '@/components/pilotage/DocumentSummary';
import ResponsabilityMatrix from '@/components/pilotage/ResponsabilityMatrix';
import { SyncItem } from '@/services/sync/UnifiedSyncService';

// Interface pour les documents de pilotage
interface PilotageDocument extends SyncItem {
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
    id: parseInt(doc.id) || Math.floor(Math.random() * 10000),
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

  // Utiliser notre hook unifié
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
      id: data?.id || '',
      nom: data?.nom || 'Nouveau document',
      fichier_path: data?.fichier_path || null,
      responsabilites: data?.responsabilites || { r: [], a: [], c: [], i: [] },
      etat: data?.etat || null,
      date_creation: new Date(),
      date_modification: new Date(),
      excluded: data?.excluded || false,
      groupId: data?.groupId || undefined,
      ordre: data?.ordre || 0
    }) as PilotageDocument
  });

  // Écouter les événements de synchronisation pour les documents et exigences
  useEffect(() => {
    // Fonction pour forcer la mise à jour lorsque des données sont modifiées ailleurs
    const handleDocumentUpdate = () => {
      console.log("Pilotage: Événement de mise à jour des documents détecté, synchronisation...");
      syncData('manual').catch(console.error);
    };
    
    const handleExigenceUpdate = () => {
      console.log("Pilotage: Événement de mise à jour des exigences détecté");
      // Mettre à jour les synthèses, pas besoin de synchroniser les documents
      // Ce sera géré par les composants de synthèse
    };
    
    // S'abonner aux événements
    const unsubscribeDocuments = syncEvents.subscribe('pilotage_documents', handleDocumentUpdate);
    const unsubscribeExigences = syncEvents.subscribe('exigences', handleExigenceUpdate);
    
    // Écouter également les changements dans le localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.includes('documents_') || e.key.includes('exigences_'))) {
        console.log(`Pilotage: Changement détecté dans le storage pour ${e.key}`);
        syncData('manual').catch(console.error);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      unsubscribeDocuments();
      unsubscribeExigences();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncData]);

  // Convertir les documents pour l'affichage dans le composant de table existant
  const convertedDocuments = documents.map(doc => convertToDialogDocument(doc));

  // Gestionnaires d'événements
  const handleAddDocument = () => {
    const newOrderValue = documents.length > 0 
      ? Math.max(...documents.map(doc => doc.ordre || 0)) + 1 
      : 1;
      
    // Générer un ID unique pour éviter les doublons
    const newId = `doc_${Date.now().toString()}`;
    
    const newDocData: Partial<PilotageDocument> = { 
      id: newId,
      nom: 'Nouveau document',
      ordre: newOrderValue,
      etat: null
    };
    
    const newDocument = createItem(newDocData);
    
    // Convertir pour l'affichage dans le dialogue
    const dialogDoc = convertToDialogDocument(newDocument);
    setCurrentDialogDocument(dialogDoc);
    
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
    const docToDelete = documents.find(d => parseInt(d.id) === id || d.id === id.toString());
    if (docToDelete) {
      const success = deleteItem(docToDelete.id);
      if (success) {
        toast({
          title: "Document supprimé",
          description: "Le document a été supprimé avec succès"
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le document",
          variant: "destructive"
        });
      }
    } else {
      console.error(`Document avec ID ${id} introuvable pour suppression`);
      toast({
        title: "Erreur",
        description: "Document introuvable",
        variant: "destructive"
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
      
      if (isEditing) {
        // Trouver le document correspondant dans notre liste
        const docToUpdate = documents.find(d => 
          parseInt(d.id) === currentDialogDocument.id || 
          d.id === currentDialogDocument.id.toString()
        );
        
        if (docToUpdate) {
          // Mettre à jour le document existant
          updateItem(docToUpdate.id, docData);
          toast({
            title: "Document mis à jour",
            description: "Le document a été mis à jour avec succès"
          });
        } else {
          toast({
            title: "Erreur",
            description: "Document introuvable",
            variant: "destructive"
          });
        }
      } else {
        // Créer un nouveau document
        const newDoc = createItem(docData);
        if (newDoc) {
          toast({
            title: "Document créé",
            description: "Le nouveau document a été créé avec succès"
          });
        }
      }
      
      setIsDialogOpen(false);
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
      const success = await syncData("manual");
      if (success) {
        toast({
          title: "Synchronisation",
          description: "Les documents ont été synchronisés avec succès",
        });
      } else {
        toast({
          title: "Synchronisation",
          description: "Aucun document à synchroniser ou erreur de synchronisation",
          variant: "destructive"
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
