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

const GestionDocumentaire = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newDocument, setNewDocument] = useState<Omit<Document, 'id'>>({
    titre: '',
    description: '',
    dateCreation: new Date(),
    type: 'Facture',
    statut: 'Nouveau',
    estImportant: false,
    estExclu: false,
  });
  const [editingDocumentId, setEditingDocumentId] = useState<number | null>(null);
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
  const { data: summary, isLoading, isError } = useDocumentSummary();

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
      setStats({
        ...calculatedStats,
        exclusion: calculatedStats.excluded
      });
    }
  }, [documents]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setNewDocument(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDateChange = (date: DateRange | undefined) => {
    setDate(date);
    if (date?.from) {
      setNewDocument(prev => ({
        ...prev,
        dateCreation: date.from,
      }));
    }
  };

  const handleAddDocument = async () => {
    try {
      const addedDocument = await addDocument(currentUser, newDocument);
      setDocuments(prev => [...prev, addedDocument]);
      setNewDocument({
        titre: '',
        description: '',
        dateCreation: new Date(),
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

  const handleUpdateDocument = async (id: number, updatedDocument: Document) => {
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

  const handleDeleteDocument = async (id: number) => {
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
      await saveDocuments(currentUser, documents);
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
            <Label htmlFor="titre">Titre</Label>
            <Input
              type="text"
              id="titre"
              name="titre"
              value={newDocument.titre}
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
            <TableHead className="w-[100px]">Titre</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Important</TableHead>
            <TableHead>Exclure</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map(document => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">{document.titre}</TableCell>
              <TableCell>{document.description}</TableCell>
              <TableCell>{document.dateCreation.toLocaleDateString()}</TableCell>
              <TableCell>{document.type}</TableCell>
              <TableCell>{document.statut}</TableCell>
              <TableCell>{document.estImportant ? 'Oui' : 'Non'}</TableCell>
              <TableCell>{document.estExclu ? 'Oui' : 'Non'}</TableCell>
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
