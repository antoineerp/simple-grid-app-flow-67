
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ExigenceGroup } from '@/types/exigences';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

interface ExigenceGroupDialogProps {
  isOpen: boolean;
  open?: boolean; // Added for compatibility
  onClose: () => void;
  onOpenChange?: (open: boolean) => void; // Added for compatibility 
  group: ExigenceGroup | null;
  onSave: (group: ExigenceGroup, isEditing: boolean) => void;
}

export const ExigenceGroupDialog = ({ 
  isOpen, 
  open, 
  onClose, 
  onOpenChange,
  group, 
  onSave 
}: ExigenceGroupDialogProps) => {
  const [name, setName] = React.useState(group?.name || '');
  const currentUserId = getDatabaseConnectionCurrentUser() || 'default';
  
  // Support both isOpen and open props
  const dialogOpen = isOpen !== undefined ? isOpen : open;
  
  // Support both onClose and onOpenChange props
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      if (onClose) onClose();
      if (onOpenChange) onOpenChange(false);
    }
  };

  React.useEffect(() => {
    if (group) {
      setName(group.name);
    } else {
      setName('');
    }
  }, [group]);

  const handleSave = () => {
    const updatedGroup: ExigenceGroup = {
      id: group?.id || crypto.randomUUID(),
      name,
      expanded: group?.expanded || false,
      items: group?.items || [],
      userId: group?.userId || currentUserId
    };
    onSave(updatedGroup, !!group);
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{group ? 'Modifier le groupe' : 'Ajouter un groupe'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nom</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            {group ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExigenceGroupDialog;
