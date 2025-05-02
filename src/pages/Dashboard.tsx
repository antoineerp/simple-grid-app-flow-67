
import React from 'react';

const Dashboard = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Bienvenue</h2>
          <p className="text-gray-600">Bienvenue sur votre tableau de bord.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
