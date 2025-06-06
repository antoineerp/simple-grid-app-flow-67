
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
import { DocumentGroup } from '@/types/documents';

interface DocumentGroupDialogProps {
  group: DocumentGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (group: DocumentGroup, isEditing: boolean) => void;
  isEditing: boolean;
}

const DocumentGroupDialog = ({
  group,
  open,
  onOpenChange,
  onSave,
  isEditing
}: DocumentGroupDialogProps) => {
  const [name, setName] = React.useState(group?.name || '');

  React.useEffect(() => {
    if (group) {
      setName(group.name);
    } else {
      setName('');
    }
  }, [group]);

  const handleSave = () => {
    const updatedGroup: DocumentGroup = {
      id: group?.id || Math.random().toString(36).substr(2, 9),
      name,
      expanded: group?.expanded || false,
      items: group?.items || []
    };
    onSave(updatedGroup, isEditing);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentGroupDialog;
