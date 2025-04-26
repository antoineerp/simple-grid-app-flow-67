
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info, Loader2 } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { UserFormFields } from './user-form/UserFormFields';
import { useUserForm } from '@/hooks/useUserForm';

interface UserFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  onUserConnect?: (identifiant: string) => void;
}

const UserForm = ({ onClose, onSuccess, onUserConnect }: UserFormProps) => {
  const { utilisateurs, loadUtilisateurs } = useAdminUsers();
  const [hasManager, setHasManager] = React.useState(false);

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
    onSuccess: () => {
      // Appel explicite pour recharger la liste des utilisateurs
      setTimeout(loadUtilisateurs, 1000);
      
      // Appeler le callback de succès d'origine
      if (onSuccess) onSuccess();
    }, 
    onUserConnect 
  });

  useEffect(() => {
    if (utilisateurs.some(user => user.role === 'gestionnaire')) {
      setHasManager(true);
    }
  }, [utilisateurs]);

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
        <UserFormFields
          formData={formData}
          fieldErrors={fieldErrors}
          handleChange={handleChange}
          hasManager={hasManager}
          connectAfterCreate={connectAfterCreate}
          setConnectAfterCreate={setConnectAfterCreate}
          isSubmitting={isSubmitting}
        />

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
