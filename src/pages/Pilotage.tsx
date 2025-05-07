
import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { MembresProvider } from '@/contexts/MembresContext';
import { exportPilotageToOdf } from "@/services/pdfExport";
import { usePilotageDocuments } from '@/hooks/usePilotageDocuments';
import { useSynchronization } from '@/hooks/useSynchronization';
import PilotageHeader from '@/components/pilotage/PilotageHeader';
import PilotageActions from '@/components/pilotage/PilotageActions';
import PilotageDocumentsTable from '@/components/pilotage/PilotageDocumentsTable';
import DocumentDialog from '@/components/pilotage/DocumentDialog';
import ExigenceSummary from '@/components/pilotage/ExigenceSummary';
import DocumentSummary from '@/components/pilotage/DocumentSummary';
import ResponsabilityMatrix from '@/components/pilotage/ResponsabilityMatrix';
import SyncStatusIndicator from '@/components/common/SyncStatusIndicator';

const Pilotage = () => {
  const { toast } = useToast();
  const { 
    handleSync, 
    isOnline, 
    isSyncing, 
    lastSynced, 
    hasUnsyncedData 
  } = useSynchronization();
  
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
        <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <PilotageHeader onExport={handleExportPdf} />
          <SyncStatusIndicator
            isOnline={isOnline}
            isSyncing={isSyncing}
            lastSynced={lastSynced}
            hasUnsyncedData={hasUnsyncedData}
            onSync={handleSync}
          />
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
