
import React from 'react';

const Logo = () => {
  return (
    <div className="flex flex-col items-center justify-center mb-8">
      <img 
        src="/lovable-uploads/formacert-logo.png" 
        alt="Formacert Logo" 
        className="h-24 mb-4"
        onError={(e) => {
          console.log("Logo image failed to load, switching to fallback image");
          // Utiliser l'image de secours au lieu de masquer l'image
          e.currentTarget.src = "/lovable-uploads/formacert-logo.png";
        }}
        onLoad={() => console.log("Logo image loaded successfully: formacert-logo.png")}
      />
      <h2 className="text-2xl font-semibold text-gray-800">Qualite.cloud</h2>
      <p className="text-gray-600 mt-1">Plateforme de Gestion de Certification</p>
    </div>
  );
};

export default Logo;
