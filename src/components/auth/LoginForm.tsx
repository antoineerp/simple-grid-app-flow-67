
// Mettre à jour le composant LoginForm pour utiliser notre nouveau système de synchronisation

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { unifiedSync } from '@/services/sync/UnifiedSyncService';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Champs requis",
        description: "Veuillez saisir votre email et mot de passe",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Pour ce prototype, nous utilisons un utilisateur fictif
      const mockUser = {
        id: '1',
        email: email,
        role: 'admin',
        identifiant_technique: 'user_1',
      };
      
      login(mockUser);
      
      // Initialiser la synchronisation après connexion
      try {
        // Précharger quelques données essentielles
        await unifiedSync.loadData('exigences', mockUser.id);
        await unifiedSync.loadData('membres', mockUser.id);
      } catch (error) {
        console.warn("Erreur lors du préchargement initial:", error);
        // On ne bloque pas la connexion pour ça
      }
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Qualite.cloud",
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <Input 
          id="email" 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com" 
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
        <Input 
          id="password" 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" 
          disabled={isLoading}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? "Connexion en cours..." : "Se connecter"}
      </Button>
      
      <div className="text-center text-sm">
        <a href="#" className="text-blue-600 hover:underline">
          Mot de passe oublié?
        </a>
      </div>
    </form>
  );
};

export default LoginForm;
