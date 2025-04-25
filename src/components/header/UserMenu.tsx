
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MenuIcon, User, LogOut, Settings, Database, CloudSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

interface UserMenuProps {
  user: any;
  isDatabaseConnected: boolean;
  handleForceSync: () => Promise<void>;
  handleLogout: () => void;
  isOnline: boolean;
  isSyncing: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({
  user,
  isDatabaseConnected,
  handleForceSync,
  handleLogout,
  isOnline,
  isSyncing
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>
              <MenuIcon className="h-4 w-4 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user && (
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            <span>{user?.email}</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleForceSync} disabled={!isOnline || isSyncing}>
          <CloudSun className="mr-2 h-4 w-4" />
          <span>
            {isSyncing ? 'Synchronisation...' : 'Forcer la synchronisation'}
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuItem>
          <Link to="/database-test" className="flex items-center w-full">
            <Database className="mr-2 h-4 w-4" />
            <span>
              {isDatabaseConnected ? 'Base de données OK' : 'Tester la base de données'}
            </span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem>
          <Link to="/settings" className="flex items-center w-full">
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
