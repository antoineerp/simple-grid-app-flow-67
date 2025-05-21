
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";

interface SystemInfo {
  version: string;
  status: 'normal' | 'warning' | 'critical';
  lastCheck: Date;
  memory: string;
  uptime: string;
}

const SystemStatus: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    version: '1.0.0',
    status: 'normal',
    lastCheck: new Date(),
    memory: '65%',
    uptime: '7 jours'
  });

  useEffect(() => {
    // Simulation de récupération des données système
    const interval = setInterval(() => {
      setSystemInfo(prev => ({
        ...prev,
        lastCheck: new Date()
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>État du système</CardTitle>
            <CardDescription>Statut et informations de performance</CardDescription>
          </div>
          
          <Badge 
            variant={
              systemInfo.status === 'normal' ? 'default' : 
              systemInfo.status === 'warning' ? 'outline' : 
              'destructive'
            }
          >
            {systemInfo.status === 'normal' && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
            {systemInfo.status === 'warning' && <AlertTriangle className="h-3.5 w-3.5 mr-1" />}
            {systemInfo.status === 'critical' && <Info className="h-3.5 w-3.5 mr-1" />}
            {systemInfo.status === 'normal' ? 'Opérationnel' : 
             systemInfo.status === 'warning' ? 'Attention' : 
             'Critique'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Version</p>
            <p className="text-sm text-muted-foreground">{systemInfo.version}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Dernière vérification</p>
            <p className="text-sm text-muted-foreground">{systemInfo.lastCheck.toLocaleTimeString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Utilisation mémoire</p>
            <p className="text-sm text-muted-foreground">{systemInfo.memory}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Temps de fonctionnement</p>
            <p className="text-sm text-muted-foreground">{systemInfo.uptime}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;
