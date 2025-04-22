
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from "@/hooks/use-toast";
import { EyeIcon, EyeOffIcon, Database } from 'lucide-react';

interface DatabaseFormProps {
  onConfigurationSaved: () => void;
}

const DatabaseConnectionForm = ({ onConfigurationSaved }: DatabaseFormProps) => {
  const { toast } = useToast();
  const [dbConfig, setDbConfig] = useState({
    host: "p71x6d.myd.infomaniak.com",
    db_name: "p71x6d_system",
    username: "p71x6d_system",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setDbConfig(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/database-config`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dbConfig)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Configuration enregistrée",
          description: "La connexion à la base de données a été configurée avec succès",
        });
        
        if (onConfigurationSaved) {
          onConfigurationSaved();
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de l'enregistrement de la configuration");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la configuration de la base de données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuration de la connexion à la base de données</CardTitle>
        <CardDescription>Entrez les informations de connexion à votre base de données MySQL Infomaniak</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="host">Hôte</Label>
              <Input
                id="host"
                value={dbConfig.host}
                onChange={(e) => handleInputChange(e, 'host')}
                placeholder="p71x6d.myd.infomaniak.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="db_name">Nom de la base de données</Label>
              <Input
                id="db_name"
                value={dbConfig.db_name}
                onChange={(e) => handleInputChange(e, 'db_name')}
                placeholder="p71x6d_system"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                value={dbConfig.username}
                onChange={(e) => handleInputChange(e, 'username')}
                placeholder="p71x6d_system"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <div className="flex">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={dbConfig.password}
                  onChange={(e) => handleInputChange(e, 'password')}
                  placeholder="Mot de passe MySQL"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="ml-2"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </Button>
              </div>
            </div>
            
            <Alert className="mt-4">
              <Database className="h-4 w-4 mr-2" />
              <AlertDescription>
                Ces informations sont disponibles dans votre espace client Infomaniak, 
                section Hébergement Web &gt; Bases de données MySQL.
              </AlertDescription>
            </Alert>
          </div>
          
          <Button type="submit" className="mt-6 w-full" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer la configuration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DatabaseConnectionForm;
