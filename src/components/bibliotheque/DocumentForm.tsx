
import React from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface DocumentFormProps {
  document: Document;
  groups?: DocumentGroup[]; // Made optional for backward compatibility
  onSave: (doc: Document) => void;
  onCancel: () => void;
  isEditing: boolean;
  onDelete?: (id: string) => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({
  document,
  groups = [], // Default to empty array
  onSave,
  onCancel,
  isEditing,
  onDelete
}) => {
  const [name, setName] = React.useState(document.name || '');
  const [link, setLink] = React.useState(document.link || '');
  const [groupId, setGroupId] = React.useState(document.groupId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...document,
      name,
      link,
      groupId: groupId || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nom du document</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="link">Lien</Label>
        <Input
          id="link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://"
        />
      </div>
      
      {groups && groups.length > 0 && (
        <div className="grid gap-2">
          <Label htmlFor="group">Groupe</Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un groupe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucun groupe</SelectItem>
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="flex justify-between">
        <div>
          {isEditing && onDelete && (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => onDelete(document.id)}
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
            {isEditing ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default DocumentForm;
