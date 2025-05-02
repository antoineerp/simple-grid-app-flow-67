
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="text-6xl font-bold text-gray-300">404</div>
      <h1 className="text-3xl font-bold mt-6 mb-2">Page introuvable</h1>
      <p className="text-muted-foreground mb-8 text-center">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => navigate(-1)}>
          Retour en arrière
        </Button>
        <Button variant="outline" onClick={() => navigate('/')}>
          Accueil
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
