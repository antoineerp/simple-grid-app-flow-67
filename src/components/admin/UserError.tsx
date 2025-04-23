
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

interface UserErrorProps {
  error: string | null;
  connectionError: string | null;
}

export const UserError = ({ error, connectionError }: UserErrorProps) => {
  if (!error && !connectionError) return null;

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
