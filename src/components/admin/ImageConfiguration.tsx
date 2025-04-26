
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from '@/config/apiConfig';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ImageConfiguration = () => {
  const { toast } = useToast();
  const [sidebarImageUrl, setSidebarImageUrl] = useState<string>('/lovable-uploads/swiss-army-knife-logo.png');
  const [sidebarLinkUrl, setSidebarLinkUrl] = useState<string>('');
  const [pdfLogo, setPdfLogo] = useState<string>('/lovable-uploads/formacert-logo.png');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sidebarImage, sidebarLink, pdfImage] = await Promise.all([
        fetchConfig('sidebarImageUrl'),
        fetchConfig('sidebarLinkUrl'),
        fetchConfig('pdfLogo')
      ]);

      if (sidebarImage) setSidebarImageUrl(sidebarImage);
      if (sidebarLink) setSidebarLinkUrl(sidebarLink);
      if (pdfImage) setPdfLogo(pdfImage);
    } catch (error) {
      console.error('Erreur lors du chargement des configurations:', error);
      setError("Impossible de charger les configurations. Veuillez réessayer plus tard.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConfig = async (key: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/controllers/GlobalConfigController.php?key=${key}`);
      
      if (!response.ok) {
        console.error(`Erreur lors de la récupération de la configuration ${key}: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      return data.data?.value;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la configuration ${key}:`, error);
      return null;
    }
  };

  const saveConfig = async (key: string, value: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/controllers/GlobalConfigController.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur lors de la sauvegarde (${response.status}):`, errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      // Mettre à jour le localStorage pour une utilisation immédiate
      localStorage.setItem(key, value);

      toast({
        title: "Configuration sauvegardée",
        description: "Les modifications ont été enregistrées avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder les modifications: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive",
      });
    }
  };

  // Fonction pour redimensionner l'image si elle est trop grande
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          
          // Si l'image est plus grande que les dimensions max, la redimensionner
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Impossible de créer un contexte canvas"));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir à un format plus léger avec compression
          const quality = 0.85; // 85% de qualité
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Erreur lors de la conversion du canvas en blob"));
                return;
              }
              
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error("Erreur lors du chargement de l'image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier"));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'sidebar' | 'pdf') => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Montrer un toast de chargement
        toast({
          title: "Traitement de l'image",
          description: "Veuillez patienter pendant que nous traitons votre image...",
        });
        
        // Redimensionner si nécessaire
        const maxWidth = 800; // px
        const maxHeight = 800; // px
        
        const base64String = await resizeImage(file, maxWidth, maxHeight);
        
        if (type === 'sidebar') {
          setSidebarImageUrl(base64String);
          await saveConfig('sidebarImageUrl', base64String);
        } else {
          setPdfLogo(base64String);
          await saveConfig('pdfLogo', base64String);
        }
      } catch (error) {
        console.error("Erreur lors du traitement de l'image:", error);
        toast({
          title: "Erreur",
          description: `Impossible de traiter l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleSidebarLinkChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setSidebarLinkUrl(url);
    await saveConfig('sidebarLinkUrl', url);
  };

  const testPdfImage = () => {
    // Tester l'image en ouvrant une petite fenêtre avec l'image
    const win = window.open("", "_blank", "width=300,height=300");
    if (win) {
      win.document.write(`
        <html>
          <head><title>Test image PDF</title></head>
          <body>
            <h3>Image PDF actuelle:</h3>
            <img src="${pdfLogo}" style="max-width:100%; max-height:200px;" />
            <p>Cette image sera utilisée dans les documents PDF générés.</p>
          </body>
        </html>
      `);
    } else {
      toast({
        title: "Impossible d'ouvrir la fenêtre",
        description: "Veuillez autoriser les popups pour ce site.",
        variant: "destructive"
      });
    }
  };

  const refreshConfigurations = () => {
    toast({
      title: "Rafraîchissement",
      description: "Récupération des configurations depuis le serveur..."
    });
    loadConfigurations();
  };

  if (isLoading) {
    return <div className="p-4">Chargement des configurations...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" size="sm" className="mt-2" onClick={refreshConfigurations}>
            Réessayer
          </Button>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Image de la barre latérale</CardTitle>
          <CardDescription>
            Personnalisez l'image qui apparaît sous le menu principal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sidebarImage">Image actuelle</Label>
            <div className="w-24 h-24 relative">
              <img 
                src={sidebarImageUrl} 
                alt="Logo sidebar" 
                className="w-full h-full object-contain"
              />
            </div>
            <Input
              id="sidebarImage"
              type="file"
              accept="image/*"
              onChange={(event) => handleImageChange(event, 'sidebar')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sidebarLink">Lien associé à l'image</Label>
            <Input
              id="sidebarLink"
              type="url"
              placeholder="https://..."
              value={sidebarLinkUrl}
              onChange={handleSidebarLinkChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo pour les documents PDF</CardTitle>
          <CardDescription>
            Personnalisez le logo qui apparaîtra en haut à gauche des documents PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pdfLogo">Logo actuel</Label>
            <div className="w-24 h-24 relative">
              <img 
                src={pdfLogo} 
                alt="Logo PDF" 
                className="w-full h-full object-contain"
              />
            </div>
            <Input
              id="pdfLogo"
              type="file"
              accept="image/*"
              onChange={(event) => handleImageChange(event, 'pdf')}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <Button 
                variant="secondary" 
                onClick={testPdfImage}
              >
                Tester cette image
              </Button>
              <Button 
                variant="outline" 
                onClick={refreshConfigurations}
              >
                Rafraîchir
              </Button>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              <p>Après avoir changé le logo, vous devrez peut-être vider le cache du navigateur ou vous déconnecter/reconnecter pour voir les changements dans les PDF générés.</p>
              <p className="mt-1">Si votre image est trop grande, elle sera automatiquement redimensionnée pour optimiser les performances.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageConfiguration;
