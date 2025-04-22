
import React from 'react';
import { Button } from '@/components/ui/button';
import { Form } from "@/components/ui/form";
import { useLoginForm } from '@/hooks/useLoginForm';
import UsernameField from './UsernameField';
import PasswordField from './PasswordField';
import ForgotPasswordLink from './ForgotPasswordLink';

const LoginForm = () => {
  const { form, isLoading, onSubmit } = useLoginForm();

  return (
    <>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <UsernameField control={form.control} />
          <PasswordField control={form.control} />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>
      </Form>
      
      <ForgotPasswordLink />
    </>
  );
};

export default LoginForm;
