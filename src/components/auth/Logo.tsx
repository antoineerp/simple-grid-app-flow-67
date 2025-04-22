
import React, { useState, useEffect } from 'react';

const Logo = () => {
  const [logoSrc, setLogoSrc] = useState("/lovable-uploads/formacert-logo.png");
  const [logoLoaded, setLogoLoaded] = useState(false);

  const fallbackImages = [
    "/lovable-uploads/formacert-logo.png",
    "/public/lovable-uploads/aba57440-1db2-49ba-8273-c60d6a77b6ee.png"
  ];
  
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const handleImageError = () => {
    if (fallbackIndex < fallbackImages.length) {
      console.log(`Logo image failed to load: ${logoSrc}, trying fallback: ${fallbackImages[fallbackIndex]}`);
      setLogoSrc(fallbackImages[fallbackIndex]);
      setFallbackIndex(fallbackIndex + 1);
    } else {
      console.error("All logo images failed to load");
    }
  };

  const handleImageLoad = () => {
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
