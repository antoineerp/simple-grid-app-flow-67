
import React, { useEffect, useState } from 'react';
import DocumentTable from '@/components/documents/DocumentTable';
import { useDocuments } from '@/hooks/useDocuments';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { Button } from '@/components/ui/button';
import { Plus, FileText, RefreshCw, FolderPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SyncIndicator from '@/components/common/SyncIndicator';
import { syncDebugger } from '@/utils/syncDebugHelper';

const GestionDocumentaire = () => {
  const { 
    documents, 
    groups, 
    handleEdit, 
    handleDelete, 
    handleReorder, 
    handleToggleGroup, 
    handleEditGroup, 
    handleDeleteGroup, 
    handleResponsabiliteChange, 
    handleAtteinteChange, 
    handleExclusionChange, 
    handleAddDocument, 
    handleAddGroup,
    handleGroupReorder,
    forceReload,
    isSyncing,
    syncFailed,
    lastSynced,
    isOnline
  } = useDocuments();
  
  const [currentUser, setCurrentUser] = useState<string>(getDatabaseConnectionCurrentUser() || 'default');
  const { toast } = useToast();
  
  // Écouter les changements d'utilisateur
  useEffect(() => {
    const handleUserChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.user) {
        setCurrentUser(customEvent.detail.user);
        console.log(`GestionDocumentaire: Changement d'utilisateur - ${customEvent.detail.user}`);
        
        // Forcer un rechargement des données après un changement d'utilisateur
        setTimeout(() => {
          forceReload();
        }, 500);
      }
    };
    
    window.addEventListener('database-user-changed', handleUserChange);
    
    return () => {
      window.removeEventListener('database-user-changed', handleUserChange);
    };
  }, [forceReload]);

  const handleRefresh = async () => {
    // D'abord réparer l'historique de synchronisation
    await syncDebugger.repairSyncHistory();
    
    // Puis vérifier et réparer les tables
    await syncDebugger.checkAndRepairTables();
    
    // Enfin, forcer le rechargement des données
    forceReload();
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion Documentaire</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="ml-2"
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisation...' : 'Actualiser'}
          </Button>
        </div>
      </div>
      
      {/* Indicateur de synchronisation pour afficher l'état de la synchronisation */}
      <SyncIndicator 
        isSyncing={isSyncing}
        isOnline={isOnline}
        syncFailed={syncFailed}
        lastSynced={lastSynced}
        onSync={forceReload}
        tableName="documents"
      />
      
      {documents && documents.length > 0 ? (
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
      ) : (
        <div className="bg-white rounded-md shadow p-8 text-center">
          <p className="text-gray-500 mb-4">Aucun document trouvé.</p>
          {isSyncing && <p className="text-blue-500">Chargement en cours...</p>}
        </div>
      )}
      
      <div className="mt-4 flex justify-end space-x-2">
        <Button
          onClick={handleAddGroup}
          variant="outline"
          className="flex items-center hover:bg-gray-100 transition-colors"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Nouveau groupe
        </Button>
        <Button
          onClick={handleAddDocument}
          className="flex items-center bg-app-blue hover:bg-app-blue/90"
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter un document
        </Button>
      </div>
    </div>
  );
};

export default GestionDocumentaire;
