
import React from 'react';
import { Button } from '@/components/ui/button';
import { Form } from "@/components/ui/form";
import { useLoginForm } from '@/hooks/useLoginForm';
import UsernameField from './UsernameField';
import PasswordField from './PasswordField';
import ForgotPasswordLink from './ForgotPasswordLink';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

const LoginForm = () => {
  const { form, isLoading, hasDbError, hasServerError, onSubmit } = useLoginForm();

  return (
    <>
      {hasDbError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Connexion à la base de données impossible. Le service est momentanément indisponible. 
            Veuillez utiliser l'authentification de secours avec les identifiants de test ci-dessous.
          </AlertDescription>
        </Alert>
      )}
      
      {hasServerError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Le serveur d'authentification est temporairement inaccessible.
            Veuillez utiliser l'authentification de secours avec les identifiants de test ci-dessous.
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
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Identifiants de secours (en cas de problème) :</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Utilisateur: admin, Mot de passe: admin123</li>
          <li>Utilisateur: antcirier@gmail.com, Mot de passe: password123</li>
          <li>Utilisateur: p71x6d_system, Mot de passe: admin123</li>
        </ul>
        <p className="mt-2 italic">Ces identifiants permettent de se connecter en mode de secours, même si le serveur d'authentification ou la base de données n'est pas disponible.</p>
      </div>
      
      <ForgotPasswordLink />
    </>
  );
};

export default LoginForm;
