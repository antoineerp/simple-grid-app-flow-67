
import React, { useState, useEffect } from 'react';
import { FileText, Edit, Check, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FileLinkProps {
  filePath: string;
  onPathChange?: (newPath: string) => void;
  editable?: boolean;
}

const FileLink: React.FC<FileLinkProps> = ({ 
  filePath, 
  onPathChange, 
  editable = false 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(filePath);

  useEffect(() => {
    setEditValue(filePath);
  }, [filePath]);

  const handleSave = () => {
    if (onPathChange) {
      onPathChange(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(filePath);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!filePath && !editable) {
    return (
      <div className="text-gray-400">
        <FileText className="h-4 w-4 inline-block mr-1" />
        <span className="text-sm">Aucun fichier</span>
      </div>
    );
  }

  if (isEditing && editable) {
    return (
      <div className="flex items-center gap-2 w-full">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="https://exemple.com/lien"
          className="text-sm flex-1"
          autoFocus
        />
        <Button
          onClick={handleSave}
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          onClick={handleCancel}
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (!filePath) {
    return (
      <div 
        className={`text-gray-400 flex items-center ${editable ? 'cursor-pointer hover:text-gray-600' : ''}`}
        onClick={() => editable && setIsEditing(true)}
      >
        <FileText className="h-4 w-4 inline-block mr-1" />
        <span className="text-sm">Cliquer pour ajouter un lien</span>
        {editable && <Edit className="h-3 w-3 ml-2" />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a 
        href={filePath}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <FileText className="h-4 w-4 mr-1" />
        <span className="text-sm truncate max-w-[200px]">
          {filePath.startsWith('http') ? new URL(filePath).hostname : filePath.split('/').pop()}
        </span>
      </a>
      {editable && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        >
          <Edit className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default FileLink;
