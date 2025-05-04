
import React, { useEffect, useState } from 'react';
import DocumentTable from '@/components/documents/DocumentTable';
import { Button } from '@/components/ui/button';
import { Plus, FileText, RefreshCw, FolderPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSyncedData } from '@/hooks/useSyncedData';
import { Document, DocumentGroup } from '@/types/documents';

const GestionDocumentaire = () => {
  const { toast } = useToast();
  
  // Utiliser notre hook pour gérer les documents
  const {
    data: documents,
    updateData: setDocuments,
    isSyncing,
    isOnline,
    forceReload,
    repairSync,
    currentUser
  } = useSyncedData<Document>(
    'documents',
    [],
    async (userId) => {
      // Fonction de chargement des documents
      console.log("Chargement des documents pour", userId);
      const storedData = localStorage.getItem(`documents_${userId}`);
      return storedData ? JSON.parse(storedData) : [];
    },
    async (data, userId) => {
      // Fonction de sauvegarde des documents
      console.log("Sauvegarde des documents pour", userId);
      localStorage.setItem(`documents_${userId}`, JSON.stringify(data));
      return true;
    }
  );
  
  // Utiliser notre hook pour gérer les groupes de documents
  const {
    data: groups,
    updateData: setGroups,
  } = useSyncedData<DocumentGroup>(
    'document_groups',
    [],
    async (userId) => {
      // Fonction de chargement des groupes
      console.log("Chargement des groupes pour", userId);
      const storedData = localStorage.getItem(`document_groups_${userId}`);
      return storedData ? JSON.parse(storedData) : [];
    },
    async (data, userId) => {
      // Fonction de sauvegarde des groupes
      console.log("Sauvegarde des groupes pour", userId);
      localStorage.setItem(`document_groups_${userId}`, JSON.stringify(data));
      return true;
    }
  );

  // Fonctions de gestion des documents
  const handleEdit = (id: string) => {
    // Implémentation de la modification d'un document
    console.log("Édition du document", id);
    // Logique d'édition...
  };

  const handleDelete = (id: string) => {
    // Supprimer un document
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocuments);
  };

  const handleReorder = (startIndex: number, endIndex: number, targetGroupId?: string) => {
    // Réordonner les documents
    const result = Array.from(documents);
    const [removed] = result.splice(startIndex, 1);
    
    if (targetGroupId) {
      removed.groupId = targetGroupId;
    }
    
    result.splice(endIndex, 0, removed);
    setDocuments(result);
  };

  const handleGroupReorder = (startIndex: number, endIndex: number) => {
    // Réordonner les groupes
    const result = Array.from(groups);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setGroups(result);
  };
  
  // Fonctions de gestion des groupes
  const handleToggleGroup = (id: string) => {
    // Ouvrir/fermer un groupe
    const updatedGroups = groups.map(group => 
      group.id === id ? {...group, expanded: !group.expanded} : group
    );
    setGroups(updatedGroups);
  };

  const handleEditGroup = (group: DocumentGroup) => {
    // Modifier un groupe
    const updatedGroups = groups.map(g => 
      g.id === group.id ? group : g
    );
    setGroups(updatedGroups);
  };

  const handleDeleteGroup = (id: string) => {
    // Supprimer un groupe et mettre à jour les documents associés
    const updatedDocuments = documents.map(doc => 
      doc.groupId === id ? {...doc, groupId: undefined} : doc
    );
    setDocuments(updatedDocuments);
    
    const updatedGroups = groups.filter(group => group.id !== id);
    setGroups(updatedGroups);
  };
  
  // Fonctions pour les responsabilités et l'atteinte
  const handleResponsabiliteChange = (id: string, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    // Mettre à jour les responsabilités d'un document
    const updatedDocuments = documents.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          responsabilites: {
            ...(doc.responsabilites || { r: [], a: [], c: [], i: [] }),
            [type]: values
          }
        };
      }
      return doc;
    });
    setDocuments(updatedDocuments);
  };

  const handleAtteinteChange = (id: string, atteinte: 'NC' | 'PC' | 'C' | 'EX' | null) => {
    // Mettre à jour l'atteinte d'un document
    const updatedDocuments = documents.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          etat: atteinte
        };
      }
      return doc;
    });
    setDocuments(updatedDocuments);
  };

  const handleExclusionChange = (id: string) => {
    // Exclure un document
    const updatedDocuments = documents.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          etat: doc.etat === 'EX' ? null : 'EX'
        };
      }
      return doc;
    });
    setDocuments(updatedDocuments);
  };
  
  // Gestion des ajouts
  const handleAddDocument = () => {
    // Ajouter un nouveau document
    console.log("Ajout d'un nouveau document");
    // Logique d'ajout...
  };

  const handleAddGroup = () => {
    // Ajouter un nouveau groupe
    console.log("Ajout d'un nouveau groupe");
    // Logique d'ajout...
  };

  const handleRefresh = async () => {
    await repairSync();
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion Documentaire</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="ml-2"
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Chargement...' : 'Actualiser'}
          </Button>
        </div>
      </div>
      
      {documents && documents.length > 0 ? (
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
      ) : (
        <div className="bg-white rounded-md shadow p-8 text-center">
          <p className="text-gray-500 mb-4">Aucun document trouvé.</p>
          {isSyncing && <p className="text-blue-500">Chargement en cours...</p>}
        </div>
      )}
      
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

