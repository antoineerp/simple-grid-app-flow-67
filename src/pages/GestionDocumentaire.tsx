
import React from 'react';
import { FileText, FolderPlus, RefreshCw } from 'lucide-react';
import { MembresProvider } from '@/contexts/MembresContext';
import DocumentForm from '@/components/gestion-documentaire/DocumentForm';
import DocumentStatusDisplay from '@/components/gestion-documentaire/DocumentStats';
import DocumentTable from '@/components/gestion-documentaire/DocumentTable';
import { DocumentGroupDialog } from '@/components/gestion-documentaire/DocumentGroupDialog';
import { useDocuments } from '@/hooks/useDocuments';
import { exportDocumentsToPdf } from '@/services/pdfExport';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SyncStatusIndicator from '@/components/common/SyncStatusIndicator';

const GestionDocumentaireContent = () => {
  const {
    documents,
    groups,
    stats,
    editingDocument,
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
    handleSaveDocument,
    handleDelete,
    handleReorder,
    handleAddDocument,
    handleAddGroup,
    handleEditGroup,
    handleSaveGroup,
    handleDeleteGroup,
    handleGroupReorder,
    handleToggleGroup,
    syncWithServer,
    handleResetLoadAttempts
  } = useDocuments();
  
  const { toast } = useToast();

  // Correction: Gestionnaire d'événement correctement typé
  const handleExportPdf = (event: React.MouseEvent) => {
    exportDocumentsToPdf(documents, groups);
    toast({
      title: "Export PDF réussi",
      description: "Le document a été généré et téléchargé",
    });
  };

  // Correction: Supprimer handleSync car il est redondant avec syncWithServer
  // et ajouter la gestion des toasts directement dans useDocuments.ts

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Gestion Documentaire</h1>
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
        <SyncStatusIndicator 
          syncFailed={syncFailed} 
          onReset={handleResetLoadAttempts} 
          isSyncing={isSyncing}
          isOnline={isOnline}
          lastSynced={lastSynced}
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
              onClick={handleResetLoadAttempts}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DocumentStatusDisplay stats={stats} />

      {documents.length > 0 ? (
        <DocumentTable 
          documents={documents}
          groups={groups}
          onResponsabiliteChange={handleResponsabiliteChange}
          onAtteinteChange={handleAtteinteChange}
          onExclusionChange={handleExclusionChange}
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
          <p className="text-gray-500">Impossible de charger les documents.</p>
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Aucun document trouvé. Cliquez sur "Nouveau document" pour commencer.</p>
        </div>
      )}

      <div className="flex justify-end mt-4 space-x-2">
        <Button 
          variant="outline"
          onClick={() => handleAddGroup()}
          className="hover:bg-gray-100 transition-colors mr-2"
          title="Nouveau groupe"
        >
          <FolderPlus className="h-5 w-5 mr-2" />
          Nouveau groupe
        </Button>
        <Button 
          variant="default"
          onClick={() => handleAddDocument()}
        >
          Nouveau document
        </Button>
      </div>

      <DocumentForm 
        document={editingDocument}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveDocument}
      />

      <DocumentGroupDialog
        group={editingGroup}
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        onSave={handleSaveGroup}
        isEditing={!!editingGroup}
      />
    </div>
  );
};

const GestionDocumentaire = () => (
  <MembresProvider>
    <GestionDocumentaireContent />
  </MembresProvider>
);

export default GestionDocumentaire;
