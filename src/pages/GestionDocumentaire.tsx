
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentTable from '@/components/documents/DocumentTable';
import SyncStatusIndicator from '@/components/sync/SyncStatusIndicator';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

const GestionDocumentaire = () => {
  const navigate = useNavigate();
  const { syncStates, isOnline, syncTable } = useGlobalSync();
  const [currentUser, setCurrentUser] = useState<string>(getDatabaseConnectionCurrentUser() || 'default');
  
  // Récupérer l'état de synchronisation spécifique pour 'documents'
  const documentsSyncState = syncStates['documents'] || { 
    isSyncing: false, 
    lastSynced: null,
    syncFailed: false 
  };
  
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

  // Fonction pour déclencher une synchronisation manuelle
  const handleSync = async () => {
    try {
      await syncTable('documents', []);
      console.log("Synchronisation des documents terminée");
    } catch (error) {
      console.error("Erreur lors de la synchronisation des documents:", error);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion Documentaire</h1>
        <div className="flex items-center space-x-2">
          <SyncStatusIndicator 
            isSyncing={documentsSyncState.isSyncing}
            lastSynced={documentsSyncState.lastSynced}
            isOnline={isOnline}
            syncFailed={documentsSyncState.syncFailed}
            onSyncClick={handleSync}
          />
        </div>
      </div>
      
      <DocumentTable currentUser={currentUser} />
    </div>
  );
};

export default GestionDocumentaire;
