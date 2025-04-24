
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { createUser } from '@/services/users/createUserService';
import { connectAsUser } from '@/services';
import type { UserRole } from '@/types/roles';

interface UserFormData {
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  mot_de_passe: string;
}

interface UseUserFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  onUserConnect?: (identifiant: string) => void;
}

export const useUserForm = ({ onClose, onSuccess, onUserConnect }: UseUserFormProps) => {
  const { toast } = useToast();
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
  const [apiDebugInfo, setApiDebugInfo] = useState<string | null>(null);

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
    setApiDebugInfo(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const apiRole: 'admin' | 'user' | 'gestionnaire' = 
        formData.role === 'utilisateur' ? 'user' : 
        formData.role === 'administrateur' ? 'admin' : 
        'gestionnaire';
        
      const serviceFormData = {
        ...formData,
        role: apiRole
      };
      
      const result = await createUser(serviceFormData);
      
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
      
      const debugInfo = error instanceof Error 
        ? `Type: ${error.name}, Stack: ${error.stack?.substring(0, 200) || 'Non disponible'}`
        : `Type: ${typeof error}, Détails: ${JSON.stringify(error).substring(0, 200)}`;
      setApiDebugInfo(debugInfo);
      
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes("email existe déjà")) {
          setFieldErrors(prev => ({ ...prev, email: "Cet email est déjà utilisé" }));
        } else if (errorMessage.includes("Un seul compte gestionnaire")) {
          setFieldErrors(prev => ({ ...prev, role: "Un gestionnaire existe déjà" }));
        }
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

  return {
    formData,
    isSubmitting,
    connectAfterCreate,
    formError,
    fieldErrors,
    apiDebugInfo,
    setConnectAfterCreate,
    handleChange,
    handleSubmit
  };
};
