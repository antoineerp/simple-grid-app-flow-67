
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface DemoButtonsProps {
  onFillTestData: (role: string) => void;
}

export const DemoButtons = ({ onFillTestData }: DemoButtonsProps) => {
  const [isLovableDemo, setIsLovableDemo] = useState(false);
  
  useEffect(() => {
    // Détecter si nous sommes en mode démo Lovable
    setIsLovableDemo(typeof window.__LOVABLE_EDITOR__ !== 'undefined' && window.__LOVABLE_EDITOR__ !== null);
  }, []);
  
  // Ne pas afficher les boutons démo en mode production
  if (!isLovableDemo) {
    return null;
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <p className="text-sm text-gray-500 mb-2 text-center">Connexion rapide (mode démo)</p>
      <div className="flex justify-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => onFillTestData('admin')} className="text-xs">
          Admin
        </Button>
        <Button variant="outline" size="sm" onClick={() => onFillTestData('manager')} className="text-xs">
          Gestionnaire
        </Button>
        <Button variant="outline" size="sm" onClick={() => onFillTestData('user')} className="text-xs">
          Utilisateur
        </Button>
      </div>
    </div>
  );
};
