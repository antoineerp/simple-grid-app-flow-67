
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getFullApiUrl } from '@/config/apiConfig';

interface TemporaryApiConfigProps {
  customUrl: string;
  useCustomUrl: boolean;
  loading: boolean;
  onCustomUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleCustomUrl: () => void;
}

const TemporaryApiConfig: React.FC<TemporaryApiConfigProps> = ({
  customUrl,
  useCustomUrl,
  loading,
  onCustomUrlChange,
  onToggleCustomUrl
}) => {
  return (
    <div className="space-y-4 p-4 border rounded-md bg-slate-50">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Configuration temporaire (cette session uniquement)</h3>
        {useCustomUrl && (
          <Badge variant="destructive">URL personnalisée active</Badge>
        )}
        {!useCustomUrl && (
          <Badge variant="outline">URL relative standard</Badge>
        )}
      </div>
      <p className="text-sm text-gray-500">Cette configuration est stockée dans le navigateur et n'affecte que votre session actuelle</p>
      
      <div className="grid gap-3">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="custom-url">URL de l'API personnalisée</Label>
          <div className="flex space-x-2">
            <Input 
              id="custom-url" 
              value={customUrl}
              onChange={onCustomUrlChange}
              disabled={loading}
            />
            <Button onClick={onToggleCustomUrl} variant={useCustomUrl ? "destructive" : "default"}>
              {useCustomUrl ? "Désactiver" : "Activer"}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            URL actuelle: <span className="font-mono">{getFullApiUrl()}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemporaryApiConfig;
