
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, ExternalLink, ChevronDown, ChevronUp, FolderPlus, Plus } from 'lucide-react';
import { useBibliotheque } from '@/hooks/useBibliotheque';

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

  useEffect(() => {
    // Initialiser la synchronisation si nécessaire
    if (!documents.length && isOnline) {
      syncWithServer();
    }
  }, [documents.length, isOnline]);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-600">Bibliothèque</h1>
        <p className="text-gray-600">Gestion des documents administratifs</p>
      </div>

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
                  <tr className="bg-gray-50 cursor-pointer" onClick={() => handleToggleGroup(group.id)}>
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
                          handleEditGroup(group);
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
                  {group.expanded && group.items && group.items.map((doc) => (
                    <tr key={doc.id} className="bg-white">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="pl-8">{doc.name}</div>
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
                            handleEditDocument(doc);
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
                </React.Fragment>
              ))}

              {/* Afficher les documents qui ne sont pas dans un groupe */}
              {documents.map((doc) => (
                <tr key={doc.id} className="bg-white">
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
                        handleEditDocument(doc);
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
          onClick={() => handleAddGroup()}
        >
          <FolderPlus className="h-4 w-4" /> Nouveau groupe
        </Button>
        <Button 
          className="flex items-center gap-1"
          onClick={() => handleAddDocument()}
        >
          <Plus className="h-4 w-4" /> Nouveau document
        </Button>
      </div>
    </div>
  );
};

export default Collaboration;
