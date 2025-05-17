import React, { useEffect, useState } from 'react';
import DocumentTable from '@/components/gestion-documentaire/DocumentTable';
import { useDocuments } from '@/hooks/useDocuments';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, FolderPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Document, DocumentGroup } from '@/types/documents';

const GestionDocumentaire = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<string>(getDatabaseConnectionCurrentUser() || 'default');
  
  // Initialiser avec des valeurs par défaut pour éviter les erreurs null
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Utiliser le hook useDocuments de manière sécurisée
  const documentHook = useDocuments();
  
  // Charger les données depuis le hook de manière sécurisée
  useEffect(() => {
    if (documentHook && documentHook.documents) {
      setDocuments(documentHook.documents);
    }
    
    if (documentHook && documentHook.groups) {
      setGroups(documentHook.groups);
    }
  }, [documentHook]);
  
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

  const handleResponsabiliteChange = (id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    if (documentHook && documentHook.handleResponsabiliteChange) {
      documentHook.handleResponsabiliteChange(id, type, values);
    }
  };

  const handleAtteinteChange = (id: string, atteinte: 'NC' | 'PC' | 'C' | null) => {
    if (documentHook && documentHook.handleAtteinteChange) {
      documentHook.handleAtteinteChange(id, atteinte);
    }
  };

  const handleExclusionChange = (id: string) => {
    if (documentHook && documentHook.handleExclusionChange) {
      documentHook.handleExclusionChange(id);
    }
  };

  const handleEdit = (id: string) => {
    if (documentHook && documentHook.handleEdit) {
      documentHook.handleEdit(id);
    }
  };

  const handleDelete = (id: string) => {
    if (documentHook && documentHook.handleDelete) {
      documentHook.handleDelete(id);
    }
  };

  const handleReorder = (startIndex: number, endIndex: number, targetGroupId?: string) => {
    if (documentHook && documentHook.handleReorder) {
      documentHook.handleReorder(startIndex, endIndex, targetGroupId);
    }
  };

  const handleGroupReorder = (startIndex: number, endIndex: number) => {
    if (documentHook && documentHook.handleGroupReorder) {
      documentHook.handleGroupReorder(startIndex, endIndex);
    }
  };

  const handleToggleGroup = (id: string) => {
    if (documentHook && documentHook.handleToggleGroup) {
      documentHook.handleToggleGroup(id);
    }
  };

  const handleEditGroup = (group: DocumentGroup) => {
    if (documentHook && documentHook.handleEditGroup) {
      documentHook.handleEditGroup(group);
    }
  };

  const handleDeleteGroup = (id: string) => {
    if (documentHook && documentHook.handleDeleteGroup) {
      documentHook.handleDeleteGroup(id);
    }
  };

  const handleAddDocument = () => {
    if (documentHook && documentHook.handleAddDocument) {
      documentHook.handleAddDocument();
    }
  };

  const handleAddGroup = () => {
    if (documentHook && documentHook.handleAddGroup) {
      documentHook.handleAddGroup();
    }
  };

  const handleRefresh = () => {
    if (documentHook && documentHook.forceReload) {
      setIsSyncing(true);
      documentHook.forceReload().finally(() => {
        setIsSyncing(false);
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion Documentaire</h1>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="ml-2"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>
      
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
