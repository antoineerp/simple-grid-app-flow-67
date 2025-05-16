
import React, { useState, useEffect } from 'react';

const Logo = () => {
  const [imageError, setImageError] = useState(false);
  const [logoPath, setLogoPath] = useState("/lovable-uploads/4c7adb52-3da0-4757-acbf-50a1eb1d4bf5.png");
  const fallbackText = "FormaCert";
  
  // Détecter l'environnement au chargement
  useEffect(() => {
    const isLovableEnv = window.location.hostname.includes('lovableproject.com');
    const baseLogoPath = "/lovable-uploads/4c7adb52-3da0-4757-acbf-50a1eb1d4bf5.png";
    setLogoPath(isLovableEnv ? `/public${baseLogoPath}` : baseLogoPath);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center mb-8">
      {!imageError ? (
        <img 
          src={logoPath}
          alt="Formacert Logo" 
          className="h-24 mb-4"
          onError={(e) => {
            console.error("Logo image failed to load:", logoPath);
            // Tenter avec un autre chemin si le premier échoue
            if (!logoPath.includes('/public/') && !window.location.hostname.includes('lovableproject.com')) {
              e.currentTarget.src = `/public${logoPath}`;
            } else {
              setImageError(true);
            }
          }}
        />
      ) : (
        <div className="h-24 mb-4 flex items-center justify-center">
          <span className="text-3xl font-bold text-app-blue">{fallbackText}</span>
        </div>
      )}
      <h2 className="text-2xl font-semibold text-gray-800">Qualite.cloud</h2>
      <p className="text-gray-600 mt-1">Plateforme de Gestion de Certification</p>
    </div>
  );
};

export default Logo;
