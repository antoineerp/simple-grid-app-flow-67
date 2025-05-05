
import React, { useState } from 'react';
import { useDataSync } from '@/hooks/useDataSync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TestData {
  message: string;
  createdAt: string;
}

const DbTest = () => {
  const [inputText, setInputText] = useState('');
  const { 
    data, 
    updateData, 
    resetData, 
    syncWithServer, 
    isSyncing, 
    isOnline, 
    status, 
    lastSynced, 
    lastError, 
    pendingChanges 
  } = useDataSync<TestData>(
    'test-data',
    { message: 'Test initial', createdAt: new Date().toISOString() },
    'test-sync'
  );
  
  const handleUpdateMessage = () => {
    if (!inputText.trim()) return;
    
    updateData({
      message: inputText,
      createdAt: new Date().toISOString()
    });
    
    setInputText('');
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test de la base de données</h1>
      
      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">État actuel</h2>
        <p><strong>Message:</strong> {data.message}</p>
        <p><strong>Date de création:</strong> {new Date(data.createdAt).toLocaleString()}</p>
        <p><strong>En synchronisation:</strong> {isSyncing ? 'Oui' : 'Non'}</p>
        <p><strong>En ligne:</strong> {isOnline ? 'Oui' : 'Non'}</p>
        <p><strong>État:</strong> {status}</p>
        <p><strong>Dernière synchro:</strong> {lastSynced ? lastSynced.toLocaleString() : 'Jamais'}</p>
        <p><strong>Dernière erreur:</strong> {lastError ? lastError.message : 'Aucune'}</p>
        <p><strong>Modifications en attente:</strong> {pendingChanges}</p>
      </div>
      
      <div className="flex items-center space-x-2 mb-4">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Nouveau message"
          className="flex-1"
        />
        <Button onClick={handleUpdateMessage}>Mettre à jour</Button>
      </div>
      
      <div className="space-x-2">
        <Button onClick={() => syncWithServer()} disabled={isSyncing}>
          {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
        </Button>
        <Button variant="outline" onClick={resetData}>Réinitialiser</Button>
      </div>
    </div>
  );
};

export default DbTest;
