
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Document } from '@/types/documents';
import { fetchDocuments, saveDocuments, addDocument, updateDocument, deleteDocument, calculateDocumentStats } from '@/services/documents';
import { useToast } from "@/hooks/use-toast";
import { getUserId } from '@/services/auth/authService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import useDocumentSummary from '@/hooks/useDocumentSummary';

interface DocumentFormType {
  nom: string;
  description?: string;
  date_creation: Date;
  type?: string;
  statut?: string;
  estImportant?: boolean;
  estExclu?: boolean;
}

const GestionDocumentaire = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newDocument, setNewDocument] = useState<DocumentFormType>({
    nom: '',
    description: '',
    date_creation: new Date(),
    type: 'Facture',
    statut: 'Nouveau',
    estImportant: false,
    estExclu: false,
  });
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    important: 0,
    factures: 0,
    contrats: 0,
    autres: 0,
    nouveau: 0,
    enCours: 0,
    termine: 0,
    excluded: 0,
    exclusion: 0
  });
  const { toast } = useToast();
  const currentUser = getUserId() || 'defaultUser';
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2023, 0, 1),
    to: new Date(),
  })
  const { stats: documentStats, loading } = useDocumentSummary();

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const loadedDocuments = await fetchDocuments(currentUser);
        setDocuments(loadedDocuments);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les documents",
          variant: "destructive",
        });
      }
    };

    loadDocuments();
  }, [currentUser, toast]);
    
  useEffect(() => {
    if (documents && documents.length > 0) {
      const calculatedStats = calculateDocumentStats(documents);
      // Add missing properties to match the stats state shape
      setStats({
        total: calculatedStats.total,
        important: 0, // Default values for stats not in calculatedStats
        factures: 0,
        contrats: 0,
        autres: 0,
        nouveau: 0, 
        enCours: 0,
        termine: 0,
        excluded: calculatedStats.exclusion,
        exclusion: calculatedStats.exclusion
      });
    }
  }, [documents]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
    
    setNewDocument(prev => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));
  };

  const handleDateChange = (date: DateRange | undefined) => {
    setDate(date);
    if (date?.from) {
      setNewDocument(prev => ({
        ...prev,
        date_creation: date.from,
      }));
    }
  };

  const handleAddDocument = async () => {
    try {
      // Transform form data to match Document type
      const documentToAdd = {
        nom: newDocument.nom,
        date_creation: newDocument.date_creation,
        date_modification: new Date(),
        fichier_path: null,
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: newDocument.estExclu ? 'EX' : null
      };
      
      const addedDocument = await addDocument(currentUser, documentToAdd);
      setDocuments(prev => [...prev, addedDocument]);
      setNewDocument({
        nom: '',
        description: '',
        date_creation: new Date(),
        type: 'Facture',
        statut: 'Nouveau',
        estImportant: false,
        estExclu: false,
      });
      toast({
        title: "Succès",
        description: "Document ajouté avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le document",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDocument = async (id: string, updatedDocument: Document) => {
    try {
      await updateDocument(currentUser, id, updatedDocument);
      setDocuments(prev =>
        prev.map(doc => (doc.id === id ? updatedDocument : doc))
      );
      setEditingDocumentId(null);
      toast({
        title: "Succès",
        description: "Document mis à jour avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le document",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocument(currentUser, id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast({
        title: "Succès",
        description: "Document supprimé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
        variant: "destructive",
      });
    }
  };

  const handleSaveDocuments = async () => {
    try {
      await saveDocuments(documents, currentUser);
      toast({
        title: "Succès",
        description: "Documents sauvegardés avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les documents",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Gestion Documentaire</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Ajouter un Document</CardTitle>
          <CardDescription>
            Ajouter un nouveau document à la base de données
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="nom">Nom</Label>
            <Input
              type="text"
              id="nom"
              name="nom"
              value={newDocument.nom}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              type="text"
              id="description"
              name="description"
              value={newDocument.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select onValueChange={(value) => handleInputChange({ target: { name: 'type', value } } as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Facture">Facture</SelectItem>
                <SelectItem value="Contrat">Contrat</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="statut">Statut</Label>
            <Select onValueChange={(value) => handleInputChange({ target: { name: 'statut', value } } as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nouveau">Nouveau</SelectItem>
                <SelectItem value="En Cours">En Cours</SelectItem>
                <SelectItem value="Terminé">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="estImportant">Important</Label>
            <Input
              type="checkbox"
              id="estImportant"
              name="estImportant"
              checked={newDocument.estImportant}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="estExclu">Exclure des stats</Label>
            <Input
              type="checkbox"
              id="estExclu"
              name="estExclu"
              checked={newDocument.estExclu}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid gap-2">
            <Label>Date de création</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="range"
                  defaultMonth={new Date()}
                  selected={date}
                  onSelect={handleDateChange}
                  numberOfMonths={2}
                  pagedNavigation
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAddDocument}>Ajouter</Button>
        </CardFooter>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Statistiques des Documents</CardTitle>
          <CardDescription>
            Aperçu des statistiques des documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>Total: {stats.total}</div>
            <div>Important: {stats.important}</div>
            <div>Factures: {stats.factures}</div>
            <div>Contrats: {stats.contrats}</div>
            <div>Autres: {stats.autres}</div>
            <div>Nouveau: {stats.nouveau}</div>
            <div>En Cours: {stats.enCours}</div>
            <div>Terminé: {stats.termine}</div>
            <div>Exclus: {stats.exclusion}</div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveDocuments}>Sauvegarder</Button>
        </CardFooter>
      </Card>

      <Table>
        <TableCaption>Liste des documents</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Nom</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead>Date de modification</TableHead>
            <TableHead>État</TableHead>
            <TableHead>Fichier</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map(document => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">{document.nom}</TableCell>
              <TableCell>{document.date_creation.toLocaleDateString()}</TableCell>
              <TableCell>{document.date_modification.toLocaleDateString()}</TableCell>
              <TableCell>{document.etat || 'Non défini'}</TableCell>
              <TableCell>{document.fichier_path || 'Aucun fichier'}</TableCell>
              <TableCell className="text-right">
                {editingDocumentId === document.id ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateDocument(document.id, document)}
                    >
                      Enregistrer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingDocumentId(null)}
                    >
                      Annuler
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setEditingDocumentId(document.id)}
                    >
                      Modifier
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">Supprimer</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous sûr(e) ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteDocument(document.id)}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default GestionDocumentaire;
