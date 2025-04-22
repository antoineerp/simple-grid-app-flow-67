
import React from 'react';
import { Button } from '@/components/ui/button';
import { Form } from "@/components/ui/form";
import { useLoginForm } from '@/hooks/useLoginForm';
import UsernameField from './UsernameField';
import PasswordField from './PasswordField';
import ForgotPasswordLink from './ForgotPasswordLink';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { getApiUrl } from '@/config/apiConfig';

const LoginForm = () => {
  const { form, isLoading, hasDbError, hasServerError, onSubmit } = useLoginForm();
  const currentApiUrl = getApiUrl();

  return (
    <>
      {hasDbError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Connexion à la base de données impossible. Le service est momentanément indisponible.
            Veuillez contacter l'administrateur système.
          </AlertDescription>
        </Alert>
      )}
      
      {hasServerError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Le serveur d'authentification est temporairement inaccessible.
            Veuillez contacter l'administrateur système.
          </AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <UsernameField control={form.control} />
          <PasswordField control={form.control} />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>
      </Form>
      
      <div className="mt-4 text-xs text-gray-400">
        <p>URL d'API actuelle: <span className="font-mono">{currentApiUrl}</span></p>
      </div>
      
      <ForgotPasswordLink />
    </>
  );
};

export default LoginForm;
