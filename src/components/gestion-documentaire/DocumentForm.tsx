
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Document } from '@/types/documents';

interface DocumentFormProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (document: Document) => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ document, open, onOpenChange, onSave }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Document>({
    id: '',
    nom: '',
    fichier_path: null,
    responsabilites: { r: [], a: [], c: [], i: [] },
    etat: null,
    date_creation: new Date().toISOString(),
    date_modification: new Date().toISOString(),
    exclusion: false
  });

  useEffect(() => {
    if (document) {
      setFormData({
        id: document.id || crypto.randomUUID(),
        nom: document.nom || '',
        fichier_path: document.fichier_path || null,
        responsabilites: document.responsabilites || { r: [], a: [], c: [], i: [] },
        etat: document.etat || null,
        date_creation: document.date_creation || new Date().toISOString(),
        date_modification: document.date_modification || new Date().toISOString(),
        exclusion: document.exclusion || false
      });
    }
  }, [document]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDocument = {
      ...formData,
      date_modification: new Date().toISOString() // Always update modification date on save
    };
    
    onSave(updatedDocument);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{document?.id ? "Modifier le document" : "Nouveau document"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">
                Nom
              </Label>
              <Input
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fichier_path" className="text-right">
                Chemin du fichier
              </Label>
              <Input
                id="fichier_path"
                name="fichier_path"
                value={formData.fichier_path || ''}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="URL ou chemin du document"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentForm;
