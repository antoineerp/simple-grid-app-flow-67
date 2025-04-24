
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatabaseConfigType } from './types';

interface DatabaseConfigFormProps {
  dbConfig: DatabaseConfigType;
  customDbName: boolean;
  setCustomDbName: (value: boolean) => void;
  availableDatabases: string[];
  handleChange: (field: keyof DatabaseConfigType, value: string) => void;
  handleDatabaseSelect: (value: string) => void;
}

const DatabaseConfigForm = ({
  dbConfig,
  customDbName,
  setCustomDbName,
  availableDatabases,
  handleChange,
  handleDatabaseSelect
}: DatabaseConfigFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="host">Hôte</Label>
        <Input 
          id="host" 
          value={dbConfig.host} 
          onChange={(e) => handleChange('host', e.target.value)}
          placeholder="p71x6d.myd.infomaniak.com"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="db_name">Base de données</Label>
        {customDbName ? (
          <Input 
            id="db_name" 
            value={dbConfig.db_name} 
            onChange={(e) => handleChange('db_name', e.target.value)} 
            placeholder="p71x6d_nom_de_votre_base"
          />
        ) : (
          <Select value={dbConfig.db_name} onValueChange={handleDatabaseSelect}>
            <SelectTrigger id="db_name">
              <SelectValue placeholder="Sélectionnez une base de données" />
            </SelectTrigger>
            <SelectContent>
              {availableDatabases.map(db => (
                <SelectItem key={db} value={db}>{db}</SelectItem>
              ))}
              <SelectItem value="custom">Autre (saisie personnalisée)</SelectItem>
            </SelectContent>
          </Select>
        )}
        {customDbName && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={() => setCustomDbName(false)}
          >
            Revenir aux bases prédéfinies
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="username">Nom d'utilisateur</Label>
        <Input 
          id="username" 
          value={dbConfig.username} 
          onChange={(e) => handleChange('username', e.target.value)} 
          placeholder="p71x6d_utilisateur"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Input 
            id="password" 
            type={showPassword ? "text" : "password"} 
            value={dbConfig.password} 
            onChange={(e) => handleChange('password', e.target.value)} 
            placeholder="Votre mot de passe"
          />
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="absolute right-0 top-0 h-full" 
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseConfigForm;
