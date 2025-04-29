
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, ExternalLink, ChevronDown, ChevronUp, FolderPlus, Plus } from 'lucide-react';
import { useBibliotheque } from '@/hooks/useBibliotheque';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useDragAndDrop } from '@/components/gestion-documentaire/table/useDragAndDrop';
import SyncIndicator from '@/components/common/SyncIndicator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  document: Document | null;
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
  group: DocumentGroup | null;
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

const Collaboration = () => {
  const {
    documents,
    groups,
    isOnline,
    lastSynced,
    syncFailed,
    isSyncing,
    handleToggleGroup,
    handleEditDocument,
    handleDeleteDocument,
    handleEditGroup,
    handleDeleteGroup,
    handleAddGroup,
    handleAddDocument,
    syncWithServer,
  } = useBibliotheque();

  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Use the useDragAndDrop hook for drag and drop functionality - but with the proper document type
  const { 
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleGroupDrop
  } = useDragAndDrop(documents as any[], (sourceIndex, targetIndex, targetGroupId) => {
    // Handle reordering through the useBibliotheque hook
    console.log('Reordering:', sourceIndex, targetIndex, targetGroupId);
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

  // Handle edit document button click
  const handleEditDocumentClick = (doc: Document) => {
    setCurrentDocument(doc);
    setIsEditing(true);
    setIsDocumentDialogOpen(true);
  };

  // Handle add document button click
  const handleAddDocumentClick = () => {
    setCurrentDocument({ id: '', name: '', link: null });
    setIsEditing(false);
    setIsDocumentDialogOpen(true);
  };

  // Handle save document
  const handleSaveDocument = () => {
    if (currentDocument) {
      if (isEditing) {
        handleEditDocument(currentDocument);
      } else {
        handleAddDocument(currentDocument);
      }
      setIsDocumentDialogOpen(false);
    }
  };

  // Handle edit group button click
  const handleEditGroupClick = (group: DocumentGroup) => {
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
      expanded: false,
      items: []
    });
    setIsEditing(false);
    setIsGroupDialogOpen(true);
  };

  // Handle save group
  const handleSaveGroup = () => {
    if (currentGroup) {
      if (isEditing) {
        handleEditGroup(currentGroup);
      } else {
        // Fixed: Call handleAddGroup with the currentGroup
        handleAddGroup(currentGroup);
      }
      setIsGroupDialogOpen(false);
    }
  };

  // Create a wrapper function that converts Promise<boolean> to Promise<void>
  const handleSync = async (): Promise<void> => {
    try {
      await syncWithServer();
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  useEffect(() => {
    // Initialize synchronization if necessary
    if (!documents.length && isOnline) {
      syncWithServer();
    }
  }, [documents.length, isOnline, syncWithServer]);

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-600">Collaboration</h1>
      </div>

      {/* Only show sync indicator if there's an error */}
      {syncFailed && (
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
            <tbody className="divide-y divide-gray-200">
              {/* Afficher les groupes et leurs documents */}
              {groups.map((group) => (
                <React.Fragment key={group.id}>
                  <tr 
                    className="bg-gray-50 cursor-pointer" 
                    onClick={() => handleToggleGroup(group.id)}
                    draggable
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-dashed', 'border-2', 'border-primary');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
                    }}
                    onDrop={(e) => handleGroupDrop(e, group.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap" colSpan={2}>
                      <div className="flex items-center">
                        {group.expanded ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronUp className="h-4 w-4 mr-2" />
                        )}
                        <span className="font-semibold">{group.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditGroupClick(group);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                  {group.expanded && group.items && group.items.map((item) => (
                    <tr 
                      key={item.id} 
                      className="bg-white"
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id, group.id)}
                      onDragOver={(e) => handleDragOver(e)}
                      onDragLeave={(e) => handleDragLeave(e)}
                      onDrop={(e) => handleDrop(e, item.id, group.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="pl-8">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                            Voir le document <ExternalLink className="h-4 w-4 ml-1" />
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.preventDefault();
                            handleEditDocumentClick(item);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteDocument(item.id);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* Afficher les documents qui ne sont pas dans un groupe */}
              {documents.filter(doc => !doc.groupId).map((doc) => (
                <tr 
                  key={doc.id} 
                  className="bg-white"
                  draggable
                  onDragStart={(e) => handleDragStart(e, doc.id)}
                  onDragOver={(e) => handleDragOver(e)}
                  onDragLeave={(e) => handleDragLeave(e)}
                  onDrop={(e) => handleDrop(e, doc.id)}
                  onDragEnd={handleDragEnd}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.link && (
                      <a href={doc.link} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                        Voir le document <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleEditDocumentClick(doc);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteDocument(doc.id);
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button 
          variant="outline"
          className="flex items-center gap-1"
          onClick={handleAddGroupClick}
        >
          <FolderPlus className="h-4 w-4" /> Nouveau groupe
        </Button>
        <Button 
          className="flex items-center gap-1"
          onClick={handleAddDocumentClick}
        >
          <Plus className="h-4 w-4" /> Nouveau document
        </Button>
      </div>

      {/* Dialog components */}
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
