
import React, { useEffect } from 'react';
import { AppSyncManager } from './AppSyncManager';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { ensureCorrectUserId } from '@/services/core/userIdConverter';

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
  // S'assurer que l'ID utilisateur est correct lors du montage du composant
  useEffect(() => {
    const userId = getCurrentUser();
    const safeUserId = ensureCorrectUserId(userId);
    
    if (userId !== safeUserId) {
      console.log(`MainLayout: Correction de l'ID utilisateur ${userId} -> ${safeUserId}`);
      
      // Émettre un événement pour informer les autres composants
      window.dispatchEvent(new CustomEvent('userChanged', { 
        detail: { userId: safeUserId }
      }));
    } else {
      console.log(`MainLayout: ID utilisateur valide: ${userId}`);
    }
  }, []);
  
  return (
    <div className="container max-w-7xl mx-auto py-4">
      {/* Gestionnaire de synchronisation en haut */}
      <AppSyncManager 
        showControls={showSyncControls} 
        className="mb-4 sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-md shadow-sm"
        enableDebugger={true} // Activer le débogueur pour mieux comprendre les problèmes de synchronisation
      />
      
      {/* Contenu principal */}
      <div className="space-y-4">
        {children}
      </div>
      
      {/* Footer avec statut de synchronisation minimal */}
      <footer className="mt-8 border-t pt-4">
        <AppSyncManager showControls={false} enableDebugger={false} />
      </footer>
    </div>
  );
}

export default MainLayout;
