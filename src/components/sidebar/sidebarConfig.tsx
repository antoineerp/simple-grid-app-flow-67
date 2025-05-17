
import React from 'react';
import { 
  Home, 
  FileText, 
  BookOpen, 
  Briefcase, 
  Users, 
  CheckSquare,
  FolderSync
} from 'lucide-react';

export const navigationItems = [
  {
    path: '/',
    icon: Home,
    label: 'Accueil'
  },
  {
    path: '/pilotage',
    icon: Briefcase,
    label: 'Pilotage'
  },
  {
    path: '/gestion-documentaire',
    icon: FileText,
    label: 'Gestion documentaire'
  },
  {
    path: '/bibliotheque',
    icon: BookOpen,
    label: 'Bibliothèque'
  },
  {
    path: '/exigences',
    icon: CheckSquare,
    label: 'Exigences'
  },
  {
    path: '/ressources-humaines',
    icon: Users,
    label: 'Ressources humaines'
  },
  {
    path: '/collaboration',
    icon: FolderSync,
    label: 'Collaboration'
  }
];
