
import React, { useState, useEffect } from 'react';
import { BibliothequeHeader } from '@/features/bibliotheque/components/BibliothequeHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useDataSync } from '@/hooks/useDataSync';

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
  const { 
    data: documents, 
    syncData, 
    loadData,
    isOnline,
    refreshStatus
  } = useDataSync<Document>('bibliotheque');

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await loadData({ showToast: false });
      } catch (error) {
        console.error("Erreur lors du chargement des documents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [loadData]);

  const handleSync = async () => {
    try {
      await syncData();
      refreshStatus();
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <BibliothequeHeader 
        onSync={handleSync} 
        syncFailed={false} 
        isSyncing={isLoading}
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-blue"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {documents.length === 0 ? (
            <div className="col-span-full text-center py-12">
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
