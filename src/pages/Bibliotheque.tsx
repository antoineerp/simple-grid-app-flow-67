
import React, { useEffect, useState } from 'react';
import { CloudSun, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { exportBibliothecaireDocsToPdf } from '@/services/bibliothequeExport';
import SyncStatusIndicator from '@/components/common/SyncStatusIndicator';
import { BibliothequeTable } from '@/features/bibliotheque/components/BibliothequeTable';
import { BibliothequeActions } from '@/features/bibliotheque/components/BibliothequeActions';

const Bibliotheque = () => {
  const { toast } = useToast();
  const { 
    documents, 
    groups,
    isLoading, 
    isSyncing, 
    error, 
    isOnline, 
    syncWithServer,
    lastSynced,
    syncFailed,
    resetSyncFailed,
    handleEditDocument,
    handleDeleteDocument,
    handleAddDocument,
    handleEditGroup,
    handleDeleteGroup,
    handleToggleGroup,
    draggedItem,
    setDraggedItem,
    handleDrop,
    handleGroupDrop,
    setIsDialogOpen,
    setIsGroupDialogOpen,
    setCurrentDocument,
    setCurrentGroup,
    setIsEditing
  } = useBibliotheque();

  // Effectuer une seule synchronisation au chargement de la page
  useEffect(() => {
    if (!isLoading && isOnline && !syncFailed && !isSyncing) {
      console.log("Synchronisation initiale de la bibliothèque");
      syncWithServer().catch(console.error);
    }
  }, [isLoading]);

  const handleExportAllToPdf = () => {
    try {
      exportBibliothecaireDocsToPdf(documents, groups);
      toast({
        title: "Export PDF",
        description: "La bibliothèque a été exportée en PDF",
      });
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'export PDF",
        variant: "destructive",
      });
    }
  };

  const handleResetSync = () => {
    resetSyncFailed();
    syncWithServer().catch(console.error);
  };

  const onDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, groupId }));
    setDraggedItem({ id, groupId });
    e.currentTarget.classList.add('opacity-50');
  };

  const onDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-gray-100');
  };

  const onDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('bg-gray-100');
  };

  const onDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItem(null);
  };

  const onAddDocument = () => {
    setCurrentDocument({
      id: '',
      titre: '',
      description: '',
      date_creation: new Date().toISOString(),
      url: ''
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const onAddGroup = () => {
    setCurrentGroup({
      id: '',
      name: '',
      expanded: false,
      items: []
    });
    setIsEditing(false);
    setIsGroupDialogOpen(true);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Collaboration</h1>
          <p className="text-gray-600">Gestion des documents partagés</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => syncWithServer()}
            className="text-blue-600 p-2 rounded-md hover:bg-blue-50 transition-colors flex items-center"
            title="Synchroniser avec le serveur"
            disabled={isSyncing || !isOnline || syncFailed}
          >
            <CloudSun className={`h-6 w-6 stroke-[1.5] ${isSyncing ? 'animate-spin' : ''} ${syncFailed ? 'text-gray-400' : ''}`} />
          </button>
          <button 
            onClick={handleExportAllToPdf}
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
          onReset={handleResetSync} 
          isSyncing={isSyncing} 
          isOnline={isOnline}
          lastSynced={lastSynced}
        />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-md shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      ) : (
        <>
          <BibliothequeTable
            documents={documents}
            groups={groups}
            onEditDocument={handleEditDocument}
            onDeleteDocument={handleDeleteDocument}
            onEditGroup={handleEditGroup}
            onDeleteGroup={handleDeleteGroup}
            onToggleGroup={handleToggleGroup}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={handleDrop}
            onDragEnd={onDragEnd}
            onGroupDrop={handleGroupDrop}
          />
          
          <BibliothequeActions 
            onAddGroup={onAddGroup}
            onAddDocument={onAddDocument}
          />
        </>
      )}
    </div>
  );
};

export default Bibliotheque;
