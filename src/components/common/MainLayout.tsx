
import React from 'react';
import AppSyncManager from './AppSyncManager';

interface MainLayoutProps {
  children: React.ReactNode;
  showSyncControls?: boolean;
}

/**
 * Layout principal qui inclut le gestionnaire de synchronisation centralisé
 */
export function MainLayout({ 
  children, 
  showSyncControls = true 
}: MainLayoutProps) {
  return (
    <div className="container max-w-7xl mx-auto py-4">
      {/* Gestionnaire de synchronisation en haut */}
      <AppSyncManager 
        showControls={showSyncControls} 
        className="mb-4 sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-md shadow-sm" 
      />
      
      {/* Contenu principal */}
      <div className="space-y-4">
        {children}
      </div>
      
      {/* Footer avec statut de synchronisation */}
      <footer className="mt-8 border-t pt-4">
        <AppSyncManager showControls={false} />
      </footer>
    </div>
  );
}

export default MainLayout;
