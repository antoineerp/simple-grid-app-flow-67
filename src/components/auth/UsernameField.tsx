
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
          <FormLabel>Identifiant ou Email</FormLabel>
          <FormControl>
            <Input 
              placeholder="Entrez votre identifiant ou email" 
              {...field} 
              type="text"
              onChange={(e) => {
                const value = e.target.value.trim();
                console.log("Identifiant/Email en cours de saisie:", value);
                field.onChange(value);
              }}
              onBlur={(e) => {
                const value = e.target.value.trim();
                console.log("Identifiant/Email validé:", value);
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
