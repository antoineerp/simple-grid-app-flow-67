
import React from 'react';
import { Control } from "react-hook-form";
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoginFormValues } from '@/hooks/useLoginForm';

interface PasswordFieldProps {
  control: Control<LoginFormValues>;
}

const PasswordField: React.FC<PasswordFieldProps> = ({ control }) => {
  return (
    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Mot de passe</FormLabel>
          <FormControl>
            <Input type="password" placeholder="Entrez votre mot de passe" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default PasswordField;
