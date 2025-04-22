
import React from 'react';
import { Control } from "react-hook-form";
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoginFormValues } from '@/hooks/useLoginForm';

interface UsernameFieldProps {
  control: Control<LoginFormValues>;
}

const UsernameField: React.FC<UsernameFieldProps> = ({ control }) => {
  return (
    <FormField
      control={control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nom d'utilisateur</FormLabel>
          <FormControl>
            <Input 
              placeholder="Entrez votre nom d'utilisateur" 
              {...field} 
              onChange={(e) => {
                const value = e.target.value.trim();
                console.log("Nom d'utilisateur en cours de saisie:", value);
                field.onChange(value);
              }}
              onBlur={(e) => {
                const value = e.target.value.trim();
                console.log("Nom d'utilisateur validé:", value);
                field.onBlur();
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default UsernameField;
