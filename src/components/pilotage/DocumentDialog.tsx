
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PilotageDocument {
  id: number;
  ordre: number;
  nom: string;
  lien: string | null;
}

interface DocumentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentDocument: PilotageDocument;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  isEditing: boolean;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  isOpen,
  onOpenChange,
  currentDocument,
  onInputChange,
  onSave,
  isEditing
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              onChange={onInputChange}
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
              onChange={onInputChange}
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
              onChange={onInputChange}
              placeholder="Laisser vide si aucun lien"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={onSave}>
            {isEditing ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentDialog;
