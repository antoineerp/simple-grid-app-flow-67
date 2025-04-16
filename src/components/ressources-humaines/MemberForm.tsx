
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
} from "@/components/ui/dialog";

interface Membre {
  id: number;
  nom: string;
  prenom: string;
  fonction: string;
  initiales: string;
}

interface MemberFormProps {
  currentMembre: Membre;
  isEditing: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onCancel: () => void;
}

const MemberForm = ({ 
  currentMembre, 
  isEditing, 
  onInputChange, 
  onSave, 
  onCancel 
}: MemberFormProps) => {
  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nom" className="text-right">
            Nom
          </Label>
          <Input
            id="nom"
            name="nom"
            className="col-span-3"
            value={currentMembre.nom}
            onChange={onInputChange}
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="prenom" className="text-right">
            Prénom
          </Label>
          <Input
            id="prenom"
            name="prenom"
            className="col-span-3"
            value={currentMembre.prenom}
            onChange={onInputChange}
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="fonction" className="text-right">
            Fonction
          </Label>
          <Input
            id="fonction"
            name="fonction"
            className="col-span-3"
            value={currentMembre.fonction}
            onChange={onInputChange}
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="initiales" className="text-right">
            Initiales
          </Label>
          <Input
            id="initiales"
            name="initiales"
            className="col-span-3"
            value={currentMembre.initiales}
            onChange={onInputChange}
            placeholder="Laisser vide pour générer automatiquement"
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={onSave}>
          {isEditing ? "Mettre à jour" : "Ajouter"}
        </Button>
      </DialogFooter>
    </>
  );
};

export default MemberForm;
