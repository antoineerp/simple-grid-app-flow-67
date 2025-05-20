
import React from 'react';
import { FileText, Plus, FolderPlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useCollaboration } from '@/hooks/useCollaboration';
import SyncIndicator from '@/components/common/SyncIndicator';
import { exportCollaborationDocsToPdf } from '@/services/collaborationExport';

const Collaboration = () => {
  const { 
    documents, 
    groups, 
    isSyncing, 
    isOnline, 
    syncFailed,
    lastSynced,
    handleSyncDocuments,
    setIsDialogOpen,
    setIsGroupDialogOpen
  } = useCollaboration();
  
  const { toast } = useToast();

  const handleExportPdf = () => {
    if (documents && documents.length > 0) {
      exportCollaborationDocsToPdf(documents, groups, "Documents de collaboration");
    } else {
      toast({
        title: "Export impossible",
        description: "Aucun document disponible à exporter",
      });
    }
  };

  // Create a wrapper function that returns Promise<void> for SyncIndicator
  const handleSync = async () => {
    await handleSyncDocuments();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Collaboration</h1>
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
          <p className="text-gray-500">Chargement des données de collaboration...</p>
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((item) => (
            <div key={item.id} className="border rounded-md p-4 hover:border-blue-300 transition-colors">
              <h3 className="font-medium">{item.name || "Document sans nom"}</h3>
              <p className="text-sm text-gray-500">{item.link || "Pas de lien"}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Aucune donnée de collaboration disponible</p>
        </div>
      )}

      <div className="flex justify-end mt-4 space-x-2">
        <Button 
          variant="outline"
          onClick={() => setIsGroupDialogOpen(true)}
          className="hover:bg-gray-100 transition-colors mr-2"
          title="Nouveau groupe"
        >
          <FolderPlus className="h-5 w-5 mr-2" />
          Nouveau groupe
        </Button>
        <Button 
          variant="default"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouveau document
        </Button>
      </div>
    </div>
  );
};

export default Collaboration;
