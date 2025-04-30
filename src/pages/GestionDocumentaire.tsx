
import React, { useEffect, useState } from 'react';
import DocumentTable from '@/components/documents/DocumentTable';
import { useDocuments } from '@/hooks/useDocuments';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { Button } from '@/components/ui/button';
import { Plus, FileText, RefreshCw, FolderPlus, Save, Check, AlertTriangle } from 'lucide-react';
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
  const [showSaveNotification, setShowSaveNotification] = useState<boolean>(false);
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

  // Sauvegarder régulièrement les modifications et afficher une notification
  useEffect(() => {
    if (documents.length > 0) {
      // Afficher une notification pour encourager l'utilisateur à sauvegarder
      // seulement après que des données ont été chargées et si la notification n'est pas déjà affichée
      if (!showSaveNotification && !isSyncing) {
        const timer = setTimeout(() => {
          setShowSaveNotification(true);
          toast({
            title: "N'oubliez pas de sauvegarder",
            description: "Cliquez sur le bouton 'Sauvegarder' pour envoyer vos changements au serveur Infomaniak.",
            variant: "default"
          });
        }, 30000); // 30 secondes après le chargement
        
        return () => clearTimeout(timer);
      }
    }
  }, [documents, isSyncing, showSaveNotification, toast]);

  // Effet pour sauvegarder avant de quitter la page
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Vérifier s'il y a des documents non synchronisés
      if (documents.length > 0 && !lastSynced) {
        // Message personnalisé (ne fonctionne pas sur tous les navigateurs)
        const message = "Vos modifications n'ont pas été sauvegardées. Voulez-vous vraiment quitter la page?";
        event.returnValue = message; // Standard
        return message; // Pour les navigateurs plus anciens
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [documents, lastSynced]);

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
      
      // Masquer la notification d'encouragement à sauvegarder
      setShowSaveNotification(false);
      
      // Afficher un toast avec le résultat
      if (result) {
        toast({
          title: "Sauvegarde réussie",
          description: "Vos documents ont été sauvegardés avec succès sur le serveur Infomaniak et seront disponibles lors de votre prochaine connexion.",
          variant: "default"
        });
      } else {
        toast({
          title: "Échec de la sauvegarde",
          description: "Vos documents sont sauvegardés localement mais la synchronisation avec le serveur Infomaniak a échoué.",
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
        description: "Une erreur s'est produite lors de la sauvegarde sur le serveur Infomaniak.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion Documentaire</h1>
        <div className="flex items-center space-x-2">
          {showSaveNotification && (
            <div className="flex items-center text-amber-500 mr-2">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="text-sm">Changements non sauvegardés</span>
            </div>
          )}
          <Button
            onClick={handleSaveManually}
            variant="outline"
            size="sm"
            className={`flex items-center ${showSaveNotification ? 'border-amber-500 text-amber-600' : ''}`}
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
