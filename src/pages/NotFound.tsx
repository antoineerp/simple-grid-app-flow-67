
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getIsLoggedIn } from '@/services/auth/authService';

const NotFound = () => {
  const isLoggedIn = getIsLoggedIn();
  const homeLink = isLoggedIn ? "/pilotage" : "/";

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Page non trouvée</h2>
        <p className="text-gray-600 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Button asChild>
          <Link to={homeLink}>
            Retourner à l'accueil
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
