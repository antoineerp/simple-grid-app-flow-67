
import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { MembresProvider } from '@/contexts/MembresContext';
import { exportPilotageToOdf } from "@/services/pdfExport";
import { usePilotageDocuments } from '@/hooks/usePilotageDocuments';
import { useSyncContext } from '@/features/sync/hooks/useSyncContext';
import PilotageHeader from '@/components/pilotage/PilotageHeader';
import PilotageActions from '@/components/pilotage/PilotageActions';
import PilotageDocumentsTable from '@/components/pilotage/PilotageDocumentsTable';
import DocumentDialog from '@/components/pilotage/DocumentDialog';
import ExigenceSummary from '@/components/pilotage/ExigenceSummary';
import DocumentSummary from '@/components/pilotage/DocumentSummary';
import ResponsabilityMatrix from '@/components/pilotage/ResponsabilityMatrix';

const Pilotage = () => {
  const { toast } = useToast();
  const {
    documents,
    isDialogOpen,
    setIsDialogOpen,
    isEditing,
    currentDocument,
    handleAddDocument,
    handleEditDocument,
    handleDeleteDocument,
    handleInputChange,
    handleSaveDocument,
    handleReorder,
  } = usePilotageDocuments();

  // Utilisation du contexte de synchronisation global
  const { syncTable, isOnline, syncStates } = useSyncContext();
  
  // Obtenir l'état de synchronisation pour les documents de pilotage
  const pilotageSync = syncStates['pilotage_documents'] || {
    isSyncing: false,
    lastSynced: null,
    syncFailed: false
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
        await syncTable('pilotage_documents', documents, 'manual');
        toast({
          title: "Synchronisation",
          description: "Les documents ont été synchronisés avec succès",
        });
      } else {
        toast({
          title: "Synchronisation",
          description: "Aucun document à synchroniser",
        });
      }
      return true;
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      toast({
        title: "Erreur de synchronisation",
        description: "Une erreur est survenue lors de la synchronisation",
        variant: "destructive"
      });
      return false;
    }
  };

  return (
    <MembresProvider>
      <div className="p-8">
        <PilotageHeader 
          onExport={handleExportPdf}
          onSync={handleSync}
          isSyncing={pilotageSync.isSyncing}
          syncFailed={pilotageSync.syncFailed}
          lastSynced={pilotageSync.lastSynced}
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
