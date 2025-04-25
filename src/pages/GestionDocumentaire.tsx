
import React from 'react';
import { FileText, FolderPlus, CloudSun, AlertTriangle } from 'lucide-react';
import { MembresProvider } from '@/contexts/MembresContext';
import DocumentForm from '@/components/gestion-documentaire/DocumentForm';
import DocumentStatusDisplay from '@/components/gestion-documentaire/DocumentStats';
import DocumentTable from '@/components/gestion-documentaire/DocumentTable';
import { DocumentGroupDialog } from '@/components/gestion-documentaire/DocumentGroupDialog';
import { useDocuments } from '@/hooks/useDocuments';
import { exportDocumentsToPdf } from '@/services/pdfExport';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert"; 
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
    setDialogOpen,
    setGroupDialogOpen,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleEdit,
    handleSaveDocument,
    handleDelete,
    handleAddDocument,
    handleReorder,
    handleAddGroup,
    handleEditGroup,
    handleSaveGroup,
    handleDeleteGroup,
    handleGroupReorder,
    handleToggleGroup,
    syncWithServer,
    apiAvailable
  } = useDocuments();
  
  const { toast } = useToast();

  const handleExportPdf = () => {
    exportDocumentsToPdf(documents, groups);
    toast({
      title: "Export PDF réussi",
      description: "Le document a été généré et téléchargé",
    });
  };

  const apiUnavailable = !apiAvailable.load || !apiAvailable.sync;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Gestion Documentaire</h1>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={syncWithServer}
            className="text-blue-600 p-2 rounded-md hover:bg-blue-50 transition-colors flex items-center"
            title="Synchroniser avec le serveur"
            disabled={isSyncing || !apiAvailable.sync}
          >
            <CloudSun className={`h-6 w-6 stroke-[1.5] ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleExportPdf}
            className="text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
            title="Exporter en PDF"
          >
            <FileText className="h-6 w-6 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {apiUnavailable && (
        <Alert variant="warning" className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            <span className="font-bold">Mode hors ligne</span>: La synchronisation avec le serveur n'est pas disponible pour le moment. Les modifications seront sauvegardées localement.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4">
        <SyncStatusIndicator 
          isSyncing={isSyncing}
          isOnline={isOnline}
          lastSynced={lastSynced}
        />
      </div>

      <DocumentStatusDisplay stats={stats} />

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
          onClick={handleAddGroup}
          className="hover:bg-gray-100 transition-colors mr-2"
          title="Nouveau groupe"
        >
          <FolderPlus className="h-5 w-5 mr-2" />
          Nouveau groupe
        </Button>
        <Button 
          variant="default"
          onClick={handleAddDocument}
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
