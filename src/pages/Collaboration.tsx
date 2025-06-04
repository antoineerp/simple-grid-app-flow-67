
import React, { useState } from 'react';
import { Plus, FolderPlus, RotateCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollaboration } from '@/hooks/useCollaboration';
import DocumentDialog from '@/components/pilotage/DocumentDialog';
import DocumentGroupDialog from '@/components/gestion-documentaire/DocumentGroupDialog';
import FileLink from '@/components/gestion-documentaire/table/FileLink';
import { Document, DocumentGroup } from '@/types/collaboration';

const Collaboration = () => {
  const {
    documents,
    groups,
    isDialogOpen,
    isGroupDialogOpen,
    isEditing,
    currentDocument,
    currentGroup,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed,
    setIsDialogOpen,
    setIsGroupDialogOpen,
    setIsEditing,
    setCurrentDocument,
    setCurrentGroup,
    handleAddDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleToggleGroup,
    handleSyncDocuments
  } = useCollaboration();

  const handleEdit = (document: Document) => {
    setCurrentDocument(document);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleEditGroup = (group: DocumentGroup) => {
    setCurrentGroup(group);
    setIsEditing(true);
    setIsGroupDialogOpen(true);
  };

  const handleLinkChange = (documentId: string, newLink: string) => {
    const docToUpdate = documents.find(d => d.id === documentId);
    if (docToUpdate) {
      handleUpdateDocument({
        ...docToUpdate,
        link: newLink
      });
    } else {
      // Chercher dans les groupes
      for (const group of groups) {
        const docInGroup = group.items.find(item => item.id === documentId);
        if (docInGroup) {
          handleUpdateDocument({
            ...docInGroup,
            link: newLink
          });
          break;
        }
      }
    }
  };

  const formatLastSynced = (date: Date | null) => {
    if (!date) return 'Jamais';
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const onToggleGroup = (groupId: string) => {
    handleToggleGroup(groupId);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Collaboration</h1>
          <p className="text-gray-600 mt-2">Gérez les documents partagés de l'équipe</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Dernière sync: {formatLastSynced(lastSynced)}</span>
          </div>
          
          <Button
            onClick={handleSyncDocuments}
            disabled={isSyncing}
            variant="outline"
            size="sm"
            className={syncFailed ? 'border-red-300 text-red-600' : ''}
          >
            <RotateCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisation...' : syncFailed ? 'Réessayer' : 'Synchroniser'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Documents de collaboration</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setCurrentGroup({ id: '', name: '', expanded: false, items: [] });
                setIsEditing(false);
                setIsGroupDialogOpen(true);
              }}
              variant="outline"
              size="sm"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Nouveau groupe
            </Button>
            <Button
              onClick={() => {
                setCurrentDocument({ id: '', name: '', link: '' });
                setIsEditing(false);
                setIsDialogOpen(true);
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-md shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Nom du document</TableHead>
                  <TableHead className="w-1/2">Lien</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <React.Fragment key={group.id}>
                    <TableRow 
                      className="bg-gray-50 font-medium cursor-pointer hover:bg-gray-100"
                      onClick={() => onToggleGroup(group.id)}
                    >
                      <TableCell colSpan={2} className="py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-600">{group.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {group.items.length} document(s)
                            </span>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditGroup(group);
                              }}
                              variant="ghost"
                              size="sm"
                            >
                              Modifier
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGroup(group.id);
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    {group.expanded && group.items.map((document) => (
                      <TableRow key={document.id} className="border-l-4 border-gray-200">
                        <TableCell className="pl-8">
                          <div className="flex items-center justify-between">
                            <span>{document.name}</span>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleEdit(document)}
                                variant="ghost"
                                size="sm"
                              >
                                Modifier
                              </Button>
                              <Button
                                onClick={() => handleDeleteDocument(document.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="pl-8">
                          <FileLink 
                            filePath={document.link || ''} 
                            onPathChange={(newPath) => handleLinkChange(document.id, newPath)}
                            editable={true}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
                
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center justify-between">
                        <span>{document.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleEdit(document)}
                            variant="ghost"
                            size="sm"
                          >
                            Modifier
                          </Button>
                          <Button
                            onClick={() => handleDeleteDocument(document.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <FileLink 
                        filePath={document.link || ''} 
                        onPathChange={(newPath) => handleLinkChange(document.id, newPath)}
                        editable={true}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DocumentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        document={currentDocument}
        onSave={isEditing ? handleUpdateDocument : handleAddDocument}
        isEditing={isEditing}
      />

      <DocumentGroupDialog
        open={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
        group={currentGroup}
        onSave={isEditing ? handleUpdateGroup : handleAddGroup}
        isEditing={isEditing}
      />
    </div>
  );
};

export default Collaboration;
