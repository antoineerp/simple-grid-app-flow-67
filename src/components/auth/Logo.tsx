
import React, { useState } from 'react';

const Logo = () => {
  const [logoSrc, setLogoSrc] = useState("/lovable-uploads/1c6b80c6-6e45-4f6e-ab03-b7a474bd674c.png");
  const [logoLoaded, setLogoLoaded] = useState(false);

  // Liste des chemins alternatifs pour l'image
  const fallbackImages = [
    "/lovable-uploads/1c6b80c6-6e45-4f6e-ab03-b7a474bd674c.png",
    "/public/lovable-uploads/1c6b80c6-6e45-4f6e-ab03-b7a474bd674c.png",
    "/logo-swiss.svg"
  ];
  
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const handleImageError = () => {
    if (fallbackIndex < fallbackImages.length - 1) {
      console.log(`Logo image failed to load: ${logoSrc}, trying fallback: ${fallbackImages[fallbackIndex + 1]}`);
      setLogoSrc(fallbackImages[fallbackIndex + 1]);
      setFallbackIndex(fallbackIndex + 1);
    } else {
      console.error("All logo images failed to load");
      // Utiliser un logo par défaut
      setLogoSrc("/logo-swiss.svg");
    }
  };

  const handleImageLoad = () => {
    console.log("Logo image loaded successfully:", logoSrc);
    setLogoLoaded(true);
  };

  return (
    <div className="flex flex-col items-center mb-8">
      <img 
        src={logoSrc}
        alt="FormaCert Logo" 
        className="w-48 mb-4"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      <h1 className="text-2xl font-bold text-gray-800">Bienvenue sur FormaCert</h1>
    </div>
  );
};

export default Logo;
