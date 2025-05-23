
import { useState, FormEvent } from 'react';
import { toast } from "@/hooks/use-toast";
import { UserRole } from '@/types/roles';
import { connectAsUser } from '@/services';

interface UserFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  onUserConnect?: (identifiant: string) => void;
}

interface UserFormData {
  nom: string;
  prenom: string;
  email: string;
  identifiant_technique: string;
  role: UserRole;
  mot_de_passe: string;
  confirmation_mot_de_passe: string;
}

interface FieldErrors {
  nom?: string;
  prenom?: string;
  email?: string;
  identifiant_technique?: string;
  mot_de_passe?: string;
  confirmation_mot_de_passe?: string;
}

export const useUserForm = ({ onClose, onSuccess, onUserConnect }: UserFormProps) => {
  const [formData, setFormData] = useState<UserFormData>({
    nom: '',
    prenom: '',
    email: '',
    identifiant_technique: '',
    role: 'utilisateur',
    mot_de_passe: '',
    confirmation_mot_de_passe: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectAfterCreate, setConnectAfterCreate] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    let isValid = true;

    if (!formData.nom.trim()) {
      errors.nom = 'Le nom est obligatoire';
      isValid = false;
    }

    if (!formData.prenom.trim()) {
      errors.prenom = 'Le prénom est obligatoire';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'L\'email est obligatoire';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
      isValid = false;
    }

    if (!formData.identifiant_technique.trim()) {
      errors.identifiant_technique = 'L\'identifiant technique est obligatoire';
      isValid = false;
    }

    if (!formData.mot_de_passe.trim()) {
      errors.mot_de_passe = 'Le mot de passe est obligatoire';
      isValid = false;
    } else if (formData.mot_de_passe.length < 6) {
      errors.mot_de_passe = 'Le mot de passe doit contenir au moins 6 caractères';
      isValid = false;
    }

    if (formData.mot_de_passe !== formData.confirmation_mot_de_passe) {
      errors.confirmation_mot_de_passe = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Réinitialiser l'erreur spécifique lors de la modification
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          user: {
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email,
            identifiant_technique: formData.identifiant_technique,
            role: formData.role,
            mot_de_passe: formData.mot_de_passe,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      
      toast({
        title: "Utilisateur créé",
        description: `L'utilisateur ${formData.prenom} ${formData.nom} a été créé avec succès.`,
      });

      if (connectAfterCreate && onUserConnect) {
        // Connexion automatique avec le nouvel utilisateur
        const connectionSuccess = await connectAsUser(formData.identifiant_technique);
        
        if (connectionSuccess) {
          toast({
            title: "Connexion réussie",
            description: `Connecté en tant que ${formData.identifiant_technique}`,
          });
          
          onUserConnect(formData.identifiant_technique);
        } else {
          toast({
            title: "Avertissement",
            description: "Utilisateur créé mais la connexion automatique a échoué",
            variant: "destructive",
          });
        }
      }

      if (onSuccess) {
        onSuccess();
      }
      
      onClose();

    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      setFormError(error instanceof Error ? error.message : "Une erreur s'est produite");
      
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création de l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    connectAfterCreate,
    formError,
    fieldErrors,
    setConnectAfterCreate,
    handleSubmit,
    handleChange
  };
};
