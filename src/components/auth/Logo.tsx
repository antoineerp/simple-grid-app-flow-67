
import React, { useState } from 'react';

const Logo = () => {
  const [imageSrc, setImageSrc] = useState('/lovable-uploads/1c6b80c6-6e45-4f6e-ab03-b7a474bd674c.png');
  const [imageError, setImageError] = useState(false);

  // Fonction pour gérer les erreurs de chargement d'image
  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      
      // Chemin avec préfixe public
      const publicPath = `/public${imageSrc}`;
      console.log(`Logo image failed to load: ${imageSrc}, trying fallback: ${publicPath}`);
      setImageSrc(publicPath);
      
      // Si nous sommes sur qualiopi.ch, essayons un chemin avec le sous-dossier
      if (window.location.hostname === 'qualiopi.ch') {
        // Extraire le chemin du sous-dossier
        const pathMatch = window.location.pathname.match(/^(\/sites\/[^\/]+)/);
        if (pathMatch && pathMatch[1]) {
          const siteRootPath = `${pathMatch[1]}${imageSrc}`;
          console.log(`Logo image failed to load, trying site root path: ${siteRootPath}`);
          setImageSrc(siteRootPath);
        }
      }
    } else {
      // Si même le chemin alternatif échoue, utiliser une image de secours
      console.log(`Alternative logo path also failed, using backup logo`);
      setImageSrc('/formacert-logo.png');
    }
  };

  const handleImageSuccess = () => {
    console.log(`Logo image loaded successfully: ${imageSrc}`);
  };

  return (
    <div className="flex flex-col items-center justify-center mb-8">
      <img 
        src={imageSrc} 
        alt="FormaCert Logo" 
        className="h-24 mb-4"
        onError={handleImageError}
        onLoad={handleImageSuccess}
      />
      <h2 className="text-2xl font-semibold text-gray-800">FormaCert</h2>
      <p className="text-gray-600 mt-1">Plateforme de Gestion de Certification</p>
    </div>
  );
};

export default Logo;
