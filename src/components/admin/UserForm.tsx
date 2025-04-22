
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createUser } from '@/services/users/createUserService';
import { connectAsUser } from '@/services';

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
  onUserConnect?: (identifiant: string) => void;
}

const UserForm = ({ onClose, onSuccess, onUserConnect }: UserFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = React.useState<UserFormData>({
    nom: '',
    prenom: '',
    email: '',
    role: 'utilisateur',
    mot_de_passe: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [connectAfterCreate, setConnectAfterCreate] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createUser(formData);
      console.log("Résultat de la création:", result);
      
      toast({
        title: "Utilisateur créé",
        description: "L'utilisateur a été créé avec succès.",
      });
      
      // Si l'option de connexion est activée, se connecter avec le nouvel utilisateur
      if (connectAfterCreate && result.identifiant_technique) {
        try {
          const connectSuccess = await connectAsUser(result.identifiant_technique);
          
          if (connectSuccess) {
            toast({
              title: "Connexion réussie",
              description: `Vous êtes maintenant connecté en tant que ${result.identifiant_technique}`,
            });
            
            if (onUserConnect) {
              onUserConnect(result.identifiant_technique);
            }
          }
        } catch (connectError) {
          console.error("Erreur lors de la connexion avec le nouvel utilisateur:", connectError);
          toast({
            title: "Erreur de connexion",
            description: "L'utilisateur a été créé mais la connexion automatique a échoué.",
            variant: "destructive",
          });
        }
      }
      
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

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="connect" className="text-right text-sm">Options</label>
            <div className="col-span-3 flex items-center space-x-2">
              <input
                type="checkbox"
                id="connect"
                checked={connectAfterCreate}
                onChange={() => setConnectAfterCreate(!connectAfterCreate)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="connect" className="text-sm text-gray-700">
                Se connecter automatiquement après la création
              </label>
            </div>
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
