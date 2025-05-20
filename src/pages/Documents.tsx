
import React from 'react';
import { FileText, Plus, FolderPlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useDocuments } from '@/hooks/useDocuments';
import DocumentTable from '@/components/documents/DocumentTable';
import SyncIndicator from '@/components/common/SyncIndicator';
import { exportDocumentsToPdf } from '@/services/documentsExport';

const Documents = () => {
  const {
    documents,
    groups,
    handleEdit,
    handleDelete,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleReorder,
    handleGroupReorder,
    handleToggleGroup,
    handleEditGroup,
    handleDeleteGroup,
    setDialogOpen,
    setGroupDialogOpen,
    isSyncing,
    isOnline,
    syncFailed,
    lastSynced,
    syncWithServer
  } = useDocuments();

  const { toast } = useToast();

  const handleExportPdf = () => {
    if (documents && documents.length > 0) {
      exportDocumentsToPdf(documents, groups, "Liste des documents");
    } else {
      toast({
        title: "Export impossible",
        description: "Aucun document disponible à exporter",
      });
    }
  };

  // Create a wrapper function that returns Promise<void> for SyncIndicator
  const handleSync = async () => {
    await syncWithServer();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Gestion documentaire</h1>
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
          syncFailed={syncFailed}
          lastSynced={lastSynced}
          onSync={handleSync}
          showOnlyErrors={true}
        />
      </div>

      {syncFailed && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erreur de synchronisation</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <div>Une erreur est survenue lors de la synchronisation des documents</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSync}
              className="ml-4"
            >
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isSyncing ? (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Chargement des documents...</p>
        </div>
      ) : (
        <>
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
          
          <div className="flex justify-end mt-4 space-x-2">
            <Button 
              variant="outline"
              onClick={() => setGroupDialogOpen(true)}
              className="hover:bg-gray-100 transition-colors mr-2"
              title="Nouveau groupe"
            >
              <FolderPlus className="h-5 w-5 mr-2" />
              Nouveau groupe
            </Button>
            <Button 
              variant="default"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouveau document
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Documents;
