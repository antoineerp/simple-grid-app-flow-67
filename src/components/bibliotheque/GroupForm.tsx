
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentGroup } from '@/types/bibliotheque';
import { useAuth } from '@/hooks/useAuth';

interface GroupFormProps {
  group: DocumentGroup;
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
  const { getUserId } = useAuth();
  const userId = getUserId() || 'default';
  
  const [formData, setFormData] = React.useState<DocumentGroup>({
    ...group,
    expanded: group.expanded || false,
    items: group.items || [],
    userId: group.userId || userId
  });

  React.useEffect(() => {
    setFormData({
      ...group,
      expanded: group.expanded || false,
      items: group.items || [],
      userId: group.userId || userId
    });
  }, [group, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
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
          <Label htmlFor="name">Nom du groupe</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
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

export default GroupForm;
