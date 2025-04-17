
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ApiConfig } from '@/hooks/useApiConfig';

interface PermanentApiConfigProps {
  config: ApiConfig;
  loading: boolean;
  onInputChange: (section: 'api_urls' | 'allowed_origins', env: 'development' | 'production', value: string) => void;
}

const PermanentApiConfig: React.FC<PermanentApiConfigProps> = ({
  config,
  loading,
  onInputChange
}) => {
  return (
    <>
      <div className="space-y-4 p-4 border rounded-md">
        <h3 className="text-lg font-medium">Configuration permanente</h3>
        <p className="text-sm text-gray-500">Cette configuration est enregistrée sur le serveur et s'applique à tous les utilisateurs</p>
        
        <div className="grid gap-6">
          <div>
            <h4 className="text-md font-medium mb-2">URLs de l'API</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="api-dev">Développement</Label>
                <Input 
                  id="api-dev"
                  value={config.api_urls.development}
                  onChange={(e) => onInputChange('api_urls', 'development', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="api-prod">Production</Label>
                <Input 
                  id="api-prod"
                  value={config.api_urls.production}
                  onChange={(e) => onInputChange('api_urls', 'production', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium mb-2">Origines autorisées (CORS)</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="origin-dev">Développement</Label>
                <Input 
                  id="origin-dev"
                  value={config.allowed_origins.development}
                  onChange={(e) => onInputChange('allowed_origins', 'development', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="origin-prod">Production</Label>
                <Input 
                  id="origin-prod"
                  value={config.allowed_origins.production}
                  onChange={(e) => onInputChange('allowed_origins', 'production', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Alert>
        <AlertDescription>
          Après avoir modifié la configuration permanente, vous devrez redémarrer le serveur pour que les changements prennent effet.
        </AlertDescription>
      </Alert>
    </>
  );
};

export default PermanentApiConfig;
