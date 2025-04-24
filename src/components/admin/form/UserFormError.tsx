
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

interface UserFormErrorProps {
  formError: string | null;
  apiDebugInfo: string | null;
}

const UserFormError = ({ formError, apiDebugInfo }: UserFormErrorProps) => {
  if (!formError && !apiDebugInfo) return null;

  return (
    <>
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {apiDebugInfo && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200 mb-4 text-xs">
          <details>
            <summary className="cursor-pointer font-medium">Informations de débogage</summary>
            <pre className="mt-2 whitespace-pre-wrap">{apiDebugInfo}</pre>
          </details>
        </Alert>
      )}
    </>
  );
};

export default UserFormError;
