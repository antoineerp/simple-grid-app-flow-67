
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock login for demonstration
    const mockUser = {
      id: '1',
      email: 'user@example.com',
      role: 'admin',
      identifiant_technique: 'user_1',
    };
    
    login(mockUser);
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Connexion</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none">Email</label>
                <Input id="email" type="email" placeholder="Entrez votre email" />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none">Mot de passe</label>
                <Input id="password" type="password" placeholder="Entrez votre mot de passe" />
              </div>
            </div>
            <Button type="submit" className="w-full mt-6">Se connecter</Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => navigate('/register')}>
            Créer un compte
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
