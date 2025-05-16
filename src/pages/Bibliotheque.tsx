
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DocumentForm from '@/components/bibliotheque/DocumentForm';
import GroupForm from '@/components/bibliotheque/GroupForm';
import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { useAuth } from '@/hooks/useAuth';

const Bibliotheque: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup | null>(null);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  
  const { toast } = useToast();
  const { getUserId } = useAuth();
  const userId = getUserId() || 'default';
  
  useEffect(() => {
    // Données d'exemple pour la démonstration
    setGroups([
      { id: 'group1', name: 'Documents organisationnels', expanded: false, items: [], userId },
      { id: 'group2', name: 'Documents administratifs', expanded: false, items: [], userId },
    ]);
    
    setDocuments([
      { 
        id: 'doc1', 
        name: 'Organigramme', 
        link: 'https://example.com/organigramme', 
        userId,
        type: 'document' 
      },
      { 
        id: 'doc2', 
        name: 'Administration', 
        link: 'https://example.com/administration', 
        userId,
        type: 'document' 
      },
    ]);
  }, [userId]);
  
  // Gestion des documents
  const handleAddDocument = () => {
    setCurrentDocument({
      id: uuidv4(),
      name: '',
      type: 'document',
      userId,
    });
    setIsEditingDocument(false);
    setIsDocumentDialogOpen(true);
  };
  
  const handleEditDocument = (id: string) => {
    const document = documents.find(doc => doc.id === id);
    if (document) {
      setCurrentDocument(document);
      setIsEditingDocument(true);
      setIsDocumentDialogOpen(true);
    }
  };
  
  const handleDeleteDocument = (id: string) => {
    setDocuments(prevDocuments => prevDocuments.filter(doc => doc.id !== id));
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès",
    });
  };
  
  const handleSaveDocument = (document: Document) => {
    if (isEditingDocument) {
      setDocuments(prevDocuments => 
        prevDocuments.map(doc => doc.id === document.id ? document : doc)
      );
      toast({
        title: "Document modifié",
        description: "Le document a été modifié avec succès",
      });
    } else {
      setDocuments(prevDocuments => [...prevDocuments, document]);
      toast({
        title: "Document ajouté",
        description: "Le document a été ajouté avec succès",
      });
    }
    setIsDocumentDialogOpen(false);
  };
  
  // Gestion des groupes
  const handleAddGroup = () => {
    setCurrentGroup({
      id: uuidv4(),
      name: '',
      expanded: false,
      items: [],
      userId,
    });
    setIsEditingGroup(false);
    setIsGroupDialogOpen(true);
  };
  
  const handleEditGroup = (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group) {
      setCurrentGroup(group);
      setIsEditingGroup(true);
      setIsGroupDialogOpen(true);
    }
  };
  
  const handleDeleteGroup = (id: string) => {
    // Réassigner les documents du groupe à supprimer
    setDocuments(prevDocuments => 
      prevDocuments.map(doc => doc.groupId === id ? {...doc, groupId: undefined} : doc)
    );
    
    // Supprimer le groupe
    setGroups(prevGroups => prevGroups.filter(group => group.id !== id));
    
    toast({
      title: "Groupe supprimé",
      description: "Le groupe a été supprimé avec succès",
    });
  };
  
  const handleSaveGroup = (group: DocumentGroup) => {
    if (isEditingGroup) {
      setGroups(prevGroups => 
        prevGroups.map(g => g.id === group.id ? group : g)
      );
      toast({
        title: "Groupe modifié",
        description: "Le groupe a été modifié avec succès",
      });
    } else {
      setGroups(prevGroups => [...prevGroups, group]);
      toast({
        title: "Groupe ajouté",
        description: "Le groupe a été ajouté avec succès",
      });
    }
    setIsGroupDialogOpen(false);
  };
  
  const toggleGroup = (id: string) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === id ? {...group, expanded: !group.expanded} : group
      )
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-700">Bibliothèque</h1>
        <p className="text-gray-500 mb-6">Gestion des documents administratifs</p>
      </div>
      
      <div className="bg-white rounded-md shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du document</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lien</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groups.map(group => (
              <React.Fragment key={group.id}>
                <tr className="bg-gray-50 cursor-pointer hover:bg-gray-100" onClick={() => toggleGroup(group.id)}>
                  <td className="px-6 py-4">
                    <button className="focus:outline-none">
                      <span className="transform inline-block transition-all">
                        {group.expanded ? 
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg> :
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        }
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium">{group.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={(e) => { e.stopPropagation(); handleEditGroup(group.id); }} className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                {group.expanded && documents
                  .filter(doc => doc.groupId === group.id)
                  .map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4 whitespace-nowrap">{doc.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {doc.link && (
                          <a href={doc.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 flex items-center">
                            Voir le document <ExternalLink className="ml-1 w-4 h-4" />
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleEditDocument(doc.id)} className="text-blue-600 hover:text-blue-900 mr-3">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteDocument(doc.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
            
            {documents
              .filter(doc => !doc.groupId)
              .map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 whitespace-nowrap">{doc.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.link && (
                      <a href={doc.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 flex items-center">
                        Voir le document <ExternalLink className="ml-1 w-4 h-4" />
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditDocument(doc.id)} className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteDocument(doc.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-end mt-6 space-x-3">
        <Button variant="outline" onClick={handleAddGroup}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouveau groupe
        </Button>
        <Button onClick={handleAddDocument}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouveau document
        </Button>
      </div>
      
      {/* Dialog pour ajouter/éditer un document */}
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingDocument ? 'Modifier le document' : 'Ajouter un document'}</DialogTitle>
          </DialogHeader>
          {currentDocument && (
            <DocumentForm
              document={currentDocument}
              isEditing={isEditingDocument}
              groups={groups}
              onSave={handleSaveDocument}
              onCancel={() => setIsDocumentDialogOpen(false)}
              onDelete={isEditingDocument ? handleDeleteDocument : undefined}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog pour ajouter/éditer un groupe */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingGroup ? 'Modifier le groupe' : 'Ajouter un groupe'}</DialogTitle>
          </DialogHeader>
          {currentGroup && (
            <GroupForm
              group={currentGroup}
              isEditing={isEditingGroup}
              onSave={handleSaveGroup}
              onCancel={() => setIsGroupDialogOpen(false)}
              onDelete={isEditingGroup ? handleDeleteGroup : undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bibliotheque;
