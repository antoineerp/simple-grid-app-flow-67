
import React, { useState, useEffect } from 'react';
import { BibliothequeHeader } from '@/features/bibliotheque/components/BibliothequeHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useDataSync } from '@/hooks/useDataSync';
import { triggerSync } from '@/services/sync/triggerSync';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    isOnline
  } = useDataSync<Document>('bibliotheque');

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
  }, [loadData, syncData, isOnline, toast]);

  const handleSync = async () => {
    try {
      setIsLoading(true);
      await syncData();
      toast({
        title: "Synchronisation réussie",
        description: "Les documents ont été synchronisés avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      toast({
        title: "Erreur de synchronisation",
        description: "La synchronisation a échoué.",
        variant: "destructive"
      });
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

  return (
    <div className="container mx-auto py-6">
      <BibliothequeHeader 
        onSync={handleSync} 
        syncFailed={status === 'error'} 
        isSyncing={isLoading || status === 'syncing'}
      />
      
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddDocument} className="flex items-center gap-1">
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
      
      {pendingChanges && isOnline && (
        <div className="fixed bottom-4 right-4 bg-amber-100 text-amber-800 p-3 rounded-md shadow-md">
          <p className="text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Des modifications sont en attente de synchronisation
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSync} 
            className="mt-1 text-xs p-1"
          >
            Synchroniser maintenant
          </Button>
        </div>
      )}
    </div>
  );
};

export default Collaboration;
