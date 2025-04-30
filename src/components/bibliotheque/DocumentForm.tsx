
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Document, DocumentGroup } from '@/types/bibliotheque';

interface DocumentFormProps {
  document: Document;
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
  const [formData, setFormData] = React.useState<Document>(document);

  React.useEffect(() => {
    setFormData(document);
  }, [document]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGroupChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      groupId: value === "none" ? undefined : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du document</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="link">Lien du document</Label>
          <Input
            id="link"
            name="link"
            value={formData.link || ""}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="group">Groupe</Label>
          <Select 
            value={formData.groupId || "none"}
            onValueChange={handleGroupChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un groupe" />
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

        <div className="flex justify-between pt-4">
          <div>
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(formData.id)}
              >
                Supprimer
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit">
              {isEditing ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default DocumentForm;
