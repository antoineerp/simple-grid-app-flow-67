
import { Users, FileText, FolderOpen, Settings } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface NavigationItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

export const navigationItems: NavigationItem[] = [
  {
    path: "/",
    icon: FileText,
    label: "Gestion Documentaire"
  },
  {
    path: "/ressources-humaines",
    icon: Users,
    label: "Ressources Humaines"
  },
  {
    path: "/collaboration",
    icon: FolderOpen,
    label: "Collaboration"
  },
  {
    path: "/admin",
    icon: Settings,
    label: "Administration"
  }
];
