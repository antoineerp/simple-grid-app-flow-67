
import React from 'react';

interface ServerInfoProps {
  serverInfo: {
    php_version: string;
    server_name: string;
    script: string;
    remote_addr: string;
  };
}

export const ServerInfo: React.FC<ServerInfoProps> = ({ serverInfo }) => {
  return (
    <div className="border-t pt-4">
      <h3 className="text-md font-medium mb-3">Informations serveur</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div><strong>Version PHP:</strong> {serverInfo.php_version}</div>
        <div><strong>Serveur:</strong> {serverInfo.server_name}</div>
        <div><strong>Script:</strong> {serverInfo.script}</div>
        <div><strong>Adresse IP:</strong> {serverInfo.remote_addr}</div>
      </div>
    </div>
  );
};
