
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface LogoSelectorProps {
  currentLogo: string;
  onLogoChange: (logo: string) => void;
}

const LogoSelector: React.FC<LogoSelectorProps> = ({ currentLogo, onLogoChange }) => {
  const [open, setOpen] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState(currentLogo);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();
  const [predefinedLogos, setPredefinedLogos] = useState<string[]>([]);
  const [fallbackLogo, setFallbackLogo] = useState("/lovable-uploads/4c7adb52-3da0-4757-acbf-50a1eb1d4bf5.png");

  // Initialiser les chemins d'accès aux logos
  useEffect(() => {
    const isLovableEnv = window.location.hostname.includes('lovableproject.com');
    const prefix = isLovableEnv ? "/public" : "";
    
    // Logo principal FormaCert
    const mainLogo = `${prefix}/lovable-uploads/4c7adb52-3da0-4757-acbf-50a1eb1d4bf5.png`;
    setFallbackLogo(mainLogo);
    
    // Logos prédéfinis
    setPredefinedLogos([
      mainLogo,
      `${prefix}/lovable-uploads/4425c340-2ce3-416b-abc9-b75906ca8705.png`,
      `${prefix}/lovable-uploads/aba57440-1db2-49ba-8273-c60d6a77b6ee.png`,
    ]);
  }, []);

  // Ajuster le chemin du logo actuel si nécessaire
  const adjustedCurrentLogo = imageError ? fallbackLogo : selectedLogo;

  const handleLogoSelect = (logo: string) => {
    setSelectedLogo(logo);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error("Logo image failed to load:", selectedLogo);
    setImageError(true);
  };

  const handleSave = () => {
    onLogoChange(selectedLogo);
    setOpen(false);
    
    toast({
      title: "Logo modifié",
      description: "Le logo a été modifié avec succès",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="hover:opacity-80 focus:outline-none">
          <img 
            src={adjustedCurrentLogo}
            alt="Logo" 
            className="h-10"
            onError={handleImageError}
          />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Changer de logo</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {predefinedLogos.map((logo, index) => (
            <div 
              key={index}
              className={`p-4 rounded-md border cursor-pointer flex justify-center items-center ${selectedLogo === logo ? 'border-app-blue bg-blue-50' : 'border-gray-200'}`}
              onClick={() => handleLogoSelect(logo)}
            >
              <img 
                src={logo} 
                alt={`Logo ${index + 1}`} 
                className="h-12"
                onError={(e) => {
                  console.error("Failed to load logo:", logo);
                  e.currentTarget.src = fallbackLogo;
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4 space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Appliquer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogoSelector;
