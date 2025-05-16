
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useUserForm } from '@/hooks/useUserForm';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
  onUserConnect?: (identifiant: string) => void;
}

const CreateUserDialog = ({ open, onClose, onUserCreated, onUserConnect }: CreateUserDialogProps) => {
  const {
    formData,
    isSubmitting,
    connectAfterCreate,
    formError,
    fieldErrors,
    setConnectAfterCreate,
    handleSubmit,
    handleChange
  } = useUserForm({ 
    onClose, 
    onSuccess: onUserCreated,
    onUserConnect
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm">
              {formError}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                className={fieldErrors.prenom ? "border-red-500" : ""}
              />
              {fieldErrors.prenom && (
                <p className="text-xs text-red-500">{fieldErrors.prenom}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className={fieldErrors.nom ? "border-red-500" : ""}
              />
              {fieldErrors.nom && (
                <p className="text-xs text-red-500">{fieldErrors.nom}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={fieldErrors.email ? "border-red-500" : ""}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-500">{fieldErrors.email}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select 
              name="role" 
              value={formData.role} 
              onValueChange={(value) => handleChange({ target: { name: 'role', value } } as React.ChangeEvent<HTMLSelectElement>)}
            >
              <SelectTrigger className={fieldErrors.role ? "border-red-500" : ""}>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utilisateur">Utilisateur</SelectItem>
                <SelectItem value="gestionnaire">Gestionnaire</SelectItem>
                <SelectItem value="administrateur">Administrateur</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.role && (
              <p className="text-xs text-red-500">{fieldErrors.role}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mot_de_passe">Mot de passe</Label>
            <Input
              id="mot_de_passe"
              name="mot_de_passe"
              type="password"
              value={formData.mot_de_passe}
              onChange={handleChange}
              className={fieldErrors.mot_de_passe ? "border-red-500" : ""}
            />
            {fieldErrors.mot_de_passe && (
              <p className="text-xs text-red-500">{fieldErrors.mot_de_passe}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="connect-after-create"
              checked={connectAfterCreate}
              onCheckedChange={(checked) => setConnectAfterCreate(!!checked)}
            />
            <Label htmlFor="connect-after-create" className="cursor-pointer">
              Se connecter en tant que cet utilisateur après la création
            </Label>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer l'utilisateur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
