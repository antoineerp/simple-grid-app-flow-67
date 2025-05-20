
import React, { useState } from 'react';
import { FileText, Plus, FolderPlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useCollaboration } from '@/hooks/useCollaboration';
import SyncIndicator from '@/components/common/SyncIndicator';
import { exportCollaborationDocsToPdf } from '@/services/collaborationExport';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Collaboration = () => {
  const { 
    documents, 
    groups, 
    isSyncing, 
    isOnline, 
    syncFailed,
    lastSynced,
    handleSyncDocuments,
    setIsDialogOpen,
    setIsGroupDialogOpen,
    handleAddDocument,
    handleUpdateDocument,
    handleAddGroup
  } = useCollaboration();
  
  const { toast } = useToast();

  // State for document dialog
  const [newDocument, setNewDocument] = useState({
    id: '',
    name: '',
    link: ''
  });
  
  // State for group dialog
  const [newGroup, setNewGroup] = useState({
    id: '',
    name: ''
  });
  
  // Dialog states
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);

  const handleExportPdf = () => {
    if (documents && documents.length > 0) {
      exportCollaborationDocsToPdf(documents, groups, "Documents de collaboration");
    } else {
      toast({
        title: "Export impossible",
        description: "Aucun document disponible à exporter",
      });
    }
  };

  // Create a wrapper function that returns Promise<void> for SyncIndicator
  const handleSync = async () => {
    await handleSyncDocuments();
  };
  
  // Handle document dialog open
  const openDocumentDialog = () => {
    setNewDocument({
      id: '',
      name: '',
      link: ''
    });
    setIsDocDialogOpen(true);
  };
  
  // Handle group dialog open
  const openGroupDialog = () => {
    setNewGroup({
      id: '',
      name: ''
    });
    setIsGroupDialogOpen(true);
  };
  
  // Handle document save
  const saveDocument = () => {
    if (!newDocument.name) {
      toast({
        title: "Erreur",
        description: "Le nom du document est obligatoire",
        variant: "destructive"
      });
      return;
    }
    
    handleAddDocument(newDocument);
    setIsDocDialogOpen(false);
  };
  
  // Handle group save
  const saveGroup = () => {
    if (!newGroup.name) {
      toast({
        title: "Erreur",
        description: "Le nom du groupe est obligatoire",
        variant: "destructive"
      });
      return;
    }
    
    handleAddGroup({
      id: newGroup.id,
      name: newGroup.name,
      expanded: false,
      items: []
    });
    setIsGroupDialogOpen(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Collaboration</h1>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleExportPdf}
            className="text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
            title="Exporter en PDF"
          >
            <FileText className="h-6 w-6 stroke-[1.5]" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <SyncIndicator 
          isSyncing={isSyncing}
          isOnline={isOnline}
          syncFailed={syncFailed}
          lastSynced={lastSynced}
          onSync={handleSync}
          showOnlyErrors={true}
        />
      </div>

      {syncFailed && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erreur de synchronisation</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <div>Une erreur est survenue lors de la synchronisation des documents</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSync}
              className="ml-4"
            >
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isSyncing ? (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Chargement des données de collaboration...</p>
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((item) => (
            <div key={item.id} className="border rounded-md p-4 hover:border-blue-300 transition-colors">
              <h3 className="font-medium">{item.name || "Document sans nom"}</h3>
              <p className="text-sm text-gray-500">{item.link || "Pas de lien"}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Aucune donnée de collaboration disponible</p>
        </div>
      )}

      <div className="flex justify-end mt-4 space-x-2">
        <Button 
          variant="outline"
          onClick={openGroupDialog}
          className="hover:bg-gray-100 transition-colors mr-2"
          title="Nouveau groupe"
        >
          <FolderPlus className="h-5 w-5 mr-2" />
          Nouveau groupe
        </Button>
        <Button 
          variant="default"
          onClick={openDocumentDialog}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouveau document
        </Button>
      </div>
      
      {/* Dialog for adding/editing documents */}
      <Dialog open={isDocDialogOpen} onOpenChange={setIsDocDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="doc-name" className="block text-sm font-medium text-gray-700">Nom du document</label>
              <input
                id="doc-name"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={newDocument.name}
                onChange={e => setNewDocument({...newDocument, name: e.target.value})}
                placeholder="Nom du document"
              />
            </div>
            <div>
              <label htmlFor="doc-link" className="block text-sm font-medium text-gray-700">Lien</label>
              <input
                id="doc-link"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={newDocument.link}
                onChange={e => setNewDocument({...newDocument, link: e.target.value})}
                placeholder="Lien vers le document"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDocDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveDocument}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for adding/editing groups */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau groupe</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="group-name" className="block text-sm font-medium text-gray-700">Nom du groupe</label>
              <input
                id="group-name"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={newGroup.name}
                onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                placeholder="Nom du groupe"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveGroup}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Collaboration;
