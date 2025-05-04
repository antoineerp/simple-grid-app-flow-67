
import { Users, FileText, FolderOpen, Settings } from "lucide-react";

export const navigationItems = [
  {
    path: "/",
    icon: <FileText className="h-5 w-5" />,
    label: "Gestion Documentaire"
  },
  {
    path: "/ressources-humaines",
    icon: <Users className="h-5 w-5" />,
    label: "Ressources Humaines"
  },
  {
    path: "/collaboration",
    icon: <FolderOpen className="h-5 w-5" />,
    label: "Collaboration"
  },
  {
    path: "/admin",
    icon: <Settings className="h-5 w-5" />,
    label: "Administration"
  }
];
