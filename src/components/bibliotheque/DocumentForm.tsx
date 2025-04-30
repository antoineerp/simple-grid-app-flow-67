
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface DocumentFormProps {
  document: Document | null;
  isEditing: boolean;
  groups: DocumentGroup[];
  onSave: (document: Document) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({
  document,
  isEditing,
  groups,
  onSave,
  onCancel,
  onDelete
}) => {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (document) {
      setName(document.name || '');
      setLink(document.link || '');
      setGroupId(document.groupId);
    } else {
      setName('');
      setLink('');
      setGroupId(undefined);
    }
  }, [document]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      id: document?.id || `doc-${Date.now()}`,
      name,
      link: link || undefined,
      groupId: groupId || undefined
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du document</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du document"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="link">Lien (optionnel)</Label>
          <Input
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="group">Groupe (optionnel)</Label>
          <Select
            value={groupId}
            onValueChange={(value) => setGroupId(value !== "none" ? value : undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un groupe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun groupe</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              Cette action ne peut pas être annulée. Le document sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (document && onDelete) onDelete(document.id);
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

export default DocumentForm;
