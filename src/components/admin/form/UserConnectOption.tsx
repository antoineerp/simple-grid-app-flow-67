
import React from 'react';

interface UserConnectOptionProps {
  checked: boolean;
  onChange: () => void;
}

const UserConnectOption = ({ checked, onChange }: UserConnectOptionProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <label htmlFor="connect" className="text-right text-sm">Options</label>
      <div className="col-span-3 flex items-center space-x-2">
        <input
          type="checkbox"
          id="connect"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="connect" className="text-sm text-gray-700">
          Se connecter automatiquement après la création
        </label>
      </div>
    </div>
  );
};

export default UserConnectOption;
