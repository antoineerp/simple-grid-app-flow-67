
import React, { useState } from 'react';
import { Pencil, Trash, FileText, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Document {
  id: number;
  ordre: number;
  nom: string;
  lien: string | null;
}

const Pilotage = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([
    { id: 1, ordre: 1, nom: 'Charte institutionnelle', lien: 'Voir le document' },
    { id: 2, ordre: 2, nom: 'Objectifs stratégiques', lien: null },
    { id: 3, ordre: 3, nom: 'Objectifs opérationnels', lien: 'Voir le document' },
    { id: 4, ordre: 4, nom: 'Risques', lien: null },
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document>({
    id: 0,
    ordre: 0,
    nom: '',
    lien: null
  });

  // Ouvrir le dialogue pour ajouter un nouveau document
  const handleAddDocument = () => {
    // Trouver le dernier ordre + 1
    const nextOrdre = documents.length > 0 
      ? Math.max(...documents.map(doc => doc.ordre)) + 1 
      : 1;
    
    setCurrentDocument({
      id: 0,
      ordre: nextOrdre,
      nom: '',
      lien: null
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  // Ouvrir le dialogue pour modifier un document existant
  const handleEditDocument = (doc: Document) => {
    setCurrentDocument({ ...doc });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Supprimer un document
  const handleDeleteDocument = (id: number) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès",
    });
  };

  // Gérer les changements dans le formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentDocument({
      ...currentDocument,
      [name]: value
    });
  };

  // Sauvegarder le document (ajouter ou modifier)
  const handleSaveDocument = () => {
    if (currentDocument.nom.trim() === '') {
      toast({
        title: "Erreur",
        description: "Le nom du document est requis",
        variant: "destructive",
      });
      return;
    }

    if (isEditing) {
      // Mise à jour du document existant
      setDocuments(documents.map(doc => 
        doc.id === currentDocument.id ? currentDocument : doc
      ));
      toast({
        title: "Document mis à jour",
        description: "Le document a été mis à jour avec succès",
      });
    } else {
      // Ajout d'un nouveau document
      const newId = documents.length > 0 
        ? Math.max(...documents.map(doc => doc.id)) + 1 
        : 1;
      
      setDocuments([...documents, { ...currentDocument, id: newId }]);
      toast({
        title: "Document ajouté",
        description: "Le nouveau document a été ajouté avec succès",
      });
    }
    
    setIsDialogOpen(false);
  };

  // Handle row reordering with drag and drop
  const handleReorder = (startIndex: number, endIndex: number) => {
    const result = Array.from(documents);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    // Update ordre for all items
    const updatedDocuments = result.map((doc, index) => ({
      ...doc,
      ordre: index + 1
    }));
    
    setDocuments(updatedDocuments);
    
    toast({
      title: "Ordre mis à jour",
      description: "L'ordre des documents a été mis à jour avec succès",
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Pilotage</h1>
          <p className="text-gray-600">Documents de pilotage</p>
        </div>
        <FileText className="text-red-500 h-6 w-6" />
      </div>

      <div className="bg-white rounded-md shadow overflow-hidden mt-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-app-light-blue">
              <TableHead className="text-app-blue font-semibold">Ordre</TableHead>
              <TableHead className="text-app-blue font-semibold">Nom du document</TableHead>
              <TableHead className="text-app-blue font-semibold">Lien</TableHead>
              <TableHead className="text-app-blue font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody onReorder={handleReorder}>
            {documents
              .sort((a, b) => a.ordre - b.ordre)
              .map((doc) => (
                <TableRow key={doc.id} className="border-b hover:bg-gray-50">
                  <TableCell>{doc.ordre}</TableCell>
                  <TableCell>{doc.nom}</TableCell>
                  <TableCell>
                    {doc.lien ? (
                      <a href="#" className="text-app-blue hover:underline">
                        Voir le document
                      </a>
                    ) : (
                      <span className="text-gray-500">Aucun lien</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-600 hover:text-app-blue"
                      onClick={() => handleEditDocument(doc)}
                    >
                      <Pencil className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-600 hover:text-red-500"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end mt-4">
        <Button 
          className="bg-app-blue hover:bg-app-blue/90 text-white" 
          onClick={handleAddDocument}
        >
          <Plus className="h-4 w-4 mr-2" /> Ajouter un document
        </Button>
      </div>

      {/* Modal pour ajouter/modifier un document */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier le document" : "Ajouter un document"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ordre" className="text-right">
                Ordre
              </Label>
              <Input
                id="ordre"
                name="ordre"
                type="number"
                className="col-span-3"
                value={currentDocument.ordre}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">
                Nom
              </Label>
              <Input
                id="nom"
                name="nom"
                className="col-span-3"
                value={currentDocument.nom}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lien" className="text-right">
                Lien
              </Label>
              <Input
                id="lien"
                name="lien"
                className="col-span-3"
                value={currentDocument.lien || ''}
                onChange={handleInputChange}
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
    </div>
  );
};

export default Pilotage;
