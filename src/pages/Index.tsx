
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { loginUser } from '@/services';

const loginSchema = z.object({
  username: z.string().min(3, { message: "Le nom d'utilisateur doit comporter au moins 3 caractères" }),
  password: z.string().min(6, { message: "Le mot de passe doit comporter au moins 6 caractères" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      // Show loading toast
      toast({
        title: "Connexion en cours",
        description: "Veuillez patienter...",
      });
      
      const result = await loginUser(data.username, data.password);
      
      if (result.success) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", result.user.identifiant_technique || data.username);
        
        toast({
          title: `Connexion réussie`,
          description: `Bienvenue, ${result.user.role}`,
        });
        
        navigate("/pilotage");
      } else {
        toast({
          title: "Échec de la connexion",
          description: result.error || "Identifiants incorrects",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 md:mr-8">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/lovable-uploads/4425c340-2ce3-416b-abc9-b75906ca8705.png" 
            alt="FormaCart Logo" 
            className="w-48 mb-4" 
          />
          <h1 className="text-2xl font-bold text-gray-800">Bienvenue sur FormaCart</h1>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom d'utilisateur</FormLabel>
                  <FormControl>
                    <Input placeholder="Entrez votre nom d'utilisateur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
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
            
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-app-blue hover:underline">
            Mot de passe oublié?
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
