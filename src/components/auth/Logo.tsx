
import React, { useState } from 'react';

const Logo = () => {
  const [imageSrc, setImageSrc] = useState('/lovable-uploads/50481013-f813-47b1-84d2-82c297771514.png');
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      console.log(`Logo image failed to load: ${imageSrc}, trying fallback`);
      setImageSrc("/logo-swiss.svg");
    }
  };

  const handleImageSuccess = () => {
    console.log(`Logo image loaded successfully: ${imageSrc}`);
  };

  return (
    <div className="flex flex-col items-center justify-center mb-8">
      <img 
        src={imageSrc} 
        alt="Qualite.cloud Logo" 
        className="h-24 mb-4"
        onError={handleImageError}
        onLoad={handleImageSuccess}
      />
      <h2 className="text-2xl font-semibold text-gray-800">Qualite.cloud</h2>
      <p className="text-gray-600 mt-1">Plateforme de Gestion de Certification</p>
    </div>
  );
};

export default Logo;
