
import React, { useEffect, useState } from 'react';
import { CloudSun, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useBibliotheque } from '@/contexts/BibliothequeContext';
import { exportBibliothecaireDocsToPdf } from '@/services/bibliothequeExport';
import SyncStatusIndicator from '@/components/common/SyncStatusIndicator';

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
    resetSyncFailed
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Bibliothèque de documents</h1>
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
          {groups.map(group => (
            <div key={group.id} className="bg-white rounded-md shadow mb-4 p-4">
              <h2 className="text-xl font-semibold text-app-blue mb-2">{group.name}</h2>
              {group.items && group.items.length > 0 ? (
                <div className="space-y-2">
                  {group.items.map(doc => (
                    <div key={doc.id} className="flex items-center p-2 border-b">
                      <div className="flex-1">
                        <p className="font-medium">{doc.titre}</p>
                        {doc.description && <p className="text-sm text-gray-600">{doc.description}</p>}
                      </div>
                      {doc.url && (
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          Lien
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Aucun document dans cette catégorie</p>
              )}
            </div>
          ))}
          
          {documents.filter(doc => !doc.type).length > 0 && (
            <div className="bg-white rounded-md shadow mb-4 p-4">
              <h2 className="text-xl font-semibold text-app-blue mb-2">Documents non catégorisés</h2>
              <div className="space-y-2">
                {documents.filter(doc => !doc.type).map(doc => (
                  <div key={doc.id} className="flex items-center p-2 border-b">
                    <div className="flex-1">
                      <p className="font-medium">{doc.titre}</p>
                      {doc.description && <p className="text-sm text-gray-600">{doc.description}</p>}
                    </div>
                    {doc.url && (
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        Lien
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {documents.length === 0 && groups.length === 0 && (
            <div className="bg-white rounded-md shadow p-8 text-center">
              <p className="text-gray-500">Aucun document dans la bibliothèque.</p>
              <p className="text-sm mt-2 text-gray-400">La bibliothèque se synchronisera automatiquement lorsque des documents seront disponibles.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Bibliotheque;
