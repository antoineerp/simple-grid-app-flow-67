
import React, { useEffect, useState } from 'react';
import DocumentTable from '@/components/documents/DocumentTable';
import { useDocuments } from '@/hooks/useDocuments';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { Button } from '@/components/ui/button';
import { Plus, FileText, RefreshCw, FolderPlus, Save, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    syncWithServer,
    lastSynced
  } = useDocuments();
  
  const [currentUser, setCurrentUser] = useState<string>(getDatabaseConnectionCurrentUser() || 'default');
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  // Écouter les changements d'utilisateur
  useEffect(() => {
    const handleUserChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.user) {
        setCurrentUser(customEvent.detail.user);
        console.log(`GestionDocumentaire: Changement d'utilisateur - ${customEvent.detail.user}`);
      }
    };
    
    window.addEventListener('database-user-changed', handleUserChange);
    
    return () => {
      window.removeEventListener('database-user-changed', handleUserChange);
    };
  }, []);

  const handleRefresh = () => {
    forceReload();
  };

  const handleSaveManually = async () => {
    try {
      // Montrer l'état de sauvegarde en cours
      setSaveSuccess(null);
      
      // Forcer une synchronisation
      const result = await syncWithServer();
      
      // Montrer le résultat
      setSaveSuccess(result);
      
      // Afficher un toast avec le résultat
      if (result) {
        toast({
          title: "Sauvegarde réussie",
          description: "Vos documents ont été sauvegardés avec succès et seront disponibles lors de votre prochaine connexion.",
          variant: "default"
        });
      } else {
        toast({
          title: "Échec de la sauvegarde",
          description: "Vos documents sont sauvegardés localement mais la synchronisation avec le serveur a échoué.",
          variant: "destructive"
        });
      }
      
      // Réinitialiser l'indicateur après 3 secondes
      setTimeout(() => {
        setSaveSuccess(null);
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde manuelle:", error);
      setSaveSuccess(false);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la sauvegarde.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion Documentaire</h1>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleSaveManually}
            variant="outline"
            size="sm"
            className="flex items-center"
            disabled={isSyncing}
          >
            {saveSuccess === null ? (
              <>
                <Save className="h-4 w-4 mr-1" />
                Sauvegarder
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-4 w-4 mr-1 text-green-500" />
                Sauvegardé
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1 text-red-500" />
                Réessayer
              </>
            )}
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="flex items-center"
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>
      
      {lastSynced && (
        <div className="text-sm text-gray-500 mb-4">
          Dernière synchronisation: {new Date(lastSynced).toLocaleString()}
        </div>
      )}
      
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
