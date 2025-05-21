
import React, { useState } from 'react';
import { FileText, Plus, FolderPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDocuments } from '@/hooks/useDocuments';
import DocumentTable from '@/components/gestion-documentaire/DocumentTable';
import DocumentForm from '@/components/gestion-documentaire/DocumentForm';
import { DocumentGroupDialog } from '@/components/gestion-documentaire/DocumentGroupDialog';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { DataSyncManager } from '@/components/common/DataSyncManager';
import { exportDocumentsToPdf } from '@/services/documentsExport';
import { ensureCorrectUserId } from '@/services/core/userIdConverter';
import DocumentStatusDisplay from '@/components/gestion-documentaire/DocumentStats';
import { calculateDocumentStats } from '@/services/documents/documentStatsService';

const GestionDocumentaire = () => {
  const {
    documents,
    groups,
    stats,
    editingDocument,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    isSyncing,
    setIsSyncing,
    isOnline,
    lastSynced,
    setLastSynced,
    syncFailed,
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
    handleGroupReorder,
    handleToggleGroup,
    handleEditGroup,
    handleSaveGroup,
    handleDeleteGroup,
    handleAddGroup,
    syncWithServer,
    loadDocuments
  } = useDocuments();
  
  const { toast } = useToast();

  // Calculate document stats
  const documentStats = calculateDocumentStats(documents);

  const handleExportPdf = () => {
    if (documents && documents.length > 0) {
      exportDocumentsToPdf(documents, groups, "Liste des documents");
      toast({
        title: "Export PDF réussi",
        description: "Le document a été généré et téléchargé",
      });
    } else {
      toast({
        title: "Export impossible",
        description: "Aucun document disponible à exporter",
      });
    }
  };

  // New handler to add document directly in the table
  const handleAddDirectDocument = () => {
    const newDocument = handleAddDocument();
    // No need to open the dialog form
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Gestion Documentaire</h1>
          <DocumentStatusDisplay stats={documentStats} />
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

      <DataSyncManager
        data={documents}
        loadFromServer={loadDocuments}
        syncWithServer={syncWithServer}
        setData={() => {/* Pas besoin de mise à jour, géré par useDocuments */}}
        lastSynced={lastSynced}
        setLastSynced={setLastSynced}
      >
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
        ) : isSyncing ? (
          <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
            <p className="text-gray-500">Chargement des documents...</p>
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
            <p className="text-gray-500">Aucun document trouvé. Cliquez sur "Ajouter un document" pour commencer.</p>
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
            onClick={handleAddDocument}
          >
            <Plus className="h-5 w-5 mr-2" />
            Ajouter un document
          </Button>
        </div>
      </DataSyncManager>

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

export default GestionDocumentaire;
