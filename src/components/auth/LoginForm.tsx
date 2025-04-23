
import React from 'react';
import { Button } from '@/components/ui/button';
import { Form } from "@/components/ui/form";
import { useLoginForm } from '@/hooks/useLoginForm';
import UsernameField from './UsernameField';
import PasswordField from './PasswordField';
import ForgotPasswordLink from './ForgotPasswordLink';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Database, Info } from 'lucide-react';
import { getApiUrl } from '@/config/apiConfig';

const LoginForm = () => {
  const { form, isLoading, hasDbError, hasServerError, hasAuthError, onSubmit } = useLoginForm();
  const currentApiUrl = getApiUrl();

  return (
    <>
      {hasDbError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Connexion à la base de données impossible. Veuillez vérifier la configuration de votre base de données
            dans le panneau d'administration.
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
      
      {hasAuthError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Identifiants invalides. Utilisateurs disponibles : admin, p71x6d_system, antcirier@gmail.com, 
            p71x6d_dupont, p71x6d_martin.
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
      
      <div className="mt-4 text-xs text-gray-400 flex items-center gap-1">
        <Database className="h-3 w-3" />
        <span>Base MySQL: <span className="font-mono">{currentApiUrl}/database-test</span></span>
      </div>
      
      <Alert variant="default" className="mt-4 bg-blue-50">
        <Info className="h-4 w-4 mr-2" />
        <AlertDescription className="text-xs">
          <strong>Utilisateurs de test disponibles:</strong>
          <ul className="list-disc pl-5 mt-1">
            <li>admin (mot de passe: admin123)</li>
            <li>p71x6d_system (mot de passe: Trottinette43!)</li>
            <li>antcirier@gmail.com (mot de passe: password123)</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <ForgotPasswordLink />
    </>
  );
};

export default LoginForm;
