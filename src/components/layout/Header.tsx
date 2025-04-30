
// Si ce fichier n'existe pas encore, créons-le
import React from 'react';
import { SyncStatus } from '@/components/common/SyncStatus';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-border bg-background">
      <div className="container flex justify-between items-center py-2">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Gestion Qualité</h1>
        </div>
        <SyncStatus />
      </div>
    </header>
  );
};
