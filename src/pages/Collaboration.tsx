
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, ExternalLink, ChevronDown, ChevronUp, FolderPlus, Plus, RefreshCw } from 'lucide-react';
import { useSyncedData } from '@/hooks/useSyncedData';
import SyncIndicator from '@/components/common/SyncIndicator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getDeviceId } from '@/services/core/userService';

// Définir une interface CollaborationDocument pour éviter les conflits de typage
interface CollaborationDocument {
  id: string;
  name: string;
  link: string | null;
  groupId?: string;
  userId?: string;
}

// Interface pour les groupes de collaboration
interface CollaborationGroup {
  id: string;
  name: string;
  expanded: boolean;
  userId?: string;
}

// Simplified document dialog component
const DocumentDialog = ({ 
  isOpen, 
  onOpenChange, 
  onClose, 
  document, 
  isEditing, 
  onChange, 
  onSave 
}: { 
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  document: CollaborationDocument | null;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}) => {
  if (!document) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier le document" : "Ajouter un document"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nom</Label>
            <Input 
              id="name" 
              name="name" 
              value={document.name} 
              onChange={onChange} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="link" className="text-right">Lien</Label>
            <Input 
              id="link" 
              name="link" 
              value={document.link || ''} 
              onChange={onChange} 
              className="col-span-3"
              placeholder="https://..." 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={onSave}>{isEditing ? "Mettre à jour" : "Ajouter"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Simplified group dialog component
const GroupDialog = ({ 
  isOpen, 
  onOpenChange, 
  group, 
  isEditing, 
  onChange, 
  onSave 
}: { 
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  group: CollaborationGroup | null;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}) => {
  if (!group) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier le groupe" : "Ajouter un groupe"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nom</Label>
            <Input 
              id="name" 
              name="name" 
              value={group.name} 
              onChange={onChange} 
              className="col-span-3" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onSave}>{isEditing ? "Mettre à jour" : "Ajouter"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Interface simple pour l'élément draggable
interface DragItem {
  id: string;
  type: string;
}

// Hook simplifié pour drag-and-drop
const useDragAndDrop = (documents: CollaborationDocument[], onReorder: (sourceIndex: number, targetIndex: number, targetGroupId?: string) => void) => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

  const handleDragStart = (e: React.DragEvent, item: DragItem) => {
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    const sourceIndex = documents.findIndex(doc => doc.id === draggedItem.id);
    if (sourceIndex !== -1) {
      onReorder(sourceIndex, targetIndex);
    }
  };
  
  const handleGroupDrop = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    const sourceIndex = documents.findIndex(doc => doc.id === draggedItem.id);
    if (sourceIndex !== -1) {
      onReorder(sourceIndex, sourceIndex, groupId);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return { 
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleGroupDrop
  };
};

const Collaboration = () => {
  // Utiliser le hook useSyncedData pour les documents
  const {
    data: documents,
    updateData: setDocuments,
    isSyncing: isSyncingDocuments,
    isOnline,
    lastSynced,
    forceReload: forceReloadDocuments,
    repairSync: repairSyncDocuments,
    currentUser
  } = useSyncedData<CollaborationDocument>(
    'collaboration',
    [],
    async (userId) => {
      try {
        console.log("Chargement des documents de collaboration pour", userId);
        
        // Rechercher les données sous différentes clés possibles
        let storedData = localStorage.getItem(`collaboration_${userId}`);
        if (!storedData) {
          storedData = localStorage.getItem('collaboration');
          if (!storedData) {
            storedData = localStorage.getItem(`bibliotheque_${userId}`);
            if (!storedData) {
              storedData = localStorage.getItem('bibliotheque');
            }
          }
        }
        
        return storedData ? JSON.parse(storedData) : [];
      } catch (error) {
        console.error("Erreur lors du chargement des documents:", error);
        return [];
      }
    },
    async (data, userId) => {
      try {
        console.log("Sauvegarde des documents de collaboration pour", userId);
        localStorage.setItem(`collaboration_${userId}`, JSON.stringify(data));
        return true;
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des documents:", error);
        return false;
      }
    }
  );

  // Utiliser le hook useSyncedData pour les groupes
  const {
    data: groups,
    updateData: setGroups,
    isSyncing: isSyncingGroups,
    forceReload: forceReloadGroups,
    repairSync: repairSyncGroups
  } = useSyncedData<CollaborationGroup>(
    'collaboration_groups',
    [],
    async (userId) => {
      try {
        console.log("Chargement des groupes de collaboration pour", userId);
        
        // Rechercher les données sous différentes clés possibles
        let storedData = localStorage.getItem(`collaboration_groups_${userId}`);
        if (!storedData) {
          storedData = localStorage.getItem('collaboration_groups');
          if (!storedData) {
            storedData = localStorage.getItem(`bibliotheque_groups_${userId}`);
            if (!storedData) {
              storedData = localStorage.getItem('bibliotheque_groups');
            }
          }
        }
        
        return storedData ? JSON.parse(storedData) : [];
      } catch (error) {
        console.error("Erreur lors du chargement des groupes:", error);
        return [];
      }
    },
    async (data, userId) => {
      try {
        console.log("Sauvegarde des groupes de collaboration pour", userId);
        localStorage.setItem(`collaboration_groups_${userId}`, JSON.stringify(data));
        return true;
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des groupes:", error);
        return false;
      }
    }
  );

  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<CollaborationDocument | null>(null);
  const [currentGroup, setCurrentGroup] = useState<CollaborationGroup | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Variable qui indique si une synchronisation est en cours
  const isSyncing = isSyncingDocuments || isSyncingGroups;
  
  // Variable qui indique si une erreur de synchronisation est survenue
  const syncFailed = loadError !== null;

  // Use the useDragAndDrop hook for drag and drop functionality
  const { 
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleGroupDrop
  } = useDragAndDrop(documents, (sourceIndex, targetIndex, targetGroupId) => {
    // Fonction de réorganisation
    const result = Array.from(documents);
    const [removed] = result.splice(sourceIndex, 1);
    
    if (targetGroupId) {
      removed.groupId = targetGroupId;
    }
    
    result.splice(targetIndex, 0, removed);
    setDocuments(result);
  });

  // Handle document changes
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentDocument) {
      setCurrentDocument({
        ...currentDocument,
        [e.target.name]: e.target.value
      });
    }
  };

  // Handle group changes
  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentGroup) {
      setCurrentGroup({
        ...currentGroup,
        [e.target.name]: e.target.value
      });
    }
  };

  // Fonction de synchronisation
  const handleSync = async () => {
    setLoadError(null);
    try {
      await Promise.all([
        forceReloadDocuments(),
        forceReloadGroups()
      ]);
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      setLoadError("Échec de la synchronisation. Veuillez réessayer.");
    }
  };

  // Handle edit document button click
  const handleEditDocumentClick = (doc: CollaborationDocument) => {
    setCurrentDocument(doc);
    setIsEditing(true);
    setIsDocumentDialogOpen(true);
  };

  // Handle add document button click
  const handleAddDocumentClick = () => {
    setCurrentDocument({ 
      id: String(Date.now()), 
      name: '', 
      link: null,
      userId: currentUser 
    });
    setIsEditing(false);
    setIsDocumentDialogOpen(true);
  };

  // Handle save document
  const handleSaveDocument = () => {
    if (currentDocument) {
      if (isEditing) {
        // Mise à jour d'un document existant
        setDocuments(documents.map(doc => 
          doc.id === currentDocument.id ? currentDocument : doc
        ));
      } else {
        // Ajout d'un nouveau document
        setDocuments([...documents, currentDocument]);
      }
      setIsDocumentDialogOpen(false);
    }
  };

  // Handle edit group button click
  const handleEditGroupClick = (group: CollaborationGroup) => {
    setCurrentGroup(group);
    setIsEditing(true);
    setIsGroupDialogOpen(true);
  };

  // Handle add group button click
  const handleAddGroupClick = () => {
    const newId = Date.now().toString();
    setCurrentGroup({
      id: newId,
      name: '',
      expanded: true,
      userId: currentUser
    });
    setIsEditing(false);
    setIsGroupDialogOpen(true);
  };

  // Handle save group
  const handleSaveGroup = () => {
    if (currentGroup) {
      if (isEditing) {
        // Mise à jour d'un groupe existant
        setGroups(groups.map(group => 
          group.id === currentGroup.id ? currentGroup : group
        ));
      } else {
        // Ajout d'un nouveau groupe
        setGroups([...groups, currentGroup]);
      }
      setIsGroupDialogOpen(false);
    }
  };
  
  // Handle toggle group expansion
  const handleToggleGroup = (id: string) => {
    setGroups(groups.map(group => 
      group.id === id ? { ...group, expanded: !group.expanded } : group
    ));
  };
  
  // Handle delete document
  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };
  
  // Handle delete group
  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter(group => group.id !== id));
    
    // Mettre à jour les documents qui étaient dans ce groupe
    setDocuments(documents.map(doc => 
      doc.groupId === id ? { ...doc, groupId: undefined } : doc
    ));
  };

  // Récupérer l'ID de l'appareil actuel
  const deviceId = getDeviceId();

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-600">Collaboration</h1>
        <Button 
          onClick={handleSync}
          variant="outline"
          size="sm"
          disabled={isSyncing}
          className="ml-4"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
        </Button>
      </div>

      {/* Show sync indicator */}
      <div className="mb-4">
        <SyncIndicator
          isSyncing={isSyncing}
          isOnline={isOnline}
          syncFailed={syncFailed}
          lastSynced={lastSynced}
          onSync={handleSync}
          showOnlyErrors={false}
          tableName="collaboration"
          deviceId={deviceId}
        />
      </div>

      {loadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <div>{loadError}</div>
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

      <div className="bg-white rounded-md shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom du document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lien
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groups.map(group => (
                <React.Fragment key={group.id}>
                  <tr className="bg-gray-100 cursor-pointer" onClick={() => handleToggleGroup(group.id)}>
                    <td colSpan={3} className="px-6 py-3 flex items-center">
                      {group.expanded ? (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronUp className="h-4 w-4 mr-2" />
                      )}
                      <span className="font-medium">{group.name}</span>
                      <div className="ml-auto flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditGroupClick(group);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {group.expanded && documents.filter(doc => doc.groupId === group.id).map((doc, index) => (
                    <tr 
                      key={doc.id} 
                      className="hover:bg-gray-50"
                      draggable
                      onDragStart={(e) => handleDragStart(e, { id: doc.id, type: 'document' })}
                      onDragEnd={handleDragEnd}
                    >
                      <td className="px-6 py-4">{doc.name}</td>
                      <td className="px-6 py-4">
                        {doc.link ? (
                          <a 
                            href={doc.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            {doc.link}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditDocumentClick(doc)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              
              {documents.filter(doc => !doc.groupId).map((doc, index) => (
                <tr 
                  key={doc.id} 
                  className="hover:bg-gray-50"
                  draggable
                  onDragStart={(e) => handleDragStart(e, { id: doc.id, type: 'document' })}
                  onDragOver={(e) => handleDragOver(e)}
                  onDragLeave={(e) => handleDragLeave(e)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <td className="px-6 py-4">{doc.name}</td>
                  <td className="px-6 py-4">
                    {doc.link ? (
                      <a 
                        href={doc.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        {doc.link}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditDocumentClick(doc)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
              
              {documents.length === 0 && groups.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    Aucun document trouvé. Cliquez sur "Ajouter un document" pour commencer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end space-x-2">
        <Button
          onClick={handleAddGroupClick}
          variant="outline"
          className="flex items-center"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Nouveau groupe
        </Button>
        <Button
          onClick={handleAddDocumentClick}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </div>
      
      <DocumentDialog
        isOpen={isDocumentDialogOpen}
        onOpenChange={setIsDocumentDialogOpen}
        onClose={() => setIsDocumentDialogOpen(false)}
        document={currentDocument}
        isEditing={isEditing}
        onChange={handleDocumentChange}
        onSave={handleSaveDocument}
      />
      
      <GroupDialog
        isOpen={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
        group={currentGroup}
        isEditing={isEditing}
        onChange={handleGroupChange}
        onSave={handleSaveGroup}
      />
    </div>
  );
};

export default Collaboration;

