
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Document } from '@/types/bibliotheque';

interface DocumentDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  document: Document | null;
  onSave: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditing: boolean;
}

export const DocumentDialog = ({
  isOpen,
  onClose,
  onOpenChange,
  document,
  onSave,
  onChange,
  isEditing,
}: DocumentDialogProps) => {
  // Handle both styles of dialog closing
  const handleOpenChange = (open: boolean) => {
    if (!open && onClose) {
      onClose();
    }
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le document' : 'Ajouter un document'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom
            </Label>
            <Input
              id="name"
              name="name"
              value={document?.name || ''}
              onChange={onChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="link" className="text-right">
              Lien
            </Label>
            <Input
              id="link"
              name="link"
              value={document?.link || ''}
              onChange={onChange}
              className="col-span-3"
              placeholder="URL ou texte du lien"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSave}>
            {isEditing ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentDialog;
