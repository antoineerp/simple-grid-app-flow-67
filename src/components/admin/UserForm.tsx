
import React from 'react';
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Loader2 } from 'lucide-react';
import UserFormFields from './form/UserFormFields';
import UserRoleSelect from './form/UserRoleSelect';
import UserConnectOption from './form/UserConnectOption';
import UserFormError from './form/UserFormError';
import { useUserForm } from '@/hooks/useUserForm';

interface UserFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  onUserConnect?: (identifiant: string) => void;
}

const UserForm = ({ onClose, onSuccess, onUserConnect }: UserFormProps) => {
  const { utilisateurs } = useAdminUsers();
  const hasManager = utilisateurs.some(user => user.role === 'gestionnaire');

  const {
    formData,
    isSubmitting,
    connectAfterCreate,
    formError,
    fieldErrors,
    apiDebugInfo,
    setConnectAfterCreate,
    handleChange,
    handleSubmit
  } = useUserForm({ onClose, onSuccess, onUserConnect });

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
        <DialogDescription>
          Remplissez les informations pour créer un nouvel utilisateur.
        </DialogDescription>
      </DialogHeader>

      <UserFormError formError={formError} apiDebugInfo={apiDebugInfo} />

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
