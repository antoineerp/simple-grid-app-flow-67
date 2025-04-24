
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

interface UserManagementErrorsProps {
  connectionError: string | null;
  error: string | null;
}

const UserManagementErrors = ({ connectionError, error }: UserManagementErrorsProps) => {
  if (!connectionError && !error) return null;
  
  return (
    <>
      {connectionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur de connexion: {connectionError}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default UserManagementErrors;
