
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createUser } from '@/services/users/createUserService';

interface UserFormData {
  nom: string;
  prenom: string;
  email: string;
  role: string;
  mot_de_passe: string;
}

interface UserFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const UserForm = ({ onClose, onSuccess }: UserFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = React.useState<UserFormData>({
    nom: '',
    prenom: '',
    email: '',
    role: 'utilisateur',
    mot_de_passe: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createUser(formData);
      toast({
        title: "Utilisateur créé",
        description: "L'utilisateur a été créé avec succès.",
      });
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
        <DialogDescription>
          Remplissez les informations pour créer un nouvel utilisateur.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="nom" className="text-right text-sm">Nom</label>
            <Input
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="prenom" className="text-right text-sm">Prénom</label>
            <Input
              id="prenom"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="email" className="text-right text-sm">Email</label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="mot_de_passe" className="text-right text-sm">Mot de passe</label>
            <Input
              id="mot_de_passe"
              name="mot_de_passe"
              type="password"
              value={formData.mot_de_passe}
              onChange={handleChange}
              className="col-span-3"
              required
              minLength={6}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="role" className="text-right text-sm">Rôle</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="utilisateur">Utilisateur</option>
              <option value="gestionnaire">Gestionnaire</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
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
  );
};

export default UserForm;
