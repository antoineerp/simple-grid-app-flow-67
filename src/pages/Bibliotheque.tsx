import React, { useState } from 'react';
import { Pencil, Trash, ChevronDown, Plus, FolderPlus, GripVertical } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface DocumentGroup {
  id: number;
  name: string;
  expanded: boolean;
  items: Document[];
}

interface Document {
  id: number;
  name: string;
  link: string | null;
  groupId?: number;
}

const Bibliotheque = () => {
  const { toast } = useToast();
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([
    { 
      id: 1, 
      name: 'Documents organisationnels', 
      expanded: false,
      items: []
    },
    { 
      id: 2, 
      name: 'Documents administratifs', 
      expanded: false,
      items: []
    }
  ]);
  
  const [documents, setDocuments] = useState<Document[]>([
    { id: 1, name: 'Organigramme', link: 'Voir le document' },
    { id: 2, name: 'Administration', link: 'Voir le document' },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document>({
    id: 0,
    name: '',
    link: null
  });
  const [currentGroup, setCurrentGroup] = useState<DocumentGroup>({
    id: 0,
    name: '',
    expanded: false,
    items: []
  });

  const toggleGroup = (id: number) => {
    setDocumentGroups(groups => 
      groups.map(group => 
        group.id === id ? { ...group, expanded: !group.expanded } : group
      )
    );
  };

  const handleEditDocument = (doc: Document) => {
    setCurrentDocument({ ...doc });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteDocument = (id: number) => {
    setDocuments(docs => docs.filter(doc => doc.id !== id));
    setDocumentGroups(groups => 
      groups.map(group => ({
        ...group,
        items: group.items.filter(item => item.id !== id)
      }))
    );
    toast({
      title: "Suppression",
      description: "Le document a été supprimé",
    });
  };

  const handleEditGroup = (group: DocumentGroup) => {
    setCurrentGroup({ ...group });
    setIsEditing(true);
    setIsGroupDialogOpen(true);
  };

  const handleDeleteGroup = (id: number) => {
    const groupToDelete = documentGroups.find(g => g.id === id);
    if (groupToDelete && groupToDelete.items.length > 0) {
      const docsToMove = [...groupToDelete.items];
      setDocuments(prev => [...prev, ...docsToMove]);
    }
    
    setDocumentGroups(groups => groups.filter(group => group.id !== id));
    toast({
      title: "Suppression",
      description: "Le groupe a été supprimé",
    });
  };

  const handleAddDocument = () => {
    const newId = Math.max(...documents.map(d => d.id), ...documentGroups.flatMap(g => g.items.map(d => d.id)), 0) + 1;
    setCurrentDocument({
      id: newId,
      name: '',
      link: null
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleAddGroup = () => {
    const newId = documentGroups.length > 0 
      ? Math.max(...documentGroups.map(g => g.id)) + 1 
      : 1;
    setCurrentGroup({
      id: newId,
      name: '',
      expanded: false,
      items: []
    });
    setIsEditing(false);
    setIsGroupDialogOpen(true);
  };

  const handleDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentDocument({
      ...currentDocument,
      [name]: value
    });
  };

  const handleGroupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentGroup({
      ...currentGroup,
      [name]: value
    });
  };

  const handleSaveDocument = () => {
    if (currentDocument.name.trim() === '') {
      toast({
        title: "Erreur",
        description: "Le nom du document est requis",
        variant: "destructive",
      });
      return;
    }

    if (isEditing) {
      if (currentDocument.groupId) {
        setDocumentGroups(groups => 
          groups.map(group => 
            group.id === currentDocument.groupId 
              ? {
                  ...group,
                  items: group.items.map(item => 
                    item.id === currentDocument.id ? currentDocument : item
                  )
                }
              : group
          )
        );
      } else {
        setDocuments(docs => 
          docs.map(doc => doc.id === currentDocument.id ? currentDocument : doc)
        );
      }
      toast({
        title: "Modification",
        description: "Le document a été modifié",
      });
    } else {
      setDocuments(docs => [...docs, currentDocument]);
      toast({
        title: "Ajout",
        description: "Le document a été ajouté",
      });
    }
    
    setIsDialogOpen(false);
  };

  const handleSaveGroup = () => {
    if (currentGroup.name.trim() === '') {
      toast({
        title: "Erreur",
        description: "Le nom du groupe est requis",
        variant: "destructive",
      });
      return;
    }

    if (isEditing) {
      setDocumentGroups(groups => 
        groups.map(group => group.id === currentGroup.id ? currentGroup : group)
      );
      toast({
        title: "Modification",
        description: "Le groupe a été modifié",
      });
    } else {
      setDocumentGroups(groups => [...groups, currentGroup]);
      toast({
        title: "Ajout",
        description: "Le groupe a été ajouté",
      });
    }
    
    setIsGroupDialogOpen(false);
  };

  const handleReorder = (startIndex: number, endIndex: number) => {
    setDocuments(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });

    toast({
      title: "Réorganisation",
      description: "L'ordre des documents a été mis à jour",
    });
  };

  const handleGroupReorder = (startIndex: number, endIndex: number) => {
    setDocumentGroups(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });

    toast({
      title: "Réorganisation",
      description: "L'ordre des groupes a été mis à jour",
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Bibliothèque</h1>
          <p className="text-gray-600">Gestion des documents administratifs</p>
        </div>
      </div>

      <div className="bg-white rounded-md shadow overflow-hidden mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-8 py-3 px-4"></TableHead>
              <TableHead className="py-3 px-4 text-app-blue font-semibold">Nom du document</TableHead>
              <TableHead className="py-3 px-4 text-app-blue font-semibold">Lien</TableHead>
              <TableHead className="py-3 px-4 text-app-blue font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody onReorder={handleGroupReorder}>
            {documentGroups.map((group) => (
              <React.Fragment key={group.id}>
                <TableRow className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleGroup(group.id)}>
                  <TableCell className="py-3 px-2 w-10">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    <ChevronDown className={`h-4 w-4 inline-block transition-transform ${group.expanded ? 'rotate-180' : ''}`} />
                  </TableCell>
                  <TableCell className="py-3 px-4 font-medium">{group.name}</TableCell>
                  <TableCell className="py-3 px-4"></TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <button 
                      className="text-gray-600 hover:text-app-blue mr-3"
                      onClick={(e) => {
                        e.stopPropagation(); // Empêcher l'expansion du groupe
                        handleEditGroup(group);
                      }}
                    >
                      <Pencil className="h-5 w-5 inline-block" />
                    </button>
                    <button 
                      className="text-gray-600 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation(); // Empêcher l'expansion du groupe
                        handleDeleteGroup(group.id);
                      }}
                    >
                      <Trash className="h-5 w-5 inline-block" />
                    </button>
                  </TableCell>
                </TableRow>
                {group.expanded && (
                  <TableBody onReorder={(start, end) => {
                    const newItems = [...group.items];
                    const [removed] = newItems.splice(start, 1);
                    newItems.splice(end, 0, removed);
                    setDocumentGroups(prev => 
                      prev.map(g => g.id === group.id ? {...g, items: newItems} : g)
                    );
                    toast({
                      title: "Réorganisation",
                      description: `L'ordre des documents dans le groupe ${group.name} a été mis à jour`,
                    });
                  }}>
                    {group.items.map(item => (
                      <TableRow key={item.id} className="border-b hover:bg-gray-50 bg-gray-50">
                        <TableCell className="py-3 px-2 w-10">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                        </TableCell>
                        <TableCell className="py-3 px-4"></TableCell>
                        <TableCell className="py-3 px-4 pl-8">{item.name}</TableCell>
                        <TableCell className="py-3 px-4">
                          {item.link && <a href="#" className="text-app-blue hover:underline">{item.link}</a>}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <button 
                            className="text-gray-600 hover:text-app-blue mr-3"
                            onClick={() => handleEditDocument({...item, groupId: group.id})}
                          >
                            <Pencil className="h-5 w-5 inline-block" />
                          </button>
                          <button 
                            className="text-gray-600 hover:text-red-500"
                            onClick={() => handleDeleteDocument(item.id)}
                          >
                            <Trash className="h-5 w-5 inline-block" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </React.Fragment>
            ))}
          </TableBody>
          <TableBody onReorder={handleReorder}>
            {documents.map((doc) => (
              <TableRow key={doc.id} className="border-b hover:bg-gray-50">
                <TableCell className="py-3 px-2 w-10">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </TableCell>
                <TableCell className="py-3 px-4"></TableCell>
                <TableCell className="py-3 px-4">{doc.name}</TableCell>
                <TableCell className="py-3 px-4">
                  {doc.link === 'Voir le document' ? (
                    <a href="#" className="text-app-blue hover:underline">
                      Voir le document
                    </a>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <button 
                    className="text-gray-600 hover:text-app-blue mr-3"
                    onClick={() => handleEditDocument(doc)}
                  >
                    <Pencil className="h-5 w-5 inline-block" />
                  </button>
                  <button 
                    className="text-gray-600 hover:text-red-500"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    <Trash className="h-5 w-5 inline-block" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end mt-4 space-x-3">
        <button 
          className="btn-outline flex items-center"
          onClick={handleAddGroup}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Nouveau groupe
        </button>
        <button 
          className="btn-primary flex items-center"
          onClick={handleAddDocument}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau document
        </button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier le document" : "Ajouter un document"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Modifiez les informations du document ci-dessous." 
                : "Remplissez les informations pour ajouter un nouveau document."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input
                id="name"
                name="name"
                className="col-span-3"
                value={currentDocument.name}
                onChange={handleDocumentInputChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link" className="text-right">
                Lien
              </Label>
              <Input
                id="link"
                name="link"
                className="col-span-3"
                value={currentDocument.link || ''}
                onChange={handleDocumentInputChange}
                placeholder="Laisser vide si aucun lien"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveDocument}>
              {isEditing ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier le groupe" : "Ajouter un groupe"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Modifiez les informations du groupe ci-dessous." 
                : "Remplissez les informations pour ajouter un nouveau groupe."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input
                id="name"
                name="name"
                className="col-span-3"
                value={currentGroup.name}
                onChange={handleGroupInputChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveGroup}>
              {isEditing ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bibliotheque;
