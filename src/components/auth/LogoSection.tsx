
import React from 'react';
import { useLogoLoader } from '@/hooks/useLogoLoader';

export const LogoSection = () => {
  const logoSrc = useLogoLoader();
  
  return (
    <div className="flex flex-col items-center mb-8">
      <img 
        src={logoSrc} 
        alt="FormaCert Logo" 
        className="w-48 mb-4"
        onError={(e) => {
          console.error("Logo failed to load:", (e.target as HTMLImageElement).src);
          (e.target as HTMLImageElement).src = "/logo-swiss.svg";
        }}
      />
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Connexion à votre compte</h1>
      <p className="text-sm text-gray-600 text-center mb-3">Accédez à la plateforme de gestion Qualiflow</p>
    </div>
  );
};
