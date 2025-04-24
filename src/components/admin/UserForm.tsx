import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createUser } from '@/services/users/createUserService';
import { connectAsUser } from '@/services';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Info } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminUsers';

interface UserFormData {
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'user';
  mot_de_passe: string;
}

interface UserFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  onUserConnect?: (identifiant: string) => void;
}

const UserForm = ({ onClose, onSuccess, onUserConnect }: UserFormProps) => {
  const { toast } = useToast();
  const { utilisateurs, loading } = useAdminUsers();
  const [formData, setFormData] = useState<UserFormData>({
    nom: '',
    prenom: '',
    email: '',
    role: 'user',
    mot_de_passe: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectAfterCreate, setConnectAfterCreate] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [hasManager, setHasManager] = useState(false);

  useEffect(() => {
    if (utilisateurs.some(user => user.role === 'gestionnaire')) {
      setHasManager(true);
    }
  }, [utilisateurs]);

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    let isValid = true;
    
    if (!formData.nom.trim()) {
      errors.nom = "Le nom est requis";
      isValid = false;
    }
    
    if (!formData.prenom.trim()) {
      errors.prenom = "Le prénom est requis";
      isValid = false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Format d'email invalide";
      isValid = false;
    }
    
    if (!formData.mot_de_passe) {
      errors.mot_de_passe = "Le mot de passe est requis";
      isValid = false;
    } else if (formData.mot_de_passe.length < 6) {
      errors.mot_de_passe = "Le mot de passe doit contenir au moins 6 caractères";
      isValid = false;
    }
    
    if (formData.role === 'gestionnaire' && hasManager) {
      errors.role = "Un gestionnaire existe déjà. Un seul compte gestionnaire est autorisé.";
      isValid = false;
    }
    
    setFieldErrors(errors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      console.log("Submitted user data:", formData);
      const result = await createUser(formData);
      console.log("User creation result:", result);
      
      toast({
        title: "Utilisateur créé",
        description: "L'utilisateur a été créé avec succès.",
      });
      
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
      console.error("Erreur complète lors de la création de l'utilisateur:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Une erreur est survenue lors de la création de l'utilisateur";
      
      setFormError(errorMessage);
      
      if (errorMessage.includes("email existe déjà")) {
        setFieldErrors(prev => ({ ...prev, email: "Cet email est déjà utilisé" }));
      } else if (errorMessage.includes("Un seul compte gestionnaire")) {
        setFieldErrors(prev => ({ ...prev, role: "Un gestionnaire existe déjà" }));
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
        <DialogDescription>
          Remplissez les informations pour créer un nouvel utilisateur.
        </DialogDescription>
      </DialogHeader>

      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            {formError}
          </AlertDescription>
        </Alert>
      )}

      {hasManager && (
        <Alert className="mb-4">
          <Info className="h-4 w-4 mr-2" />
          <AlertDescription>
            Un gestionnaire existe déjà. Un seul compte gestionnaire est autorisé dans le système.
            Les nouveaux utilisateurs hériteront automatiquement des données du gestionnaire.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="nom" className="text-right text-sm">Nom</label>
            <div className="col-span-3 space-y-1">
              <Input
                id="nom"
                name="nom"
                placeholder=""
                value={formData.nom}
                onChange={handleChange}
                className={`${fieldErrors.nom ? 'border-red-500' : ''}`}
                required
              />
              {fieldErrors.nom && (
                <p className="text-xs text-red-500">{fieldErrors.nom}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="prenom" className="text-right text-sm">Prénom</label>
            <div className="col-span-3 space-y-1">
              <Input
                id="prenom"
                name="prenom"
                placeholder=""
                value={formData.prenom}
                onChange={handleChange}
                className={`${fieldErrors.prenom ? 'border-red-500' : ''}`}
                required
              />
              {fieldErrors.prenom && (
                <p className="text-xs text-red-500">{fieldErrors.prenom}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="email" className="text-right text-sm">Email</label>
            <div className="col-span-3 space-y-1">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder=""
                value={formData.email}
                onChange={handleChange}
                className={`${fieldErrors.email ? 'border-red-500' : ''}`}
                required
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="mot_de_passe" className="text-right text-sm">Mot de passe</label>
            <div className="col-span-3 space-y-1">
              <Input
                id="mot_de_passe"
                name="mot_de_passe"
                type="password"
                placeholder=""
                value={formData.mot_de_passe}
                onChange={handleChange}
                className={`${fieldErrors.mot_de_passe ? 'border-red-500' : ''}`}
                required
                minLength={6}
              />
              {fieldErrors.mot_de_passe && (
                <p className="text-xs text-red-500">{fieldErrors.mot_de_passe}</p>
              )}
              <p className="text-xs text-gray-500">Minimum 6 caractères</p>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="role" className="text-right text-sm">Rôle</label>
            <div className="col-span-3 space-y-1">
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border ${fieldErrors.role ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                required
              >
                <option value="user">Utilisateur</option>
                <option value="gestionnaire" disabled={hasManager}>Gestionnaire {hasManager ? '(Limite atteinte)' : ''}</option>
                <option value="admin">Administrateur</option>
              </select>
              {fieldErrors.role && (
                <p className="text-xs text-red-500">{fieldErrors.role}</p>
              )}
            </div>
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
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Créer l'utilisateur"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default UserForm;
