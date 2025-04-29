
import React, { useState, useEffect } from 'react';
import { BibliothequeHeader } from '@/features/bibliotheque/components/BibliothequeHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useDataSync } from '@/hooks/useDataSync';
import { triggerSync } from '@/services/sync/triggerSync';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Plus, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SyncIndicator from '@/components/common/SyncIndicator';

interface Document {
  id: string;
  titre: string;
  description?: string;
  url_fichier?: string;
  type?: string;
  date_creation: string;
}

const Collaboration = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { 
    data: documents, 
    syncData, 
    loadData,
    saveLocalData,
    status,
    lastError,
    pendingChanges,
    isOnline,
    lastSynced
  } = useDataSync<Document>('bibliotheque');
  
  const syncFailed = status === 'error';
  const isSyncing = isLoading || status === 'syncing';

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await loadData({ showToast: false });
        console.log("Documents chargés:", documents.length);
      } catch (error) {
        console.error("Erreur lors du chargement des documents:", error);
        toast({
          title: "Erreur de chargement",
          description: "Les documents n'ont pas pu être chargés correctement.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
    
    // Essayer de synchroniser automatiquement lors du premier chargement
    if (isOnline) {
      syncData().catch(err => {
        console.warn("Erreur lors de la synchronisation initiale:", err);
      });
    }
  }, [loadData, syncData, isOnline, toast, documents.length]);

  const handleSync = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await syncData();
      toast({
        title: "Synchronisation réussie",
        description: "Les documents ont été synchronisés avec succès.",
      });
      return Promise.resolve();
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      toast({
        title: "Erreur de synchronisation",
        description: "La synchronisation a échoué.",
        variant: "destructive"
      });
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddDocument = () => {
    const newId = `doc-${Date.now()}`;
    const newDocument: Document = {
      id: newId,
      titre: `Nouveau document ${new Date().toLocaleDateString()}`,
      description: "Ajoutez une description ici",
      date_creation: new Date().toISOString()
    };
    
    const newDocuments = [...documents, newDocument];
    saveLocalData(newDocuments);
    
    // Notifier le système de synchronisation global
    triggerSync.notifyDataChange('bibliotheque', newDocuments);
    
    toast({
      title: "Document ajouté",
      description: "Le document a été ajouté et sera synchronisé automatiquement.",
    });
  };

  const handleAddGroup = () => {
    toast({
      title: "Ajouter un groupe",
      description: "Fonctionnalité d'ajout de groupe activée",
    });
    // Implémentation à ajouter dans une prochaine étape
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-app-blue">Espace de collaboration</h1>
        </div>
        
        <div className="mb-4">
          <SyncIndicator
            isSyncing={isSyncing}
            isOnline={isOnline}
            syncFailed={syncFailed}
            lastSynced={lastSynced}
            onSync={handleSync}
          />
        </div>
      </div>
      
      <div className="flex justify-end mb-4 space-x-2">
        <Button 
          variant="outline" 
          onClick={handleAddGroup} 
          className="flex items-center gap-1"
        >
          <FolderPlus className="h-4 w-4" /> Ajouter un groupe
        </Button>
        <Button 
          onClick={handleAddDocument} 
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Ajouter un document
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-blue"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {documents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">Aucun document partagé trouvé</p>
              <p className="text-sm text-gray-400 mt-2">
                Les documents partagés apparaîtront ici
              </p>
            </div>
          ) : (
            documents.map(doc => (
              <Card key={doc.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold">{doc.titre}</h2>
                  {doc.description && (
                    <p className="text-gray-600 text-sm mt-2">{doc.description}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-3">
                    {new Date(doc.date_creation).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Collaboration;
