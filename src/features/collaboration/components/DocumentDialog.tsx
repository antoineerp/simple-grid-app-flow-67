
import React from 'react';
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
import { Document } from '@/types/collaboration';

interface DocumentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentDocument: Document;
  isEditing: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}

export const DocumentDialog: React.FC<DocumentDialogProps> = ({
  isOpen,
  onOpenChange,
  currentDocument,
  isEditing,
  onInputChange,
  onSave
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            <Label htmlFor="titre" className="text-right">
              Nom
            </Label>
            <Input
              id="titre"
              name="titre"
              className="col-span-3"
              value={currentDocument.titre || ''}
              onChange={onInputChange}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">
              Lien
            </Label>
            <Input
              id="url"
              name="url"
              className="col-span-3"
              value={currentDocument.url || ''}
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
