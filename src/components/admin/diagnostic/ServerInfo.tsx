
import React from 'react';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ServerCog } from 'lucide-react';

interface ServerInfoProps {
  serverInfo: {
    php_version: string;
    server_name: string;
    script: string;
    remote_addr: string;
  };
}

export const ServerInfo: React.FC<ServerInfoProps> = ({ serverInfo }) => (
  <Card className="mt-4">
    <CardContent className="pt-6">
      <div className="flex items-center gap-2 mb-4">
        <ServerCog className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-lg">Informations du serveur</CardTitle>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Version PHP</div>
          <div className="font-mono">{serverInfo.php_version}</div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-muted-foreground">Serveur</div>
          <div className="font-mono">{serverInfo.server_name}</div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-muted-foreground">Script</div>
          <div className="font-mono truncate">{serverInfo.script}</div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-muted-foreground">IP du client</div>
          <div className="font-mono">{serverInfo.remote_addr}</div>
        </div>
      </div>
    </CardContent>
  </Card>
);
