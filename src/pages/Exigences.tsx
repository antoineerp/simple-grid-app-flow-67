
import React from 'react';
import { FileText, FolderPlus } from 'lucide-react';
import { MembresProvider } from '@/contexts/MembresContext';
import ExigenceForm from '@/components/exigences/ExigenceForm';
import ExigenceStats from '@/components/exigences/ExigenceStats';
import ExigenceTable from '@/components/exigences/ExigenceTable';
import { ExigenceGroupDialog } from '@/components/exigences/ExigenceGroupDialog';
import { useExigences } from '@/hooks/useExigences';
import { exportExigencesToPdf } from '@/services/pdfExport';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SyncIndicator from '@/components/common/SyncIndicator';

const ExigencesContent = () => {
  const {
    exigences,
    groups,
    stats,
    editingExigence,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed,
    loadError,
    setDialogOpen,
    setGroupDialogOpen,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleEdit,
    handleSaveExigence,
    handleDelete,
    handleAddExigence,
    handleReorder,
    handleAddGroup,
    handleEditGroup,
    handleSaveGroup,
    handleDeleteGroup,
    handleGroupReorder,
    handleToggleGroup,
    handleResetLoadAttempts,
    handleSync
  } = useExigences();
  
  const { toast } = useToast();

  const handleExportPdf = () => {
    exportExigencesToPdf(exigences, groups);
    toast({
      title: "Export PDF réussi",
      description: "Le document a été généré et téléchargé",
    });
  };

  // Création d'une fonction adaptateur qui correspond à la signature attendue par ExigenceTable
  const handleExclusionChangeAdapter = (id: string) => {
    handleExclusionChange(id, true);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Exigences</h1>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleExportPdf}
            className="text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
            title="Exporter en PDF"
          >
            <FileText className="h-6 w-6 stroke-[1.5]" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <SyncIndicator 
          isSyncing={isSyncing}
          isOnline={isOnline}
          syncFailed={syncFailed || !!loadError}
          lastSynced={lastSynced}
          onSync={handleSync}
          showOnlyErrors={true}
        />
      </div>

      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <div>{loadError}</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSync()}
              className="ml-4"
            >
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ExigenceStats stats={stats} />

      {exigences.length > 0 ? (
        <ExigenceTable 
          exigences={exigences}
          groups={groups}
          onResponsabiliteChange={handleResponsabiliteChange}
          onAtteinteChange={handleAtteinteChange}
          onExclusionChange={handleExclusionChangeAdapter}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReorder={handleReorder}
          onGroupReorder={handleGroupReorder}
          onToggleGroup={handleToggleGroup}
          onEditGroup={handleEditGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      ) : loadError ? (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Impossible de charger les exigences.</p>
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Aucune exigence trouvée. Cliquez sur "Ajouter une exigence" pour commencer.</p>
        </div>
      )}

      <div className="flex justify-end mt-4 space-x-2">
        <Button 
          variant="outline"
          onClick={handleAddGroup}
          className="hover:bg-gray-100 transition-colors mr-2"
          title="Nouveau groupe"
        >
          <FolderPlus className="h-5 w-5 mr-2" />
          Nouveau groupe
        </Button>
        <Button 
          variant="default"
          onClick={handleAddExigence}
        >
          Ajouter une exigence
        </Button>
      </div>

      <ExigenceForm 
        exigence={editingExigence}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveExigence}
      />

      <ExigenceGroupDialog
        group={editingGroup}
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        onSave={handleSaveGroup}
        isEditing={!!editingGroup}
      />
    </div>
  );
};

const Exigences = () => (
  <MembresProvider>
    <ExigencesContent />
  </MembresProvider>
);

export default Exigences;
