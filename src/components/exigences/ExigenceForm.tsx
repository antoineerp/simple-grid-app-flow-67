
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Exigence } from '@/types/exigences';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

interface ExigenceFormProps {
  exigence: Exigence;
  onSave: (exigence: Exigence) => void;
  onCancel: () => void;
}

export const ExigenceForm: React.FC<ExigenceFormProps> = ({ exigence, onSave, onCancel }) => {
  const currentUserId = getDatabaseConnectionCurrentUser() || 'default';
  const [formData, setFormData] = useState<Exigence>({
    ...exigence,
    // Assurez-vous que l'userId est défini
    userId: exigence.userId || currentUserId
  });

  useEffect(() => {
    setFormData({
      ...exigence,
      userId: exigence.userId || currentUserId
    });
  }, [exigence, currentUserId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExclusionChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, exclusion: checked }));
  };

  const handleAtteinteChange = (value: 'NC' | 'PC' | 'C' | null) => {
    setFormData(prev => ({ ...prev, atteinte: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="nom">Nom de l'exigence</Label>
        <Input id="nom" name="nom" value={formData.nom} onChange={handleChange} required />
      </div>

      <div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="exclusion" 
            checked={formData.exclusion} 
            onCheckedChange={handleExclusionChange} 
          />
          <Label htmlFor="exclusion">Exclure cette exigence</Label>
        </div>
      </div>

      <div>
        <Label>Niveau d'atteinte</Label>
        <RadioGroup 
          value={formData.atteinte || ''} 
          onValueChange={v => handleAtteinteChange(v as 'NC' | 'PC' | 'C' | null)}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="NC" id="NC" />
            <Label htmlFor="NC">Non Conforme</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="PC" id="PC" />
            <Label htmlFor="PC">Partiellement Conforme</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="C" id="C" />
            <Label htmlFor="C">Conforme</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Sauvegarder
        </Button>
      </div>
    </form>
  );
};

export default ExigenceForm;
