
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, RefreshCw, Database } from "lucide-react";
import { useDatabaseConnection } from '@/services/dbConnection';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SimpleDatabaseStatus: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [details, setDetails] = useState<any>(null);
  const { testConnection } = useDatabaseConnection();
  
  const checkConnection = async () => {
    setStatus('loading');
    
    try {
      const result = await testConnection(false);
      
      if (result.status === 'success') {
        setStatus('success');
      } else {
        setStatus('error');
      }
      
      setDetails(result);
    } catch (error) {
      setStatus('error');
      setDetails({ error: error instanceof Error ? error.message : String(error) });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          État de la base de données
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {status === 'idle' && (
              <Badge variant="outline">Non vérifié</Badge>
            )}
            {status === 'loading' && (
              <Badge variant="outline" className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Vérification...
              </Badge>
            )}
            {status === 'success' && (
              <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200">
                <CheckCircle className="h-3 w-3" />
                Connecté
              </Badge>
            )}
            {status === 'error' && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Erreur
              </Badge>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkConnection}
            disabled={status === 'loading'}
            className="flex items-center gap-1"
          >
            {status === 'loading' ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            <span>Vérifier la connexion</span>
          </Button>
        </div>
        
        {status === 'success' && details?.database && (
          <div className="mt-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg">
              <div className="font-medium">Base de données:</div>
              <div>{details.database.name}</div>
              
              <div className="font-medium">Hôte:</div>
              <div>{details.database.host}</div>
              
              <div className="font-medium">Version MySQL:</div>
              <div>{details.database.mysql_version}</div>
              
              <div className="font-medium">Nombre de tables:</div>
              <div>{details.database.tables_count}</div>
            </div>
            
            {details.database.tables_sample && details.database.tables_sample.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Tables disponibles:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {details.database.tables_sample.map((table: string, i: number) => (
                    <div key={i} className="p-1 bg-muted rounded text-xs">{table}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {status === 'error' && details && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <p className="font-medium">Erreur de connexion:</p>
            <p className="mt-1">{details.message || 'Erreur inconnue'}</p>
            {details.error && (
              <p className="mt-1 text-xs font-mono break-all">{details.error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleDatabaseStatus;
