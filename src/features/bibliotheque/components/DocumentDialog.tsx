
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Document } from '@/types/bibliotheque';

interface DocumentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  document: Document | null;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}

export const DocumentDialog = ({
  isOpen,
  onOpenChange,
  document,
  isEditing,
  onChange,
  onSave,
  onClose
}: DocumentDialogProps) => {
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
            <label htmlFor="name" className="text-right">
              Nom
            </label>
            <Input
              id="name"
              name="name"
              value={document?.name || ''}
              onChange={onChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="link" className="text-right">
              Lien
            </label>
            <Input
              id="link"
              name="link"
              value={document?.link || ''}
              onChange={onChange}
              className="col-span-3"
              placeholder="https://..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" onClick={onSave}>
            {isEditing ? "Modifier" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
