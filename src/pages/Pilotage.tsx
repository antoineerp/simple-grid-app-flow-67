
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { MembresProvider } from '@/contexts/MembresContext';
import { exportPilotageToOdf } from "@/services/pdfExport";
import { useSyncContext } from '@/contexts/SyncContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import PilotageHeader from '@/components/pilotage/PilotageHeader';
import PilotageActions from '@/components/pilotage/PilotageActions';
import PilotageDocumentsTable from '@/components/pilotage/PilotageDocumentsTable';
import DocumentDialog from '@/components/pilotage/DocumentDialog';
import ExigenceSummary from '@/components/pilotage/ExigenceSummary';
import DocumentSummary from '@/components/pilotage/DocumentSummary';
import ResponsabilityMatrix from '@/components/pilotage/ResponsabilityMatrix';
import { getCurrentUser } from '@/services/auth/authService';

const Pilotage = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  
  // Use global synchronization 
  const { syncStates, registerSync, updateSyncState, syncAll } = useSyncContext();
  const { isOnline } = useNetworkStatus();
  
  // Get sync state for pilotage
  const syncState = syncStates.pilotage || {
    isSyncing: false,
    lastSynced: null,
    syncFailed: false
  };
  
  // Register for synchronization on mount and load initial data
  useEffect(() => {
    registerSync('pilotage');
    
    // Load data from local storage
    const loadLocalData = () => {
      try {
        const currentUser = getCurrentUser() || 'p71x6d_system';
        const storageKey = `pilotage_${currentUser}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setDocuments(Array.isArray(parsedData) ? parsedData : []);
        }
      } catch (error) {
        console.error("Error loading pilotage data from local storage:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLocalData();
  }, [registerSync]);

  // Handler to sync documents
  const handleSyncDocuments = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: "Mode hors ligne",
        description: "La synchronisation n'est pas disponible en mode hors ligne",
        variant: "destructive"
      });
      return false;
    }
    
    updateSyncState('pilotage', { isSyncing: true });
    
    try {
      // Save current documents to localStorage
      const currentUser = getCurrentUser() || 'p71x6d_system';
      localStorage.setItem(`pilotage_${currentUser}`, JSON.stringify(documents));
      
      // Sync with server
      await syncAll();
      
      updateSyncState('pilotage', {
        isSyncing: false,
        lastSynced: new Date(),
        syncFailed: false
      });
      
      toast({
        title: "Synchronisation réussie",
        description: "Les documents ont été synchronisés avec succès"
      });
      
      return true;
    } catch (error) {
      console.error("Error syncing documents:", error);
      
      updateSyncState('pilotage', {
        isSyncing: false,
        syncFailed: true
      });
      
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser les documents",
        variant: "destructive"
      });
      
      return false;
    }
  }, [documents, isOnline, updateSyncState, syncAll, toast]);

  // Document CRUD operations
  const handleAddDocument = useCallback(() => {
    setIsEditing(false);
    setCurrentDocument({
      id: `doc-${Date.now()}`,
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      assignee: "",
      createdAt: new Date()
    });
    setIsDialogOpen(true);
  }, []);

  const handleEditDocument = useCallback((document) => {
    setIsEditing(true);
    setCurrentDocument({ ...document });
    setIsDialogOpen(true);
  }, []);

  const handleDeleteDocument = useCallback((id) => {
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocuments);
    
    // Save to local storage and sync
    const currentUser = getCurrentUser() || 'p71x6d_system';
    localStorage.setItem(`pilotage_${currentUser}`, JSON.stringify(updatedDocuments));
    handleSyncDocuments();
    
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès"
    });
  }, [documents, handleSyncDocuments, toast]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCurrentDocument(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSaveDocument = useCallback(() => {
    let updatedDocuments;
    
    if (isEditing) {
      updatedDocuments = documents.map(doc => 
        doc.id === currentDocument.id ? { ...currentDocument, updatedAt: new Date() } : doc
      );
    } else {
      updatedDocuments = [
        ...documents,
        { ...currentDocument, createdAt: new Date() }
      ];
    }
    
    setDocuments(updatedDocuments);
    setIsDialogOpen(false);
    
    // Save to local storage and sync
    const currentUser = getCurrentUser() || 'p71x6d_system';
    localStorage.setItem(`pilotage_${currentUser}`, JSON.stringify(updatedDocuments));
    handleSyncDocuments();
    
    toast({
      title: isEditing ? "Document mis à jour" : "Document ajouté",
      description: isEditing 
        ? `Le document a été mis à jour avec succès` 
        : `Le document a été ajouté avec succès`
    });
  }, [documents, currentDocument, isEditing, handleSyncDocuments, toast]);

  const handleReorder = useCallback((startIndex, endIndex) => {
    const result = Array.from(documents);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    setDocuments(result);
    
    // Save to local storage and sync
    const currentUser = getCurrentUser() || 'p71x6d_system';
    localStorage.setItem(`pilotage_${currentUser}`, JSON.stringify(result));
    handleSyncDocuments();
  }, [documents, handleSyncDocuments]);

  const handleExportPdf = useCallback(() => {
    if (documents.length > 0) {
      exportPilotageToOdf(documents);
      toast({
        title: "Export PDF",
        description: "Les documents ont été exportés au format PDF",
      });
    } else {
      toast({
        title: "Export impossible",
        description: "Aucun document à exporter",
        variant: "destructive"
      });
    }
  }, [documents, toast]);

  return (
    <MembresProvider>
      <div className="p-8">
        <PilotageHeader 
          onExport={handleExportPdf} 
          onSync={handleSyncDocuments}
          isSyncing={syncState.isSyncing}
          syncFailed={syncState.syncFailed}
          lastSynced={syncState.lastSynced}
          isOnline={isOnline}
        />

        {isLoading || syncState.isSyncing ? (
          <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
            <p className="text-gray-500">Chargement des documents...</p>
          </div>
        ) : (
          <PilotageDocumentsTable 
            documents={documents}
            onEditDocument={handleEditDocument}
            onDeleteDocument={handleDeleteDocument}
            onReorder={handleReorder}
          />
        )}

        <PilotageActions onAddDocument={handleAddDocument} />

        <ExigenceSummary />
        <DocumentSummary />
        <ResponsabilityMatrix />

        <DocumentDialog 
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          currentDocument={currentDocument}
          onInputChange={handleInputChange}
          onSave={handleSaveDocument}
          isEditing={isEditing}
        />
      </div>
    </MembresProvider>
  );
};

export default Pilotage;
