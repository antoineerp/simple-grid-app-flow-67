
import React, { useState } from 'react';
import LogoSelector from '../LogoSelector';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hasPermission, UserRole } from '@/types/roles';
import { getCurrentUser } from '@/services/auth/authService';

export const Header: React.FC = () => {
  const [logo, setLogo] = useState("/lovable-uploads/4c7adb52-3da0-4757-acbf-50a1eb1d4bf5.png");
  const user = getCurrentUser();
  const userRole = (user?.role || 'utilisateur') as UserRole;
  const canAccessAdminPanel = hasPermission(userRole, 'accessAdminPanel');

  const handleLogoChange = (newLogo: string) => {
    setLogo(newLogo);
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="container flex justify-between items-center py-2">
        <div className="flex items-center space-x-4">
          <LogoSelector currentLogo={logo} onLogoChange={handleLogoChange} />
          <h1 className="text-xl font-bold">Qualité.flow - Système de Management de la Qualité</h1>
        </div>

        {/* Bouton d'administration ajouté ici */}
        {canAccessAdminPanel && (
          <Link to="/administration">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Administration
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};
