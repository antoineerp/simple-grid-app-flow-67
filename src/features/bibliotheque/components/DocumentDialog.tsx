
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Document } from '@/types/bibliotheque';

interface DocumentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  document: Document;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}

export const DocumentDialog: React.FC<DocumentDialogProps> = ({
  isOpen,
  onOpenChange,
  onClose,
  document,
  isEditing,
  onChange,
  onSave
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le document" : "Nouveau document"}
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
              value={document.name}
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
              value={document.link}
              onChange={onChange}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Annuler</Button>
          </DialogClose>
          <Button onClick={onSave}>
            {isEditing ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
