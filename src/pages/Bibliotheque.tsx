
import React, { useState } from 'react';
import { Pencil, Trash, ChevronDown, Plus, FolderPlus } from 'lucide-react';
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

  // Fonction pour éditer un document
  const handleEditDocument = (doc: Document) => {
    setCurrentDocument({ ...doc });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Fonction pour supprimer un document
  const handleDeleteDocument = (id: number) => {
    setDocuments(docs => docs.filter(doc => doc.id !== id));
    // Aussi supprimer des groupes si nécessaire
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

  // Fonction pour éditer un groupe
  const handleEditGroup = (group: DocumentGroup) => {
    setCurrentGroup({ ...group });
    setIsEditing(true);
    setIsGroupDialogOpen(true);
  };

  // Fonction pour supprimer un groupe
  const handleDeleteGroup = (id: number) => {
    // Déplacer tous les documents du groupe vers la liste principale
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

  // Fonction pour ajouter un nouveau document
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

  // Fonction pour ajouter un nouveau groupe
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

  // Handler pour les changements dans le formulaire de document
  const handleDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentDocument({
      ...currentDocument,
      [name]: value
    });
  };

  // Handler pour les changements dans le formulaire de groupe
  const handleGroupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentGroup({
      ...currentGroup,
      [name]: value
    });
  };

  // Fonction pour sauvegarder un document
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
      // Mise à jour d'un document existant
      if (currentDocument.groupId) {
        // Le document est dans un groupe
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
        // Le document est dans la liste principale
        setDocuments(docs => 
          docs.map(doc => doc.id === currentDocument.id ? currentDocument : doc)
        );
      }
      toast({
        title: "Modification",
        description: "Le document a été modifié",
      });
    } else {
      // Ajout d'un nouveau document
      setDocuments(docs => [...docs, currentDocument]);
      toast({
        title: "Ajout",
        description: "Le document a été ajouté",
      });
    }
    
    setIsDialogOpen(false);
  };

  // Fonction pour sauvegarder un groupe
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
      // Mise à jour d'un groupe existant
      setDocumentGroups(groups => 
        groups.map(group => group.id === currentGroup.id ? currentGroup : group)
      );
      toast({
        title: "Modification",
        description: "Le groupe a été modifié",
      });
    } else {
      // Ajout d'un nouveau groupe
      setDocumentGroups(groups => [...groups, currentGroup]);
      toast({
        title: "Ajout",
        description: "Le groupe a été ajouté",
      });
    }
    
    setIsGroupDialogOpen(false);
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
        <table className="w-full">
          <thead>
            <tr className="bg-app-light-blue text-left">
              <th className="w-8 py-3 px-4"></th>
              <th className="py-3 px-4 text-app-blue font-semibold">Nom du document</th>
              <th className="py-3 px-4 text-app-blue font-semibold">Lien</th>
              <th className="py-3 px-4 text-app-blue font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documentGroups.map((group) => (
              <React.Fragment key={group.id}>
                <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleGroup(group.id)}>
                  <td className="py-3 px-4 text-center">
                    <ChevronDown className={`h-4 w-4 inline-block transition-transform ${group.expanded ? 'rotate-180' : ''}`} />
                  </td>
                  <td className="py-3 px-4 font-medium">{group.name}</td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right">
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
                  </td>
                </tr>
                {group.expanded && group.items.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 bg-gray-50">
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4 pl-8">{item.name}</td>
                    <td className="py-3 px-4">
                      {item.link && <a href="#" className="text-app-blue hover:underline">{item.link}</a>}
                    </td>
                    <td className="py-3 px-4 text-right">
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
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4">{doc.name}</td>
                <td className="py-3 px-4">
                  {doc.link === 'Voir le document' ? (
                    <a href="#" className="text-app-blue hover:underline">
                      Voir le document
                    </a>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {/* Modal pour ajouter/modifier un document */}
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

      {/* Modal pour ajouter/modifier un groupe */}
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
