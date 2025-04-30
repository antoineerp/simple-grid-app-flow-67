
import React from 'react';
import { SyncStatus } from '@/components/common/SyncStatus';
import { SyncDiagnosticButton } from '@/components/diagnostics/SyncDiagnosticButton';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-border bg-background">
      <div className="container flex justify-between items-center py-2">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Gestion Qualité</h1>
        </div>
        <div className="flex items-center gap-2">
          <SyncStatus />
          <SyncDiagnosticButton />
        </div>
      </div>
    </header>
  );
};
