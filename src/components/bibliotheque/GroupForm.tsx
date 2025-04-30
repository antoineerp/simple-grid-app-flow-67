
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentGroup } from '@/types/bibliotheque';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface GroupFormProps {
  group: DocumentGroup | null;
  isEditing: boolean;
  onSave: (group: DocumentGroup) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

const GroupForm: React.FC<GroupFormProps> = ({
  group,
  isEditing,
  onSave,
  onCancel,
  onDelete
}) => {
  const [name, setName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name || '');
    } else {
      setName('');
    }
  }, [group]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      id: group?.id || `group-${Date.now()}`,
      name,
      expanded: group?.expanded || false,
      items: group?.items || []
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du groupe</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du groupe"
            required
          />
        </div>
        
        <div className="flex justify-between pt-2">
          <div>
            {isEditing && onDelete && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
              >
                Supprimer
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit">
              {isEditing ? "Mettre à jour" : "Ajouter"}
            </Button>
          </div>
        </div>
      </form>
      
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Le groupe sera définitivement supprimé.
              Les documents contenus dans ce groupe ne seront pas supprimés, mais ils ne seront plus associés à un groupe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (group && onDelete) onDelete(group.id);
                setShowDeleteConfirm(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GroupForm;
