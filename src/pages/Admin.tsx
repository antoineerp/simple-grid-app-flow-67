import React from 'react';

// Defining the props interface for Admin component
interface AdminProps {
  currentDatabaseUser: string | null;
  onUserConnect: (identifiant: string) => void;
}

const Admin: React.FC<AdminProps> = ({ currentDatabaseUser, onUserConnect }) => {
  return (
    <div>
      <h1>Administration</h1>
      <p>User: {currentDatabaseUser || 'Not connected'}</p>
      {/* Rest of the admin component */}
    </div>
  );
};

export default Admin;
