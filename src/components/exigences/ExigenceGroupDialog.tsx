
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ExigenceGroup } from '@/types/exigences';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

interface ExigenceGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  group: ExigenceGroup | null;
  onSave: (group: ExigenceGroup) => void;
}

export const ExigenceGroupDialog = ({ isOpen, onClose, group, onSave }: ExigenceGroupDialogProps) => {
  const [name, setName] = React.useState(group?.name || '');
  const currentUserId = getDatabaseConnectionCurrentUser() || 'default';

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
    onSave(updatedGroup);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
