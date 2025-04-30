
import React, { useState, useEffect } from 'react';
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
import { ExigenceGroup } from '@/types/exigences';

interface ExigenceGroupDialogProps {
  group: ExigenceGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (group: ExigenceGroup, isEditing: boolean) => void;
  isEditing: boolean;
}

export const ExigenceGroupDialog = ({
  group,
  open,
  onOpenChange,
  onSave,
  isEditing
}: ExigenceGroupDialogProps) => {
  const [name, setName] = useState(group?.name || '');
  const [formError, setFormError] = useState<string | null>(null);

  // Réinitialiser le formulaire quand le groupe change ou quand le dialogue s'ouvre/se ferme
  useEffect(() => {
    if (group) {
      setName(group.name);
      setFormError(null);
    } else {
      setName('');
      setFormError(null);
    }
  }, [group, open]);

  const handleSave = () => {
    // Validation
    if (!name || name.trim() === '') {
      setFormError("Le nom du groupe est obligatoire");
      return;
    }

    setFormError(null);

    // Créer un nouvel identifiant si c'est un nouveau groupe
    const groupId = group?.id || `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const updatedGroup: ExigenceGroup = {
      id: groupId,
      name: name.trim(),
      expanded: group?.expanded || true,
      items: group?.items || []
    };

    onSave(updatedGroup, isEditing);
    
    // Émettre un événement pour notifier que les données ont changé
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync-data-changed', { 
        detail: { tableName: 'exigences_groups', timestamp: new Date().toISOString() }
      }));
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
              aria-invalid={formError ? "true" : "false"}
            />
          </div>
          
          {formError && (
            <div className="text-red-500 text-sm mt-1 col-span-4 text-right">{formError}</div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {isEditing ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExigenceGroupDialog;
