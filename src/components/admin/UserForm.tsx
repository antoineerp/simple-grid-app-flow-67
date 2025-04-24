import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createUser } from '@/services/users/createUserService';
import { connectAsUser } from '@/services';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info, Loader2 } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import UserFormFields from './form/UserFormFields';
import UserRoleSelect from './form/UserRoleSelect';
import UserConnectOption from './form/UserConnectOption';
import type { UserRole } from '@/types/roles';

interface UserFormData {
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
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
    role: 'utilisateur',
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
      const serviceFormData = {
        ...formData,
        role: formData.role === 'utilisateur' ? 'user' : 
              formData.role === 'administrateur' ? 'admin' : formData.role
      };
      const result = await createUser(serviceFormData);
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
          <AlertDescription>{formError}</AlertDescription>
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
          <UserFormFields
            fieldErrors={fieldErrors}
            values={formData}
            onChange={handleChange}
          />
          <UserRoleSelect
            hasManager={hasManager}
            fieldErrors={fieldErrors}
            value={formData.role}
            onChange={handleChange}
          />
          <UserConnectOption
            checked={connectAfterCreate}
            onChange={() => setConnectAfterCreate(!connectAfterCreate)}
          />
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
